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

/** Catálogo de materias (clave única). Los docentes y horarios se asignan creando grupos (GrupoAdminService). */
@Service
public class MateriaAdminService {

    public record MateriaRequest(
            @NotBlank(message = "La clave es obligatoria.")
            @Pattern(regexp = "^[A-Za-z]{3}-\\d{3}$", message = "Usa el formato ABC-123 (3 letras, guion y 3 números).")
            String clave,
            @NotBlank(message = "El nombre es obligatorio.") @Size(max = 100, message = "El nombre admite máximo 100 caracteres.")
            String nombre,
            @NotNull(message = "Los créditos son obligatorios.") @Min(value = 1, message = "Los créditos deben estar entre 1 y 12.")
            @Max(value = 12, message = "Los créditos deben estar entre 1 y 12.")
            Integer creditos,
            @NotNull(message = "El semestre es obligatorio.") @Min(value = 1, message = "El semestre debe estar entre 1 y 14.")
            @Max(value = 14, message = "El semestre debe estar entre 1 y 14.")
            Integer semestre,
            @NotNull(message = "Selecciona una carrera.") Short carreraId,
            Boolean activa
    ) {}

    private static final String SELECT = """
        SELECT m.id, m.clave, m.nombre, m.creditos, m.semestre, m.carrera_id, c.nombre AS carrera, m.activa,
               (SELECT COUNT(*) FROM grupos g JOIN periodos p ON p.id = g.periodo_id
                 WHERE g.materia_id = m.id AND p.es_actual) AS grupos
        """;
    private static final String FROM = " FROM materias m JOIN carreras c ON c.id = m.carrera_id";

    private final JdbcTemplate jdbc;

    public MateriaAdminService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public PageResponse<Map<String, Object>> listar(String q, String carrera, String semestre, String estatus,
                                                    int page, int size) {
        ConsultaSql c = new ConsultaSql().buscar(q, "m.clave", "m.nombre");
        if (carrera != null && !carrera.isBlank()) {
            c.y("m.carrera_id = ?", DocenteAdminService.parseShort(carrera));
        }
        if (semestre != null && !semestre.isBlank()) {
            c.y("m.semestre = ?", DocenteAdminService.parseShort(semestre));
        }
        if ("activa".equalsIgnoreCase(estatus)) {
            c.y("m.activa");
        } else if ("inactiva".equalsIgnoreCase(estatus)) {
            c.y("NOT m.activa");
        }
        return c.pagina(jdbc, SELECT, FROM, "m.clave", page, size);
    }

    @Transactional
    public Map<String, Object> crear(MateriaRequest r) {
        String clave = r.clave().trim().toUpperCase();
        if (existe("SELECT COUNT(*) FROM materias WHERE clave = ?", clave)) {
            throw new ConflictoException("Ya existe una materia con la clave " + clave
                    + ". La clave es única: para darla con otro docente u horario agrega un grupo en el módulo Grupos.");
        }
        verificarReferencias(r);
        UUID id = jdbc.queryForObject("""
            INSERT INTO materias (clave, nombre, creditos, semestre, carrera_id, activa)
            VALUES (?, ?, ?, ?, ?, ?) RETURNING id
            """, UUID.class, clave, r.nombre().trim(), r.creditos(), r.semestre(), r.carreraId(),
                r.activa() == null || r.activa());
        return obtener(id);
    }

    @Transactional
    public Map<String, Object> actualizar(UUID id, MateriaRequest r) {
        obtener(id);
        String clave = r.clave().trim().toUpperCase();
        if (existe("SELECT COUNT(*) FROM materias WHERE clave = ? AND id <> ?", clave, id)) {
            throw new ConflictoException("Ya existe otra materia con esa clave.");
        }
        verificarReferencias(r);
        jdbc.update("""
            UPDATE materias SET clave = ?, nombre = ?, creditos = ?, semestre = ?, carrera_id = ?,
                   activa = COALESCE(?, activa)
             WHERE id = ?
            """, clave, r.nombre().trim(), r.creditos(), r.semestre(), r.carreraId(), r.activa(), id);
        return obtener(id);
    }

    @Transactional
    public void eliminar(UUID id) {
        obtener(id);
        if (existe("""
            SELECT COUNT(*) FROM cargas_academicas ca JOIN grupos g ON g.id = ca.grupo_id WHERE g.materia_id = ?
            """, id)) {
            throw new ConflictoException("No se puede eliminar: la materia tiene alumnos inscritos en alguno de sus grupos.");
        }
        jdbc.update("DELETE FROM grupos WHERE materia_id = ?", id);
        jdbc.update("DELETE FROM materias WHERE id = ?", id);
    }

    private void verificarReferencias(MateriaRequest r) {
        if (!existe("SELECT COUNT(*) FROM carreras WHERE id = ?", r.carreraId())) {
            throw new SolicitudInvalidaException("La carrera seleccionada no existe.");
        }
    }

    private Map<String, Object> obtener(UUID id) {
        try {
            return jdbc.queryForMap(SELECT + FROM + " WHERE m.id = ?", id);
        } catch (org.springframework.dao.EmptyResultDataAccessException e) {
            throw new RecursoNoEncontradoException("La materia no existe.");
        }
    }

    private boolean existe(String sql, Object... args) {
        Integer n = jdbc.queryForObject(sql, Integer.class, args);
        return n != null && n > 0;
    }
}
