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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DocenteAdminService {

    /** Datos que llegan al crear o editar un docente. */
    public record DocenteRequest(
            @NotBlank(message = "La clave es obligatoria.")
            @Pattern(regexp = "^[A-Za-z]{3}-\\d{3}$", message = "Usa el formato DOC-001.")
            String clave,
            @NotBlank(message = "El nombre es obligatorio.") @Size(max = 80, message = "El nombre admite máximo 80 caracteres.")
            String nombre,
            @NotBlank(message = "Los apellidos son obligatorios.") @Size(max = 80, message = "Los apellidos admiten máximo 80 caracteres.")
            String apellidos,
            @Email(message = "Escribe un correo válido.")
            String correo,
            @Email(message = "El correo de contacto no es válido.")
            String correoContacto,
            @Pattern(regexp = "^$|^\\+?\\d{10,14}$", message = "El teléfono debe tener de 10 a 14 dígitos.")
            String telefono,
            @Pattern(regexp = "^(activo|licencia|baja)$", message = "El estatus no es válido.")
            String estatus
    ) {}

    private static final String SELECT = """
        SELECT d.id, d.clave, d.nombre, d.apellidos, d.correo, d.telefono, d.estatus,
               u.correo_contacto,
               (SELECT COUNT(DISTINCT g.materia_id) FROM grupos g WHERE g.docente_id = d.id) AS materias
        """;
    private static final String FROM = " FROM docentes d LEFT JOIN usuarios u ON u.docente_id = d.id";

    private final JdbcTemplate jdbc;
    private final CuentaService cuentas;

    public DocenteAdminService(JdbcTemplate jdbc, CuentaService cuentas) {
        this.jdbc = jdbc;
        this.cuentas = cuentas;
    }

    @Transactional(readOnly = true)
    public PageResponse<Map<String, Object>> listar(String q, String carrera, String estatus, int page, int size) {
        ConsultaSql c = new ConsultaSql()
                .buscar(q, "(d.nombre || ' ' || d.apellidos)", "d.clave", "d.correo");
        if (estatus != null && !estatus.isBlank()) {
            c.y("d.estatus = ?", estatus.trim().toLowerCase());
        }
        if (carrera != null && !carrera.isBlank()) {
            c.y("EXISTS (SELECT 1 FROM grupos g JOIN materias m ON m.id = g.materia_id"
                    + " WHERE g.docente_id = d.id AND m.carrera_id = ?)", parseShort(carrera));
        }
        return c.pagina(jdbc, SELECT, FROM, "d.apellidos, d.nombre", page, size);
    }

    @Transactional
    public Map<String, Object> crear(DocenteRequest r) {
        String clave = r.clave().trim().toUpperCase();
        // el correo institucional es opcional: si no se captura, el usuario de acceso es clave@itoaxaca.edu.mx
        String correo = r.correo() == null || r.correo().isBlank()
                ? clave.toLowerCase() + "@itoaxaca.edu.mx"
                : r.correo().trim().toLowerCase();
        if (existe("SELECT COUNT(*) FROM docentes WHERE clave = ?", clave)) {
            throw new ConflictoException("Ya existe un docente con esa clave.");
        }
        if (existe("SELECT COUNT(*) FROM docentes WHERE lower(correo) = ?", correo)) {
            throw new ConflictoException("Ya existe un docente con ese correo.");
        }
        if (r.correoContacto() == null || r.correoContacto().isBlank()) {
            throw new mx.edu.controlalumnos.exception.SolicitudInvalidaException(
                    "El correo de contacto es obligatorio: ahí se envían las credenciales.");
        }
        UUID id = jdbc.queryForObject("""
            INSERT INTO docentes (clave, nombre, apellidos, correo, telefono, estatus)
            VALUES (?, ?, ?, ?, ?, ?) RETURNING id
            """, UUID.class, clave, r.nombre().trim(), r.apellidos().trim(), correo,
                CuentaService.blanco(r.telefono()), estatusOr(r.estatus()));

        cuentas.crear("docente", correo, r.correoContacto(), r.telefono(), null, id,
                r.nombre().trim() + " " + r.apellidos().trim());
        return obtener(id);
    }

    @Transactional
    public Map<String, Object> actualizar(UUID id, DocenteRequest r) {
        Map<String, Object> actual = obtener(id);
        String clave = r.clave().trim().toUpperCase();
        // si se deja vacío, se conserva el correo de acceso actual
        String correo = r.correo() == null || r.correo().isBlank()
                ? String.valueOf(actual.get("correo")).toLowerCase()
                : r.correo().trim().toLowerCase();
        if (existe("SELECT COUNT(*) FROM docentes WHERE clave = ? AND id <> ?", clave, id)) {
            throw new ConflictoException("Ya existe otro docente con esa clave.");
        }
        if (existe("SELECT COUNT(*) FROM docentes WHERE lower(correo) = ? AND id <> ?", correo, id)) {
            throw new ConflictoException("Ya existe otro docente con ese correo.");
        }
        if (cuentas.correoEnUso(correo, id)) {
            throw new ConflictoException("Ya existe un usuario con ese correo.");
        }
        String estatus = estatusOr(r.estatus());
        jdbc.update("""
            UPDATE docentes SET clave = ?, nombre = ?, apellidos = ?, correo = ?, telefono = ?, estatus = ?
             WHERE id = ?
            """, clave, r.nombre().trim(), r.apellidos().trim(), correo,
                CuentaService.blanco(r.telefono()), estatus, id);
        // la cuenta de acceso sigue al docente: mismo correo y activa mientras no esté de baja
        jdbc.update("""
            UPDATE usuarios SET correo = ?, correo_contacto = COALESCE(?, correo_contacto),
                   telefono_contacto = COALESCE(?, telefono_contacto), activo = ?
             WHERE docente_id = ?
            """, correo, CuentaService.blanco(r.correoContacto()), CuentaService.blanco(r.telefono()),
                !estatus.equals("baja"), id);
        return obtener(id);
    }

    @Transactional
    public void eliminar(UUID id) {
        obtener(id);
        if (existe("SELECT COUNT(*) FROM grupos WHERE docente_id = ?", id)) {
            throw new ConflictoException("No se puede eliminar: el docente tiene grupos asignados.");
        }
        jdbc.update("UPDATE carreras SET coordinador_id = NULL WHERE coordinador_id = ?", id);
        jdbc.update("DELETE FROM docentes WHERE id = ?", id);
    }

    private Map<String, Object> obtener(UUID id) {
        try {
            return jdbc.queryForMap(SELECT + FROM + " WHERE d.id = ?", id);
        } catch (org.springframework.dao.EmptyResultDataAccessException e) {
            throw new RecursoNoEncontradoException("El docente no existe.");
        }
    }

    private boolean existe(String sql, Object... args) {
        Integer n = jdbc.queryForObject(sql, Integer.class, args);
        return n != null && n > 0;
    }

    private static String estatusOr(String e) {
        return e == null || e.isBlank() ? "activo" : e;
    }

    static Short parseShort(String s) {
        try {
            return Short.parseShort(s.trim());
        } catch (NumberFormatException e) {
            throw new mx.edu.controlalumnos.exception.SolicitudInvalidaException("El filtro no es válido.");
        }
    }
}
