package mx.edu.controlalumnos.admin;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;
import mx.edu.controlalumnos.dto.PageResponse;
import mx.edu.controlalumnos.exception.ConflictoException;
import mx.edu.controlalumnos.exception.RecursoNoEncontradoException;
import mx.edu.controlalumnos.exception.SolicitudInvalidaException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Calificaciones por materia cursada (carga académica). El id de cada fila es el de la carga. */
@Service
public class CalificacionAdminService {

    public record CalificacionRequest(
            @NotNull(message = "Selecciona un alumno.") UUID alumnoId,
            @NotNull(message = "Selecciona una materia.") UUID materiaId,
            @NotNull(message = "Selecciona qué calificación capturas.")
            @Pattern(regexp = "^(Parcial 1|Final)$", message = "El tipo de calificación no es válido.")
            String tipo,
            @NotNull(message = "Escribe la calificación.")
            @DecimalMin(value = "0.0", message = "La calificación debe estar entre 0 y 10.")
            @DecimalMax(value = "10.0", message = "La calificación debe estar entre 0 y 10.")
            BigDecimal calificacion
    ) {}

    private static final String SELECT = """
        SELECT ca.id, a.id AS alumno_id, m.id AS materia_id, a.matricula,
               (a.nombre || ' ' || a.apellido_paterno || COALESCE(' ' || a.apellido_materno, '')) AS alumno,
               m.nombre AS materia, m.clave, p.nombre AS periodo,
               cal.parcial, cal."final", COALESCE(cal.estatus, 'pendiente') AS estatus
        """;
    private static final String FROM = """
         FROM cargas_academicas ca
         JOIN inscripciones i ON i.id = ca.inscripcion_id
         JOIN alumnos a ON a.id = i.alumno_id
         JOIN grupos g ON g.id = ca.grupo_id
         JOIN materias m ON m.id = g.materia_id
         JOIN periodos p ON p.id = g.periodo_id
         LEFT JOIN calificaciones cal ON cal.carga_id = ca.id
        """;

    private final JdbcTemplate jdbc;

    public CalificacionAdminService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public PageResponse<Map<String, Object>> listar(String q, String materia, String parcial, String periodo,
                                                    String estatus, int page, int size) {
        ConsultaSql c = new ConsultaSql()
                .buscar(q, "(a.nombre || ' ' || a.apellido_paterno || ' ' || COALESCE(a.apellido_materno, ''))",
                        "a.matricula");
        if (materia != null && !materia.isBlank()) {
            try {
                c.y("m.id = ?", UUID.fromString(materia.trim()));
            } catch (IllegalArgumentException e) {
                throw new SolicitudInvalidaException("La materia no es válida.");
            }
        }
        if ("aprobatorio".equalsIgnoreCase(parcial)) {
            c.y("cal.parcial >= 6");
        } else if ("reprobatorio".equalsIgnoreCase(parcial)) {
            c.y("cal.parcial < 6");
        }
        InscripcionAdminService.filtroPeriodo(c, periodo, "p");
        if (estatus != null && !estatus.isBlank()) {
            c.y("COALESCE(cal.estatus, 'pendiente') = ?", estatus.trim().toLowerCase());
        }
        return c.pagina(jdbc, SELECT, FROM, "a.matricula, m.nombre", page, size);
    }

    /** Captura parcial o final del alumno en la materia del periodo actual. */
    @Transactional
    public Map<String, Object> crear(CalificacionRequest r) {
        UUID carga;
        try {
            carga = jdbc.queryForObject("""
                SELECT ca.id
                  FROM cargas_academicas ca
                  JOIN inscripciones i ON i.id = ca.inscripcion_id
                  JOIN grupos g ON g.id = ca.grupo_id
                  JOIN periodos p ON p.id = g.periodo_id
                 WHERE i.alumno_id = ? AND g.materia_id = ? AND p.es_actual
                 LIMIT 1
                """, UUID.class, r.alumnoId(), r.materiaId());
        } catch (org.springframework.dao.EmptyResultDataAccessException e) {
            throw new ConflictoException("El alumno no está inscrito en esa materia en el periodo actual.");
        }
        guardar(carga, r);
        return obtener(carga);
    }

    @Transactional
    public Map<String, Object> actualizar(UUID cargaId, CalificacionRequest r) {
        obtener(cargaId);
        guardar(cargaId, r);
        return obtener(cargaId);
    }

    @Transactional
    public void eliminar(UUID cargaId) {
        obtener(cargaId);
        jdbc.update("DELETE FROM calificaciones WHERE carga_id = ?", cargaId);
    }

    private void guardar(UUID carga, CalificacionRequest r) {
        BigDecimal nota = r.calificacion();
        boolean esFinal = "Final".equals(r.tipo());
        int n = jdbc.update(
                "UPDATE calificaciones SET " + (esFinal ? "\"final\"" : "parcial") + " = ?, capturada_en = now() WHERE carga_id = ?",
                nota, carga);
        if (n == 0) {
            jdbc.update("INSERT INTO calificaciones (carga_id, " + (esFinal ? "\"final\"" : "parcial") + ") VALUES (?, ?)",
                    carga, nota);
        }
    }

    private Map<String, Object> obtener(UUID cargaId) {
        try {
            return jdbc.queryForMap(SELECT + FROM + " WHERE ca.id = ?", cargaId);
        } catch (org.springframework.dao.EmptyResultDataAccessException e) {
            throw new RecursoNoEncontradoException("La calificación no existe.");
        }
    }
}
