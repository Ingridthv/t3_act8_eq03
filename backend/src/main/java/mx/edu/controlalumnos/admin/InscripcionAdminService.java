package mx.edu.controlalumnos.admin;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;
import mx.edu.controlalumnos.admin.AlumnoAdminService.AlumnoRequest;
import mx.edu.controlalumnos.dto.PageResponse;
import mx.edu.controlalumnos.exception.ConflictoException;
import mx.edu.controlalumnos.exception.RecursoNoEncontradoException;
import mx.edu.controlalumnos.exception.SolicitudInvalidaException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Inscripciones. Las materias (grupos) las asigna el administrador a cada inscripción. */
@Service
public class InscripcionAdminService {

    /** Datos de un alumno nuevo que se da de alta junto con su inscripción. */
    public record NuevoAlumno(
            @NotBlank(message = "El nombre es obligatorio.") @Size(max = 80, message = "El nombre admite máximo 80 caracteres.")
            String nombre,
            @NotBlank(message = "Los apellidos son obligatorios.") @Size(max = 120, message = "Los apellidos admiten máximo 120 caracteres.")
            String apellidos,
            @NotBlank(message = "El correo de contacto es obligatorio.") @Email(message = "El correo de contacto no es válido.")
            String correoContacto,
            @Pattern(regexp = "^$|^\\+?\\d{10,14}$", message = "El teléfono debe tener de 10 a 14 dígitos.")
            String telefono,
            @NotNull(message = "Selecciona una carrera.") Short carreraId,
            @NotNull(message = "El semestre es obligatorio.") @Min(value = 1, message = "El semestre debe estar entre 1 y 14.")
            @Max(value = 14, message = "El semestre debe estar entre 1 y 14.")
            Integer semestre
    ) {}

    public record InscripcionRequest(
            UUID alumnoId,
            @Valid NuevoAlumno nuevoAlumno,
            @NotNull(message = "Selecciona un periodo.") Short periodoId,
            @NotNull(message = "La fecha de inscripción es obligatoria.") LocalDate fecha,
            @Pattern(regexp = "^(inscrito|baja)$", message = "El estatus no es válido.")
            String estatus
    ) {}

    private static final String SELECT = """
        SELECT i.id, i.alumno_id, i.periodo_id, a.matricula,
               (a.nombre || ' ' || a.apellido_paterno || COALESCE(' ' || a.apellido_materno, '')) AS alumno,
               c.nombre AS carrera, p.nombre AS periodo, i.fecha_inscripcion, i.estatus,
               (SELECT COUNT(*) FROM cargas_academicas ca WHERE ca.inscripcion_id = i.id) AS materias
        """;
    private static final String FROM = """
         FROM inscripciones i
         JOIN alumnos a ON a.id = i.alumno_id
         JOIN carreras c ON c.id = a.carrera_id
         JOIN periodos p ON p.id = i.periodo_id
        """;

    private final JdbcTemplate jdbc;
    private final AlumnoAdminService alumnos;

    public InscripcionAdminService(JdbcTemplate jdbc, AlumnoAdminService alumnos) {
        this.jdbc = jdbc;
        this.alumnos = alumnos;
    }

    @Transactional(readOnly = true)
    public PageResponse<Map<String, Object>> listar(String q, String carrera, String periodo, String estatus,
                                                    int page, int size) {
        ConsultaSql c = new ConsultaSql()
                .buscar(q, "(a.nombre || ' ' || a.apellido_paterno || ' ' || COALESCE(a.apellido_materno, ''))",
                        "a.matricula");
        if (carrera != null && !carrera.isBlank()) {
            c.y("a.carrera_id = ?", DocenteAdminService.parseShort(carrera));
        }
        filtroPeriodo(c, periodo, "p");
        if (estatus != null && !estatus.isBlank()) {
            c.y("i.estatus = ?", estatus.trim().toLowerCase());
        }
        return c.pagina(jdbc, SELECT, FROM, "i.fecha_inscripcion DESC, a.matricula", page, size);
    }

    /** "actual" = periodo actual; un número = id del periodo; vacío = todos. */
    static void filtroPeriodo(ConsultaSql c, String periodo, String alias) {
        if (periodo == null || periodo.isBlank()) {
            return;
        }
        if ("actual".equalsIgnoreCase(periodo.trim())) {
            c.y(alias + ".es_actual");
        } else {
            c.y(alias + ".id = ?", DocenteAdminService.parseShort(periodo));
        }
    }

    @Transactional
    public Map<String, Object> crear(InscripcionRequest r) {
        if (!existe("SELECT COUNT(*) FROM periodos WHERE id = ?", r.periodoId())) {
            throw new SolicitudInvalidaException("El periodo seleccionado no existe.");
        }
        UUID alumnoId = r.alumnoId();
        if (alumnoId == null) {
            NuevoAlumno n = r.nuevoAlumno();
            if (n == null) {
                throw new SolicitudInvalidaException("Selecciona un alumno o captura los datos del alumno nuevo.");
            }
            alumnoId = alumnos.crearAlumno(new AlumnoRequest(n.nombre(), n.apellidos(), "", n.correoContacto(),
                    n.telefono(), n.carreraId(), n.semestre(), "activo", null, null));
        } else if (!existe("SELECT COUNT(*) FROM alumnos WHERE id = ?", alumnoId)) {
            throw new RecursoNoEncontradoException("El alumno seleccionado ya no existe.");
        }
        if (existe("SELECT COUNT(*) FROM inscripciones WHERE alumno_id = ? AND periodo_id = ?", alumnoId, r.periodoId())) {
            throw new ConflictoException("El alumno ya está inscrito en ese periodo.");
        }

        UUID id = jdbc.queryForObject("""
            INSERT INTO inscripciones (alumno_id, periodo_id, fecha_inscripcion, estatus)
            VALUES (?, ?, ?, ?) RETURNING id
            """, UUID.class, alumnoId, r.periodoId(), r.fecha(), r.estatus() == null ? "inscrito" : r.estatus());

        // las materias NO se asignan solas: el administrador se las asigna después (materias / asignarMateria)
        return obtener(id);
    }

    @Transactional
    public Map<String, Object> actualizar(UUID id, InscripcionRequest r) {
        obtener(id);
        // el alumno y el periodo no cambian: solo la fecha y el estatus
        jdbc.update("UPDATE inscripciones SET fecha_inscripcion = ?, estatus = ? WHERE id = ?",
                r.fecha(), r.estatus() == null ? "inscrito" : r.estatus(), id);
        return obtener(id);
    }

    @Transactional
    public void eliminar(UUID id) {
        obtener(id);
        if (existe("""
            SELECT COUNT(*) FROM cargas_academicas ca JOIN calificaciones c ON c.carga_id = ca.id
             WHERE ca.inscripcion_id = ? AND (c.parcial IS NOT NULL OR c."final" IS NOT NULL)
            """, id)) {
            throw new ConflictoException("No se puede eliminar: la inscripción tiene calificaciones capturadas. Cámbiala a Baja.");
        }
        jdbc.update("DELETE FROM inscripciones WHERE id = ?", id);
    }

    private Map<String, Object> obtener(UUID id) {
        try {
            return jdbc.queryForMap(SELECT + FROM + " WHERE i.id = ?", id);
        } catch (org.springframework.dao.EmptyResultDataAccessException e) {
            throw new RecursoNoEncontradoException("La inscripción no existe.");
        }
    }

    private boolean existe(String sql, Object... args) {
        Integer n = jdbc.queryForObject(sql, Integer.class, args);
        return n != null && n > 0;
    }

    /* ---------- materias (grupos) de una inscripción: las asigna el administrador ---------- */

    @Transactional(readOnly = true)
    public java.util.List<Map<String, Object>> materias(UUID inscripcionId) {
        obtener(inscripcionId);
        return jdbc.queryForList("""
            SELECT ca.id, m.clave, m.nombre AS materia, m.semestre, g.nombre_grupo AS grupo,
                   (d.nombre || ' ' || d.apellidos) AS docente, g.horario,
                   (c.parcial IS NOT NULL OR c.final IS NOT NULL) AS calificada
              FROM cargas_academicas ca
              JOIN grupos g ON g.id = ca.grupo_id
              JOIN materias m ON m.id = g.materia_id
              JOIN docentes d ON d.id = g.docente_id
              LEFT JOIN calificaciones c ON c.carga_id = ca.id
             WHERE ca.inscripcion_id = ?
             ORDER BY m.clave
            """, inscripcionId);
    }

    /** Grupos del periodo de la inscripción que aún se pueden asignar (materia no repetida y con cupo). */
    @Transactional(readOnly = true)
    public java.util.List<Map<String, Object>> gruposDisponibles(UUID inscripcionId) {
        obtener(inscripcionId);
        return jdbc.queryForList("""
            SELECT g.id::text AS value,
                   (m.clave || ' · ' || m.nombre || ' · Sem. ' || m.semestre || ' · Grupo ' || g.nombre_grupo
                    || ' · ' || d.nombre || ' ' || d.apellidos || COALESCE(' · ' || g.horario, '')
                    || ' (' || o.n || '/' || COALESCE(g.cupo, 0) || ' alumnos)') AS label
              FROM inscripciones i
              JOIN grupos g ON g.periodo_id = i.periodo_id
              JOIN materias m ON m.id = g.materia_id
              JOIN docentes d ON d.id = g.docente_id
             CROSS JOIN LATERAL (SELECT COUNT(*) AS n FROM cargas_academicas ca WHERE ca.grupo_id = g.id) o
             WHERE i.id = ? AND m.activa AND o.n < COALESCE(g.cupo, 1000)
               AND NOT EXISTS (SELECT 1 FROM cargas_academicas ca2 JOIN grupos g2 ON g2.id = ca2.grupo_id
                                WHERE ca2.inscripcion_id = i.id AND g2.materia_id = g.materia_id)
             ORDER BY m.clave, g.nombre_grupo
            """, inscripcionId);
    }

    @Transactional
    public java.util.List<Map<String, Object>> asignarMateria(UUID inscripcionId, UUID grupoId) {
        obtener(inscripcionId);
        java.util.List<Map<String, Object>> g = jdbc.queryForList("""
            SELECT g.periodo_id, g.materia_id, g.cupo, m.clave, g.nombre_grupo,
                   (SELECT COUNT(*) FROM cargas_academicas ca WHERE ca.grupo_id = g.id) AS alumnos
              FROM grupos g JOIN materias m ON m.id = g.materia_id WHERE g.id = ?
            """, grupoId);
        if (g.isEmpty()) {
            throw new RecursoNoEncontradoException("El grupo seleccionado no existe.");
        }
        Map<String, Object> grupo = g.get(0);
        Short periodoInscripcion = jdbc.queryForObject(
                "SELECT periodo_id FROM inscripciones WHERE id = ?", Short.class, inscripcionId);
        if (((Number) grupo.get("periodo_id")).intValue() != periodoInscripcion.intValue()) {
            throw new SolicitudInvalidaException("El grupo no pertenece al periodo de esta inscripción.");
        }
        if (existe("""
            SELECT COUNT(*) FROM cargas_academicas ca JOIN grupos g2 ON g2.id = ca.grupo_id
             WHERE ca.inscripcion_id = ? AND g2.materia_id = ?
            """, inscripcionId, grupo.get("materia_id"))) {
            throw new ConflictoException("El alumno ya tiene la materia " + grupo.get("clave") + " en otro grupo.");
        }
        Object cupo = grupo.get("cupo");
        if (cupo != null && ((Number) grupo.get("alumnos")).longValue() >= ((Number) cupo).longValue()) {
            throw new ConflictoException("El grupo " + grupo.get("nombre_grupo") + " de " + grupo.get("clave")
                    + " ya no tiene cupo. Elige otro grupo o aumenta el cupo en el módulo Grupos.");
        }
        jdbc.update("INSERT INTO cargas_academicas (inscripcion_id, grupo_id) VALUES (?, ?)", inscripcionId, grupoId);
        return materias(inscripcionId);
    }

    @Transactional
    public java.util.List<Map<String, Object>> quitarMateria(UUID inscripcionId, UUID cargaId) {
        obtener(inscripcionId);
        if (!existe("SELECT COUNT(*) FROM cargas_academicas WHERE id = ? AND inscripcion_id = ?", cargaId, inscripcionId)) {
            throw new RecursoNoEncontradoException("Esa materia no está asignada a la inscripción.");
        }
        if (existe("""
            SELECT COUNT(*) FROM calificaciones WHERE carga_id = ? AND (parcial IS NOT NULL OR final IS NOT NULL)
            """, cargaId)) {
            throw new ConflictoException("No se puede quitar: la materia ya tiene calificaciones capturadas.");
        }
        jdbc.update("DELETE FROM cargas_academicas WHERE id = ?", cargaId);
        return materias(inscripcionId);
    }
}
