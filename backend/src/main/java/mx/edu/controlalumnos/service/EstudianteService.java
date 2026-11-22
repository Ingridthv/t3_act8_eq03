package mx.edu.controlalumnos.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import mx.edu.controlalumnos.dto.EstudianteDtos.CalificacionFila;
import mx.edu.controlalumnos.dto.EstudianteDtos.MateriaFila;
import mx.edu.controlalumnos.dto.EstudianteDtos.PeriodoOpcion;
import mx.edu.controlalumnos.dto.EstudianteDtos.Perfil;
import mx.edu.controlalumnos.dto.EstudianteDtos.Resumen;
import mx.edu.controlalumnos.dto.PageResponse;
import mx.edu.controlalumnos.exception.RecursoNoEncontradoException;
import mx.edu.controlalumnos.exception.SolicitudInvalidaException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Consultas del estudiante. Siempre se filtra por el alumno ligado a la cuenta del token,
 * así que un estudiante nunca puede ver datos de otro. Paginación y filtros se hacen en SQL.
 */
@Service
public class EstudianteService {

    private static final int TAMANIO_MAXIMO = 50;

    private static final String DESDE = """
            FROM inscripciones i
            JOIN periodos p ON p.id = i.periodo_id
            JOIN cargas_academicas ca ON ca.inscripcion_id = i.id
            JOIN grupos g ON g.id = ca.grupo_id
            JOIN materias m ON m.id = g.materia_id
            JOIN docentes d ON d.id = g.docente_id
            LEFT JOIN calificaciones c ON c.carga_id = ca.id
            WHERE i.alumno_id = ?
            """;

    private static final String PERIODO_CORTO =
            "(CASE p.tipo WHEN 'ENE-JUL' THEN 'Ene-Jul ' ELSE 'Ago-Dic ' END || p.anio)";
    private static final String ESTATUS_MATERIA =
            "(CASE WHEN p.es_actual THEN 'en curso' ELSE coalesce(c.estatus, 'pendiente') END)";
    private static final String ESTATUS_CALIFICACION = "coalesce(c.estatus, 'pendiente')";

    private final JdbcTemplate jdbc;

    public EstudianteService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public Perfil perfil(UUID usuarioId) {
        UUID alumnoId = alumnoDe(usuarioId);
        return jdbc.query("""
                SELECT a.nombre, a.apellido_paterno, coalesce(a.apellido_materno, '') AS apellido_materno,
                       a.matricula, u.correo, c.nombre AS carrera, a.semestre_actual, a.anio_ingreso, a.estatus,
                       (SELECT promedio FROM vw_promedio_alumno WHERE alumno_id = a.id) AS promedio
                FROM alumnos a
                JOIN carreras c ON c.id = a.carrera_id
                JOIN usuarios u ON u.alumno_id = a.id
                WHERE a.id = ?
                """, rs -> {
            if (!rs.next()) {
                throw new RecursoNoEncontradoException("No se encontró tu información de alumno.");
            }
            String completo = (rs.getString("nombre") + " " + rs.getString("apellido_paterno") + " "
                    + rs.getString("apellido_materno")).trim();
            String estatus = rs.getString("estatus");
            return new Perfil(rs.getString("nombre"), completo, rs.getString("matricula"), rs.getString("correo"),
                    rs.getString("carrera"), rs.getInt("semestre_actual"), rs.getInt("anio_ingreso"),
                    estatus.substring(0, 1).toUpperCase() + estatus.substring(1), rs.getBigDecimal("promedio"));
        }, alumnoId);
    }

    @Transactional(readOnly = true)
    public Resumen resumen(UUID usuarioId) {
        UUID alumnoId = alumnoDe(usuarioId);
        Perfil perfil = perfil(usuarioId);
        List<PeriodoOpcion> actual = jdbc.query(
                "SELECT id, nombre, es_actual FROM periodos WHERE es_actual",
                (rs, n) -> new PeriodoOpcion(rs.getInt("id"), rs.getString("nombre"), true));
        if (actual.isEmpty()) {
            return new Resumen(perfil.nombre(), "", perfil.promedio(), 0, perfil.semestreActual(), List.of());
        }
        PeriodoOpcion periodo = actual.get(0);
        List<MateriaFila> materias = consultarMaterias(alumnoId, "", "actual", "", 0, TAMANIO_MAXIMO).items();
        return new Resumen(perfil.nombre(), periodo.nombre(), perfil.promedio(), materias.size(),
                perfil.semestreActual(), materias);
    }

    @Transactional(readOnly = true)
    public List<PeriodoOpcion> periodos(UUID usuarioId) {
        return jdbc.query("""
                SELECT p.id, p.nombre, p.es_actual FROM periodos p
                WHERE EXISTS (SELECT 1 FROM inscripciones i WHERE i.alumno_id = ? AND i.periodo_id = p.id)
                ORDER BY p.anio DESC, CASE p.tipo WHEN 'AGO-DIC' THEN 2 ELSE 1 END DESC
                """, (rs, n) -> new PeriodoOpcion(rs.getInt("id"), rs.getString("nombre"), rs.getBoolean("es_actual")),
                alumnoDe(usuarioId));
    }

    @Transactional(readOnly = true)
    public PageResponse<MateriaFila> materias(UUID usuarioId, String q, String periodo, String estatus, int page, int size) {
        return consultarMaterias(alumnoDe(usuarioId), q, periodo, estatus, page, size);
    }

    @Transactional(readOnly = true)
    public PageResponse<CalificacionFila> calificaciones(UUID usuarioId, String q, String periodo, String estatus,
                                                         String orden, int page, int size) {
        UUID alumnoId = alumnoDe(usuarioId);
        List<Object> args = new ArrayList<>();
        args.add(alumnoId);
        String filtros = filtros(q, periodo, estatus, ESTATUS_CALIFICACION,
                Set.of("aprobado", "reprobado", "pendiente"), args);
        String dir = "asc".equalsIgnoreCase(orden) ? "ASC" : "DESC";

        long total = contar(filtros, args);
        int tam = tamanio(size);
        int pag = Math.max(0, page);
        List<Object> argsDatos = new ArrayList<>(args);
        argsDatos.add(tam);
        argsDatos.add((long) pag * tam);
        List<CalificacionFila> filas = jdbc.query(
                "SELECT " + PERIODO_CORTO + " AS periodo, m.clave, m.nombre AS materia, "
                        + "(d.nombre || ' ' || d.apellidos) AS docente, c.parcial, c.final AS calif_final, "
                        + ESTATUS_CALIFICACION + " AS estatus "
                        + DESDE + filtros + orden(dir) + " LIMIT ? OFFSET ?",
                (rs, n) -> new CalificacionFila(rs.getString("periodo"), rs.getString("clave"),
                        rs.getString("materia"), rs.getString("docente"), rs.getBigDecimal("parcial"),
                        rs.getBigDecimal("calif_final"), mayuscula(rs.getString("estatus"))),
                argsDatos.toArray());
        return pagina(filas, pag, tam, total);
    }

    // ---------------------------------------------------------------- internos

    private PageResponse<MateriaFila> consultarMaterias(UUID alumnoId, String q, String periodo, String estatus, int page, int size) {
        List<Object> args = new ArrayList<>();
        args.add(alumnoId);
        String filtros = filtros(q, periodo, estatus, ESTATUS_MATERIA,
                Set.of("en curso", "aprobado", "reprobado", "pendiente"), args);

        long total = contar(filtros, args);
        int tam = tamanio(size);
        int pag = Math.max(0, page);
        List<Object> argsDatos = new ArrayList<>(args);
        argsDatos.add(tam);
        argsDatos.add((long) pag * tam);
        List<MateriaFila> filas = jdbc.query(
                "SELECT m.clave, m.nombre AS materia, (d.nombre || ' ' || d.apellidos) AS docente, "
                        + "g.nombre_grupo, coalesce(g.horario, '') AS horario, m.creditos, "
                        + PERIODO_CORTO + " AS periodo, " + ESTATUS_MATERIA + " AS estatus "
                        + DESDE + filtros + orden("DESC") + " LIMIT ? OFFSET ?",
                (rs, n) -> new MateriaFila(rs.getString("clave"), rs.getString("materia"), rs.getString("docente"),
                        rs.getString("nombre_grupo"), rs.getString("horario"), rs.getInt("creditos"),
                        rs.getString("periodo"), mayuscula(rs.getString("estatus"))),
                argsDatos.toArray());
        return pagina(filas, pag, tam, total);
    }

    /** Arma los filtros del WHERE y agrega sus valores a args (siempre con parámetros, nunca concatenados). */
    private String filtros(String q, String periodo, String estatus, String exprEstatus,
                           Set<String> validos, List<Object> args) {
        StringBuilder sb = new StringBuilder();
        String texto = q == null ? "" : q.trim();
        if (!texto.isEmpty()) {
            String patron = "%" + texto.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
            sb.append(" AND (m.nombre ILIKE ? OR m.clave ILIKE ? OR (d.nombre || ' ' || d.apellidos) ILIKE ?)");
            args.add(patron);
            args.add(patron);
            args.add(patron);
        }
        String per = periodo == null ? "" : periodo.trim();
        if (per.equalsIgnoreCase("actual")) {
            sb.append(" AND p.es_actual");
        } else if (!per.isEmpty()) {
            try {
                args.add(Integer.parseInt(per));
                sb.append(" AND p.id = ?");
            } catch (NumberFormatException e) {
                throw new SolicitudInvalidaException("El periodo indicado no es válido.");
            }
        }
        String est = estatus == null ? "" : estatus.trim().toLowerCase();
        if (!est.isEmpty()) {
            if (!validos.contains(est)) {
                throw new SolicitudInvalidaException("El estatus indicado no es válido.");
            }
            sb.append(" AND ").append(exprEstatus).append(" = ?");
            args.add(est);
        }
        return sb.toString();
    }

    private long contar(String filtros, List<Object> args) {
        Long total = jdbc.queryForObject("SELECT count(*) " + DESDE + filtros, Long.class, args.toArray());
        return total == null ? 0 : total;
    }

    private static String orden(String dir) {
        return " ORDER BY p.anio " + dir + ", CASE p.tipo WHEN 'AGO-DIC' THEN 2 ELSE 1 END " + dir + ", m.nombre";
    }

    private static int tamanio(int size) {
        return size < 1 ? 10 : Math.min(size, TAMANIO_MAXIMO);
    }

    private static <T> PageResponse<T> pagina(List<T> items, int page, int size, long total) {
        int paginas = (int) Math.ceil(total / (double) size);
        return new PageResponse<>(items, page, size, total, paginas);
    }

    private static String mayuscula(String s) {
        return s == null || s.isEmpty() ? s : s.substring(0, 1).toUpperCase() + s.substring(1);
    }

    private UUID alumnoDe(UUID usuarioId) {
        List<UUID> ids = jdbc.query("SELECT alumno_id FROM usuarios WHERE id = ?",
                (rs, n) -> (UUID) rs.getObject("alumno_id"), usuarioId);
        if (ids.isEmpty() || ids.get(0) == null) {
            throw new RecursoNoEncontradoException("Tu cuenta no está ligada a un alumno.");
        }
        return ids.get(0);
    }
}
