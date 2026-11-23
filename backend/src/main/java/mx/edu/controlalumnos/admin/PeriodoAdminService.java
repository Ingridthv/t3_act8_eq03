package mx.edu.controlalumnos.admin;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDate;
import java.util.Map;
import mx.edu.controlalumnos.dto.PageResponse;
import mx.edu.controlalumnos.exception.ConflictoException;
import mx.edu.controlalumnos.exception.RecursoNoEncontradoException;
import mx.edu.controlalumnos.exception.SolicitudInvalidaException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PeriodoAdminService {

    public record PeriodoRequest(
            @NotNull(message = "Selecciona el tipo de periodo.")
            @Pattern(regexp = "^(ENE-JUL|AGO-DIC)$", message = "El tipo de periodo no es válido.")
            String tipo,
            @NotNull(message = "El año es obligatorio.") @Min(value = 2000, message = "El año mínimo es 2000.")
            @Max(value = 2100, message = "El año máximo es 2100.")
            Integer anio,
            @NotNull(message = "La fecha de inicio es obligatoria.") LocalDate fechaInicio,
            @NotNull(message = "La fecha de fin es obligatoria.") LocalDate fechaFin,
            Boolean actual
    ) {}

    private static final String SELECT = """
        SELECT p.id, p.nombre, p.anio, p.tipo, p.fecha_inicio, p.fecha_fin, p.es_actual,
               (SELECT COUNT(*) FROM inscripciones i WHERE i.periodo_id = p.id AND i.estatus = 'inscrito') AS alumnos
        """;
    private static final String FROM = " FROM periodos p";

    private final JdbcTemplate jdbc;

    public PeriodoAdminService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public PageResponse<Map<String, Object>> listar(String q, String anio, String estatus, int page, int size) {
        ConsultaSql c = new ConsultaSql().buscar(q, "p.nombre");
        if (anio != null && !anio.isBlank()) {
            try {
                c.y("p.anio = ?", Integer.parseInt(anio.trim()));
            } catch (NumberFormatException e) {
                throw new SolicitudInvalidaException("El año no es válido.");
            }
        }
        if ("actual".equalsIgnoreCase(estatus)) {
            c.y("p.es_actual");
        } else if ("cerrado".equalsIgnoreCase(estatus)) {
            c.y("NOT p.es_actual");
        }
        return c.pagina(jdbc, SELECT, FROM, "p.fecha_inicio DESC", page, size);
    }

    @Transactional
    public Map<String, Object> crear(PeriodoRequest r) {
        validar(r);
        if (existe("SELECT COUNT(*) FROM periodos WHERE anio = ? AND tipo = ?", r.anio(), r.tipo())) {
            throw new ConflictoException("Ya existe un periodo con ese nombre.");
        }
        boolean actual = Boolean.TRUE.equals(r.actual());
        if (actual) {
            jdbc.update("UPDATE periodos SET es_actual = false WHERE es_actual");
        }
        Short id = jdbc.queryForObject("""
            INSERT INTO periodos (anio, tipo, fecha_inicio, fecha_fin, es_actual)
            VALUES (?, ?, ?, ?, ?) RETURNING id
            """, Short.class, r.anio(), r.tipo(), r.fechaInicio(), r.fechaFin(), actual);
        return obtener(id);
    }

    @Transactional
    public Map<String, Object> actualizar(Short id, PeriodoRequest r) {
        Map<String, Object> actual = obtener(id);
        validar(r);
        if (existe("SELECT COUNT(*) FROM periodos WHERE anio = ? AND tipo = ? AND id <> ?", r.anio(), r.tipo(), id)) {
            throw new ConflictoException("Ya existe otro periodo con ese nombre.");
        }
        boolean eraActual = Boolean.TRUE.equals(actual.get("es_actual"));
        boolean seraActual = r.actual() == null ? eraActual : r.actual();
        if (eraActual && !seraActual) {
            throw new ConflictoException("Debe existir un periodo actual: marca otro periodo como actual.");
        }
        if (seraActual && !eraActual) {
            jdbc.update("UPDATE periodos SET es_actual = false WHERE es_actual");
        }
        jdbc.update("UPDATE periodos SET anio = ?, tipo = ?, fecha_inicio = ?, fecha_fin = ?, es_actual = ? WHERE id = ?",
                r.anio(), r.tipo(), r.fechaInicio(), r.fechaFin(), seraActual, id);
        return obtener(id);
    }

    @Transactional
    public void eliminar(Short id) {
        Map<String, Object> p = obtener(id);
        if (Boolean.TRUE.equals(p.get("es_actual"))) {
            throw new ConflictoException("No se puede eliminar el periodo actual.");
        }
        if (existe("SELECT COUNT(*) FROM inscripciones WHERE periodo_id = ?", id)
                || existe("SELECT COUNT(*) FROM grupos WHERE periodo_id = ?", id)) {
            throw new ConflictoException("No se puede eliminar: el periodo tiene inscripciones o grupos.");
        }
        jdbc.update("DELETE FROM periodos WHERE id = ?", id);
    }

    private void validar(PeriodoRequest r) {
        if (!r.fechaFin().isAfter(r.fechaInicio())) {
            throw new SolicitudInvalidaException("La fecha de fin debe ser posterior al inicio.");
        }
    }

    private Map<String, Object> obtener(Short id) {
        try {
            return jdbc.queryForMap(SELECT + FROM + " WHERE p.id = ?", id);
        } catch (org.springframework.dao.EmptyResultDataAccessException e) {
            throw new RecursoNoEncontradoException("El periodo no existe.");
        }
    }

    private boolean existe(String sql, Object... args) {
        Integer n = jdbc.queryForObject(sql, Integer.class, args);
        return n != null && n > 0;
    }
}
