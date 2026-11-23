package mx.edu.controlalumnos.admin;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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

/**
 * Grupos: una materia del catálogo + periodo + letra + docente + horario.
 * Una misma materia (misma clave) puede tener varios grupos con distinto docente u horario.
 * Así se le asigna una materia a un docente.
 */
@Service
public class GrupoAdminService {

    public record GrupoRequest(
            @NotNull(message = "Selecciona la materia.") UUID materiaId,
            @NotNull(message = "Selecciona el docente.") UUID docenteId,
            @NotBlank(message = "Escribe la letra del grupo.") @Pattern(regexp = "^[A-Za-z]$", message = "El grupo debe ser una letra.")
            String grupo,
            @Size(max = 60, message = "El horario admite máximo 60 caracteres.") String horario,
            @Min(value = 1, message = "El cupo debe estar entre 1 y 100.") @Max(value = 100, message = "El cupo debe estar entre 1 y 100.")
            Integer cupo,
            Short periodoId
    ) {}

    private static final String SELECT = """
        SELECT g.id, g.materia_id, m.clave, m.nombre AS materia, m.carrera_id, c.nombre AS carrera, m.semestre,
               g.nombre_grupo AS grupo, g.docente_id, (d.nombre || ' ' || d.apellidos) AS docente,
               g.horario, g.cupo, g.periodo_id, p.nombre AS periodo,
               (SELECT COUNT(*) FROM cargas_academicas ca WHERE ca.grupo_id = g.id) AS alumnos
        """;
    private static final String FROM = """
         FROM grupos g
         JOIN materias m ON m.id = g.materia_id
         JOIN carreras c ON c.id = m.carrera_id
         JOIN docentes d ON d.id = g.docente_id
         JOIN periodos p ON p.id = g.periodo_id
        """;

    private final JdbcTemplate jdbc;

    public GrupoAdminService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public PageResponse<Map<String, Object>> listar(String q, String carrera, String docente, String periodo,
                                                    int page, int size) {
        ConsultaSql c = new ConsultaSql().buscar(q, "m.clave", "m.nombre", "d.nombre", "d.apellidos");
        if (carrera != null && !carrera.isBlank()) {
            c.y("m.carrera_id = ?", DocenteAdminService.parseShort(carrera));
        }
        if (docente != null && !docente.isBlank()) {
            c.y("g.docente_id::text = ?", docente.trim());
        }
        InscripcionAdminService.filtroPeriodo(c, periodo, "p");
        return c.pagina(jdbc, SELECT, FROM, "m.clave, g.nombre_grupo", page, size);
    }

    @Transactional
    public Map<String, Object> crear(GrupoRequest r) {
        verificar(r);
        Short periodo = r.periodoId() != null ? r.periodoId() : periodoActual();
        if (!existe("SELECT COUNT(*) FROM periodos WHERE id = ?", periodo)) {
            throw new SolicitudInvalidaException("El periodo seleccionado no existe.");
        }
        String letra = r.grupo().trim().toUpperCase();
        if (existe("SELECT COUNT(*) FROM grupos WHERE materia_id = ? AND periodo_id = ? AND nombre_grupo = ?",
                r.materiaId(), periodo, letra)) {
            throw new ConflictoException("Esa materia ya tiene el grupo " + letra
                    + " en este periodo. Elige otra letra de grupo.");
        }
        UUID id = jdbc.queryForObject("""
            INSERT INTO grupos (materia_id, periodo_id, docente_id, nombre_grupo, horario, cupo)
            VALUES (?, ?, ?, ?, ?, ?) RETURNING id
            """, UUID.class, r.materiaId(), periodo, r.docenteId(), letra, horario(r), r.cupo() == null ? 30 : r.cupo());
        return obtener(id);
    }

    /** La materia, el periodo y la letra no cambian: solo el docente, el horario y el cupo. */
    @Transactional
    public Map<String, Object> actualizar(UUID id, GrupoRequest r) {
        Map<String, Object> actual = obtener(id);
        if (!existe("SELECT COUNT(*) FROM docentes WHERE id = ?", r.docenteId())) {
            throw new SolicitudInvalidaException("El docente seleccionado no existe.");
        }
        int cupo = r.cupo() == null ? 30 : r.cupo();
        long alumnos = ((Number) actual.get("alumnos")).longValue();
        if (cupo < alumnos) {
            throw new ConflictoException("El cupo no puede ser menor a los alumnos inscritos (" + alumnos + ").");
        }
        jdbc.update("UPDATE grupos SET docente_id = ?, horario = ?, cupo = ? WHERE id = ?",
                r.docenteId(), horario(r), cupo, id);
        return obtener(id);
    }

    @Transactional
    public void eliminar(UUID id) {
        Map<String, Object> g = obtener(id);
        if (((Number) g.get("alumnos")).longValue() > 0) {
            throw new ConflictoException("No se puede eliminar: el grupo tiene alumnos inscritos.");
        }
        jdbc.update("DELETE FROM grupos WHERE id = ?", id);
    }

    private void verificar(GrupoRequest r) {
        if (!existe("SELECT COUNT(*) FROM materias WHERE id = ?", r.materiaId())) {
            throw new SolicitudInvalidaException("La materia seleccionada no existe.");
        }
        if (!existe("SELECT COUNT(*) FROM docentes WHERE id = ? AND estatus <> 'baja'", r.docenteId())) {
            throw new SolicitudInvalidaException("El docente seleccionado no existe o está dado de baja.");
        }
    }

    private static String horario(GrupoRequest r) {
        return r.horario() == null || r.horario().isBlank() ? null : r.horario().trim();
    }

    private Short periodoActual() {
        try {
            return jdbc.queryForObject("SELECT id FROM periodos WHERE es_actual", Short.class);
        } catch (org.springframework.dao.EmptyResultDataAccessException e) {
            throw new SolicitudInvalidaException("No hay un periodo actual: crea o marca uno antes de crear grupos.");
        }
    }

    private Map<String, Object> obtener(UUID id) {
        try {
            return jdbc.queryForMap(SELECT + FROM + " WHERE g.id = ?", id);
        } catch (org.springframework.dao.EmptyResultDataAccessException e) {
            throw new RecursoNoEncontradoException("El grupo no existe.");
        }
    }

    private boolean existe(String sql, Object... args) {
        Integer n = jdbc.queryForObject(sql, Integer.class, args);
        return n != null && n > 0;
    }
}
