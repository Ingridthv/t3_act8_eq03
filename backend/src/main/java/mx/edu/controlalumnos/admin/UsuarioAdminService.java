package mx.edu.controlalumnos.admin;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.Map;
import java.util.UUID;
import mx.edu.controlalumnos.dto.PageResponse;
import mx.edu.controlalumnos.exception.ConflictoException;
import mx.edu.controlalumnos.exception.RecursoNoEncontradoException;
import mx.edu.controlalumnos.exception.SolicitudInvalidaException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Usuarios del sistema. Los alumnos y docentes reciben su cuenta al darlos de alta; aquí se crean administradores. */
@Service
public class UsuarioAdminService {

    public record UsuarioRequest(
            @NotBlank(message = "El nombre es obligatorio.") @Size(max = 80, message = "El nombre admite máximo 80 caracteres.")
            String nombre,
            @NotBlank(message = "El correo es obligatorio.") @Email(message = "Escribe un correo válido.")
            String correo,
            @Email(message = "El correo de contacto no es válido.")
            String correoContacto,
            @Pattern(regexp = "^(Administrador|Docente|Estudiante)$", message = "El rol no es válido.")
            String rol,
            @Pattern(regexp = "^(Activo|Inactivo)$", message = "El estatus no es válido.")
            String estatus
    ) {}

    private static final String SELECT = """
        SELECT u.id, u.correo, u.correo_contacto, u.activo, u.ultimo_acceso, r.nombre AS rol,
               COALESCE(d.nombre || ' ' || d.apellidos,
                        a.nombre || ' ' || a.apellido_paterno,
                        u.nombre, split_part(u.correo, '@', 1)) AS nombre
        """;
    private static final String FROM = """
         FROM usuarios u
         JOIN roles r ON r.id = u.rol_id
         LEFT JOIN docentes d ON d.id = u.docente_id
         LEFT JOIN alumnos a ON a.id = u.alumno_id
        """;

    private final JdbcTemplate jdbc;
    private final CuentaService cuentas;

    public UsuarioAdminService(JdbcTemplate jdbc, CuentaService cuentas) {
        this.jdbc = jdbc;
        this.cuentas = cuentas;
    }

    @Transactional(readOnly = true)
    public PageResponse<Map<String, Object>> listar(String q, String rol, String estatus, int page, int size) {
        ConsultaSql c = new ConsultaSql().buscar(q, "u.correo",
                "COALESCE(d.nombre || ' ' || d.apellidos, a.nombre || ' ' || a.apellido_paterno, u.nombre, '')");
        if (rol != null && !rol.isBlank()) {
            c.y("r.nombre = ?", rol.trim().toLowerCase());
        }
        if ("activo".equalsIgnoreCase(estatus)) {
            c.y("u.activo");
        } else if ("inactivo".equalsIgnoreCase(estatus)) {
            c.y("NOT u.activo");
        }
        return c.pagina(jdbc, SELECT, FROM, "r.id, u.correo", page, size);
    }

    @Transactional
    public Map<String, Object> crear(UsuarioRequest r) {
        if (!"Administrador".equals(r.rol())) {
            throw new SolicitudInvalidaException(
                    "Los docentes y estudiantes se dan de alta en sus módulos: ahí se les crea la cuenta automáticamente.");
        }
        if (r.correoContacto() == null || r.correoContacto().isBlank()) {
            throw new SolicitudInvalidaException("El correo de contacto es obligatorio: ahí se envían las credenciales.");
        }
        String correo = r.correo().trim().toLowerCase();
        cuentas.crear("administrador", correo, r.correoContacto(), null, null, null, r.nombre().trim());
        jdbc.update("UPDATE usuarios SET nombre = ?, activo = ? WHERE lower(correo) = ?",
                r.nombre().trim(), !"Inactivo".equals(r.estatus()), correo);
        UUID id = jdbc.queryForObject("SELECT id FROM usuarios WHERE lower(correo) = ?", UUID.class, correo);
        return obtener(id);
    }

    @Transactional
    public Map<String, Object> actualizar(UUID id, UsuarioRequest r, UUID quienEdita) {
        Map<String, Object> actual = obtener(id);
        boolean activo = !"Inactivo".equals(r.estatus());
        boolean esAdmin = "administrador".equals(actual.get("rol"));
        if (!activo && id.equals(quienEdita)) {
            throw new ConflictoException("No puedes desactivar tu propia cuenta.");
        }
        if (!activo && esAdmin && Boolean.TRUE.equals(actual.get("activo")) && otrosAdminsActivos(id) == 0) {
            throw new ConflictoException("Debe existir al menos un administrador activo.");
        }
        String correo = r.correo().trim().toLowerCase();
        if (cuentas.correoEnUso(correo, id) && !correo.equalsIgnoreCase(String.valueOf(actual.get("correo")))) {
            throw new ConflictoException("Ya existe un usuario con ese correo.");
        }
        // el correo de acceso de alumnos y docentes se cambia desde su módulo
        if (!esAdmin && !correo.equalsIgnoreCase(String.valueOf(actual.get("correo")))) {
            throw new SolicitudInvalidaException("El correo de acceso de alumnos y docentes se cambia desde su módulo.");
        }
        jdbc.update("""
            UPDATE usuarios SET correo = ?, correo_contacto = COALESCE(?, correo_contacto), activo = ?,
                   nombre = CASE WHEN alumno_id IS NULL AND docente_id IS NULL THEN ? ELSE nombre END
             WHERE id = ?
            """, correo, CuentaService.blanco(r.correoContacto()), activo, r.nombre().trim(), id);
        return obtener(id);
    }

    @Transactional
    public void eliminar(UUID id, UUID quienEdita) {
        Map<String, Object> actual = obtener(id);
        if (id.equals(quienEdita)) {
            throw new ConflictoException("No puedes eliminar tu propia cuenta.");
        }
        if (!"administrador".equals(actual.get("rol"))) {
            throw new ConflictoException(
                    "Las cuentas de alumnos y docentes se eliminan junto con su registro, desde su módulo.");
        }
        if (Boolean.TRUE.equals(actual.get("activo")) && otrosAdminsActivos(id) == 0) {
            throw new ConflictoException("Debe existir al menos un administrador activo.");
        }
        jdbc.update("DELETE FROM usuarios WHERE id = ?", id);
    }

    private int otrosAdminsActivos(UUID id) {
        Integer n = jdbc.queryForObject("""
            SELECT COUNT(*) FROM usuarios u JOIN roles r ON r.id = u.rol_id
             WHERE r.nombre = 'administrador' AND u.activo AND u.id <> ?
            """, Integer.class, id);
        return n == null ? 0 : n;
    }

    private Map<String, Object> obtener(UUID id) {
        try {
            return jdbc.queryForMap(SELECT + FROM + " WHERE u.id = ?", id);
        } catch (org.springframework.dao.EmptyResultDataAccessException e) {
            throw new RecursoNoEncontradoException("El usuario no existe.");
        }
    }
}
