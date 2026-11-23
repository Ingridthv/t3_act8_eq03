package mx.edu.controlalumnos.admin;

import java.util.List;
import java.util.Map;
import mx.edu.controlalumnos.exception.RecursoNoEncontradoException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Opciones (value / label) para los selects de las pantallas del administrador. */
@Service
public class OpcionesAdminService {

    private final JdbcTemplate jdbc;

    public OpcionesAdminService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> opciones(String tipo) {
        return switch (tipo) {
            case "carreras" -> jdbc.queryForList(
                    "SELECT id::text AS value, nombre AS label FROM carreras ORDER BY nombre");
            case "docentes" -> jdbc.queryForList(
                    "SELECT id::text AS value, (nombre || ' ' || apellidos || ' (' || clave || ')') AS label"
                            + " FROM docentes WHERE estatus <> 'baja' ORDER BY apellidos, nombre");
            case "periodos" -> jdbc.queryForList(
                    "SELECT id::text AS value, nombre AS label, es_actual AS actual FROM periodos ORDER BY fecha_inicio DESC");
            // para filtros: el periodo actual se identifica como "actual"
            case "periodosFiltro" -> jdbc.queryForList(
                    "SELECT CASE WHEN es_actual THEN 'actual' ELSE id::text END AS value, nombre AS label"
                            + " FROM periodos ORDER BY fecha_inicio DESC");
            case "anios" -> jdbc.queryForList(
                    "SELECT DISTINCT anio::text AS value, anio::text AS label FROM periodos ORDER BY value DESC");
            case "ingresos" -> jdbc.queryForList(
                    "SELECT DISTINCT anio_ingreso::text AS value, anio_ingreso::text AS label FROM alumnos ORDER BY value DESC");
            case "materias" -> jdbc.queryForList(
                    "SELECT id::text AS value, (nombre || ' (' || clave || ')') AS label FROM materias ORDER BY nombre");
            case "alumnos" -> jdbc.queryForList(
                    "SELECT id::text AS value,"
                            + " (nombre || ' ' || apellido_paterno || COALESCE(' ' || apellido_materno, '') || ' (' || matricula || ')') AS label"
                            + " FROM alumnos ORDER BY apellido_paterno, nombre LIMIT 500");
            default -> throw new RecursoNoEncontradoException("Ese catálogo no existe.");
        };
    }
}
