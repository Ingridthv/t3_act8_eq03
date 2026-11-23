package mx.edu.controlalumnos.admin;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.security.SecureRandom;
import java.util.Map;
import java.util.UUID;
import mx.edu.controlalumnos.dto.PageResponse;
import mx.edu.controlalumnos.exception.ConflictoException;
import mx.edu.controlalumnos.exception.RecursoNoEncontradoException;
import mx.edu.controlalumnos.exception.SolicitudInvalidaException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AlumnoAdminService {

    public record AlumnoRequest(
            @NotBlank(message = "El nombre es obligatorio.") @Size(max = 80, message = "El nombre admite máximo 80 caracteres.")
            String nombre,
            @NotBlank(message = "Los apellidos son obligatorios.") @Size(max = 120, message = "Los apellidos admiten máximo 120 caracteres.")
            String apellidos,
            @NotBlank(message = "El correo institucional es obligatorio.") @Email(message = "Escribe un correo válido.")
            String correo,
            @Email(message = "El correo de contacto no es válido.")
            String correoContacto,
            @Pattern(regexp = "^$|^\\+?\\d{10,14}$", message = "El teléfono debe tener de 10 a 14 dígitos.")
            String telefono,
            @NotNull(message = "Selecciona una carrera.") Short carreraId,
            @NotNull(message = "El semestre es obligatorio.") @Min(value = 1, message = "El semestre debe estar entre 1 y 14.")
            @Max(value = 14, message = "El semestre debe estar entre 1 y 14.")
            Integer semestre,
            @Pattern(regexp = "^(activo|baja|egresado)$", message = "El estatus no es válido.")
            String estatus,
            @Pattern(regexp = "^$|^\\d{5}$", message = "El código postal debe tener 5 dígitos.")
            String codigoPostal,
            String estado
    ) {}

    private static final SecureRandom RANDOM = new SecureRandom();

    private static final String SELECT = """
        SELECT a.id, a.matricula, a.nombre,
               (a.apellido_paterno || COALESCE(' ' || a.apellido_materno, '')) AS apellidos,
               a.correo, a.telefono, a.carrera_id, c.nombre AS carrera, a.semestre_actual AS semestre,
               a.anio_ingreso, a.estatus, a.codigo_postal, a.estado, a.foto_url,
               u.correo_contacto, p.promedio
        """;
    private static final String FROM = """
         FROM alumnos a
         JOIN carreras c ON c.id = a.carrera_id
         LEFT JOIN usuarios u ON u.alumno_id = a.id
         LEFT JOIN vw_promedio_alumno p ON p.alumno_id = a.id
        """;

    private final JdbcTemplate jdbc;
    private final CuentaService cuentas;

    public AlumnoAdminService(JdbcTemplate jdbc, CuentaService cuentas) {
        this.jdbc = jdbc;
        this.cuentas = cuentas;
    }

    @Transactional(readOnly = true)
    public PageResponse<Map<String, Object>> listar(String q, String carrera, String semestre, String estatus,
                                                    String ingreso, int page, int size) {
        ConsultaSql c = new ConsultaSql()
                .buscar(q, "(a.nombre || ' ' || a.apellido_paterno || ' ' || COALESCE(a.apellido_materno, ''))",
                        "a.matricula", "a.correo");
        if (carrera != null && !carrera.isBlank()) {
            c.y("a.carrera_id = ?", DocenteAdminService.parseShort(carrera));
        }
        if (semestre != null && !semestre.isBlank()) {
            c.y("a.semestre_actual = ?", DocenteAdminService.parseShort(semestre));
        }
        if (estatus != null && !estatus.isBlank()) {
            c.y("a.estatus = ?", estatus.trim().toLowerCase());
        }
        if (ingreso != null && !ingreso.isBlank()) {
            c.y("a.anio_ingreso = ?", DocenteAdminService.parseShort(ingreso));
        }
        return c.pagina(jdbc, SELECT, FROM, "a.matricula", page, size);
    }

    @Transactional
    public Map<String, Object> crear(AlumnoRequest r) {
        return obtener(crearAlumno(r));
    }

    /** Alta de alumno + su cuenta. Si no llega correo institucional, se usa matrícula@itoaxaca.edu.mx. */
    @Transactional
    public UUID crearAlumno(AlumnoRequest r) {
        if (r.correoContacto() == null || r.correoContacto().isBlank()) {
            throw new SolicitudInvalidaException("El correo de contacto es obligatorio: ahí se envían las credenciales.");
        }
        verificarCarrera(r.carreraId());

        short anio = anioIngreso();
        String matricula = nuevaMatricula(anio);
        String correo = r.correo() == null || r.correo().isBlank()
                ? matricula + "@itoaxaca.edu.mx" : r.correo().trim().toLowerCase();
        if (existe("SELECT COUNT(*) FROM alumnos WHERE lower(correo) = ?", correo)) {
            throw new ConflictoException("Ya existe un alumno con ese correo.");
        }
        String[] ap = separarApellidos(r.apellidos());

        UUID id = jdbc.queryForObject("""
            INSERT INTO alumnos (matricula, nombre, apellido_paterno, apellido_materno, correo, telefono,
                                 carrera_id, semestre_actual, anio_ingreso, estatus, codigo_postal, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id
            """, UUID.class, matricula, r.nombre().trim(), ap[0], ap[1], correo,
                CuentaService.blanco(r.telefono()), r.carreraId(), r.semestre(), anio,
                estatusOr(r.estatus()), CuentaService.blanco(r.codigoPostal()), CuentaService.blanco(r.estado()));

        cuentas.crear("estudiante", correo, r.correoContacto(), r.telefono(), id, null,
                r.nombre().trim() + " " + ap[0]);
        return id;
    }

    @Transactional
    public Map<String, Object> actualizar(UUID id, AlumnoRequest r) {
        obtener(id);
        String correo = r.correo().trim().toLowerCase();
        if (existe("SELECT COUNT(*) FROM alumnos WHERE lower(correo) = ? AND id <> ?", correo, id)) {
            throw new ConflictoException("Ya existe otro alumno con ese correo.");
        }
        if (cuentas.correoEnUso(correo, id)) {
            throw new ConflictoException("Ya existe un usuario con ese correo.");
        }
        verificarCarrera(r.carreraId());
        String[] ap = separarApellidos(r.apellidos());
        String estatus = estatusOr(r.estatus());

        jdbc.update("""
            UPDATE alumnos SET nombre = ?, apellido_paterno = ?, apellido_materno = ?, correo = ?, telefono = ?,
                   carrera_id = ?, semestre_actual = ?, estatus = ?, codigo_postal = ?, estado = ?
             WHERE id = ?
            """, r.nombre().trim(), ap[0], ap[1], correo, CuentaService.blanco(r.telefono()), r.carreraId(),
                r.semestre(), estatus, CuentaService.blanco(r.codigoPostal()), CuentaService.blanco(r.estado()), id);
        jdbc.update("""
            UPDATE usuarios SET correo = ?, correo_contacto = COALESCE(?, correo_contacto),
                   telefono_contacto = COALESCE(?, telefono_contacto), activo = ?
             WHERE alumno_id = ?
            """, correo, CuentaService.blanco(r.correoContacto()), CuentaService.blanco(r.telefono()),
                !estatus.equals("baja"), id);
        return obtener(id);
    }

    @Transactional
    public void eliminar(UUID id) {
        obtener(id);
        if (existe("SELECT COUNT(*) FROM inscripciones WHERE alumno_id = ?", id)) {
            throw new ConflictoException(
                    "No se puede eliminar: el alumno tiene inscripciones o calificaciones. Cámbialo a estatus Baja.");
        }
        jdbc.update("DELETE FROM alumnos WHERE id = ?", id);
    }

    // el año de ingreso de un alumno nuevo es el del periodo actual
    private short anioIngreso() {
        try {
            Short a = jdbc.queryForObject("SELECT anio FROM periodos WHERE es_actual", Short.class);
            return a == null ? (short) java.time.Year.now().getValue() : a;
        } catch (org.springframework.dao.EmptyResultDataAccessException e) {
            return (short) java.time.Year.now().getValue();
        }
    }

    // matrícula: 2 dígitos del año de ingreso + 6 dígitos que no se repiten
    private String nuevaMatricula(short anio) {
        for (int i = 0; i < 50; i++) {
            String m = String.format("%02d%06d", anio % 100, RANDOM.nextInt(1_000_000));
            if (!existe("SELECT COUNT(*) FROM alumnos WHERE matricula = ?", m)) {
                return m;
            }
        }
        throw new ConflictoException("No se pudo generar una matrícula. Inténtalo de nuevo.");
    }

    // "Martínez López" -> paterno "Martínez", materno "López"
    private static String[] separarApellidos(String apellidos) {
        String limpio = apellidos.trim().replaceAll("\\s+", " ");
        int i = limpio.indexOf(' ');
        if (i < 0) {
            return new String[] {limpio, null};
        }
        return new String[] {limpio.substring(0, i), limpio.substring(i + 1)};
    }

    private void verificarCarrera(Short id) {
        if (!existe("SELECT COUNT(*) FROM carreras WHERE id = ?", id)) {
            throw new SolicitudInvalidaException("La carrera seleccionada no existe.");
        }
    }

    /** Los alumnos agregados más recientemente (para Inicio). */
    @Transactional(readOnly = true)
    public java.util.List<Map<String, Object>> recientes(int cantidad) {
        return jdbc.queryForList(SELECT + FROM + " ORDER BY a.creado_en DESC, a.matricula LIMIT ?", cantidad);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> detalle(UUID id) {
        return obtener(id);
    }

    private Map<String, Object> obtener(UUID id) {
        try {
            return jdbc.queryForMap(SELECT + FROM + " WHERE a.id = ?", id);
        } catch (org.springframework.dao.EmptyResultDataAccessException e) {
            throw new RecursoNoEncontradoException("El alumno no existe.");
        }
    }

    private static String estatusOr(String e) {
        return e == null || e.isBlank() ? "activo" : e;
    }

    private boolean existe(String sql, Object... args) {
        Integer n = jdbc.queryForObject(sql, Integer.class, args);
        return n != null && n > 0;
    }
}
