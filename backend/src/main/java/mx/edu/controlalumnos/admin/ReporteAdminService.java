package mx.edu.controlalumnos.admin;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import mx.edu.controlalumnos.exception.SolicitudInvalidaException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Cifras de Inicio y Reportes del administrador (todo se calcula en la base de datos). */
@Service
public class ReporteAdminService {

    private final JdbcTemplate jdbc;
    private final AlumnoAdminService alumnos;

    public ReporteAdminService(JdbcTemplate jdbc, AlumnoAdminService alumnos) {
        this.jdbc = jdbc;
        this.alumnos = alumnos;
    }

    /** Resumen de Inicio: totales, promedio general y los alumnos agregados más recientemente. */
    @Transactional(readOnly = true)
    public Map<String, Object> resumen() {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("total", jdbc.queryForObject("SELECT COUNT(*) FROM alumnos", Long.class));
        r.put("activos", jdbc.queryForObject("SELECT COUNT(*) FROM alumnos WHERE estatus = 'activo'", Long.class));
        r.put("promedio", jdbc.queryForObject("SELECT ROUND(AVG(promedio), 1) FROM vw_promedio_alumno", BigDecimal.class));
        r.put("recientes", alumnos.recientes(5));
        return r;
    }

    /**
     * Reporte académico. tipo: "todos" o "actuales" (inscritos en el periodo actual).
     * periodo: id opcional; limita a los inscritos en ese periodo y a sus calificaciones.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> reporte(String tipo, String periodo) {
        StringBuilder where = new StringBuilder(" WHERE 1 = 1");
        List<Object> args = new ArrayList<>();

        if ("actuales".equalsIgnoreCase(tipo)) {
            where.append(" AND EXISTS (SELECT 1 FROM inscripciones i JOIN periodos p ON p.id = i.periodo_id"
                    + " WHERE i.alumno_id = a.id AND i.estatus = 'inscrito' AND p.es_actual)");
        }
        Short periodoId = null;
        if (periodo != null && !periodo.isBlank()) {
            periodoId = DocenteAdminService.parseShort(periodo);
            where.append(" AND EXISTS (SELECT 1 FROM inscripciones i WHERE i.alumno_id = a.id"
                    + " AND i.estatus = 'inscrito' AND i.periodo_id = ?)");
            args.add(periodoId);
        }

        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM alumnos a" + where, Long.class, args.toArray());

        List<Map<String, Object>> porCarrera = jdbc.queryForList(
                "SELECT c.nombre AS label, COUNT(a.id) AS value FROM alumnos a JOIN carreras c ON c.id = a.carrera_id"
                        + where + " GROUP BY c.nombre ORDER BY value DESC, c.nombre", args.toArray());

        // calificaciones finales de esos alumnos (y del periodo, si se eligió uno)
        String finales = " FROM calificaciones cal"
                + " JOIN cargas_academicas ca ON ca.id = cal.carga_id"
                + " JOIN inscripciones ins ON ins.id = ca.inscripcion_id"
                + " JOIN alumnos a ON a.id = ins.alumno_id"
                + where + " AND cal.\"final\" IS NOT NULL"
                + (periodoId != null ? " AND ins.periodo_id = ?" : "");
        List<Object> argsFinales = new ArrayList<>(args);
        if (periodoId != null) {
            argsFinales.add(periodoId);
        }

        Map<String, Object> cifras = jdbc.queryForMap(
                "SELECT AVG(cal.\"final\") AS promedio, COUNT(*) AS n,"
                        + " COUNT(*) FILTER (WHERE cal.\"final\" >= 6) AS aprobados" + finales,
                argsFinales.toArray());
        long n = ((Number) cifras.get("n")).longValue();

        List<Map<String, Object>> semestres = jdbc.queryForList(
                "SELECT a.semestre_actual AS semestre, AVG(cal.\"final\") AS promedio" + finales
                        + " GROUP BY a.semestre_actual", argsFinales.toArray());
        Map<Integer, Double> porSem = new LinkedHashMap<>();
        for (Map<String, Object> f : semestres) {
            porSem.put(((Number) f.get("semestre")).intValue(), ((Number) f.get("promedio")).doubleValue());
        }
        List<Map<String, Object>> porSemestre = new ArrayList<>();
        for (int s = 1; s <= 9; s++) {
            Map<String, Object> f = new LinkedHashMap<>();
            f.put("label", "S" + s);
            f.put("value", porSem.get(s));
            porSemestre.add(f);
        }

        Map<String, Object> r = new LinkedHashMap<>();
        r.put("promedio", n == 0 ? null : ((Number) cifras.get("promedio")).doubleValue());
        r.put("tasa", n == 0 ? null : ((Number) cifras.get("aprobados")).doubleValue() / n);
        r.put("total", total == null ? 0 : total);
        r.put("porCarrera", porCarrera);
        r.put("porSemestre", porSemestre);
        r.put("periodoLabel", etiqueta(tipo, periodoId));
        return r;
    }

    private String etiqueta(String tipo, Short periodoId) {
        if (periodoId != null) {
            try {
                return jdbc.queryForObject("SELECT nombre FROM periodos WHERE id = ?", String.class, periodoId);
            } catch (org.springframework.dao.EmptyResultDataAccessException e) {
                throw new SolicitudInvalidaException("El periodo no existe.");
            }
        }
        if ("actuales".equalsIgnoreCase(tipo)) {
            try {
                return jdbc.queryForObject("SELECT nombre FROM periodos WHERE es_actual", String.class);
            } catch (org.springframework.dao.EmptyResultDataAccessException e) {
                return "Periodo actual";
            }
        }
        return "Todos los periodos";
    }
}
