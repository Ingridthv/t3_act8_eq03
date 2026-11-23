package mx.edu.controlalumnos.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Set;

import mx.edu.controlalumnos.dto.PageResponse;
import mx.edu.controlalumnos.exception.RecursoNoEncontradoException;
import mx.edu.controlalumnos.exception.SolicitudInvalidaException;
import mx.edu.controlalumnos.model.Usuario;
import mx.edu.controlalumnos.repository.UsuarioRepository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DocenteService {

    private final JdbcTemplate jdbc;
    private final UsuarioRepository usuarios;

    public DocenteService(JdbcTemplate jdbc, UsuarioRepository usuarios) {
        this.jdbc = jdbc;
        this.usuarios = usuarios;
    }

    // Busca el id del docente que corresponde al usuario autenticado
    private UUID docenteDe(UUID usuarioId) {

        Usuario usuario = usuarios.findById(usuarioId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado."));

        UUID docenteId = usuario.getDocenteId();

        if (docenteId == null) {
            throw new AccessDeniedException("La cuenta no está relacionada con un docente.");
        }

        return docenteId;
    }

    // Obtiene los datos del docente que inició sesión
    @Transactional(readOnly = true)
    public Map<String, Object> obtenerPerfil(UUID usuarioId) {

        UUID docenteId = docenteDe(usuarioId);

        return jdbc.queryForMap("""
            SELECT
                id,
                clave,
                nombre,
                apellidos,
                correo,
                telefono,
                estatus
            FROM docentes
            WHERE id = ?
            """, docenteId);
    }

    // Consulta los grupos que pertenecen al docente autenticado
    // (incluye carrera, número real de alumnos, estado de captura y pendientes)
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listarGrupos(UUID usuarioId) {

        UUID docenteId = docenteDe(usuarioId);

        return jdbc.queryForList("""
            SELECT
                g.id AS grupo_id,
                g.nombre_grupo,
                g.horario,
                g.cupo,
                m.clave AS clave_materia,
                m.nombre AS materia,
                m.creditos,
                m.semestre,
                p.nombre AS periodo,
                p.id AS periodo_id,
                p.es_actual AS periodo_actual,

                -- alumnos inscritos en el grupo
                (SELECT COUNT(*)
                   FROM cargas_academicas ca
                  WHERE ca.grupo_id = g.id) AS alumnos,

                -- carrera de la materia del grupo
                (SELECT c.nombre FROM carreras c WHERE c.id = m.carrera_id) AS carrera,

                -- alumnos sin calificación final
                (SELECT COUNT(*)
                   FROM cargas_academicas ca
                   LEFT JOIN calificaciones cal ON cal.carga_id = ca.id
                  WHERE ca.grupo_id = g.id
                    AND cal."final" IS NULL) AS pendientes,

                -- Completa si todos tienen final; Pendiente si falta alguno
                (SELECT CASE
                          WHEN COUNT(*) = 0 THEN NULL
                          WHEN COUNT(*) FILTER (WHERE cal."final" IS NULL) = 0 THEN 'Completa'
                          ELSE 'Pendiente'
                        END
                   FROM cargas_academicas ca
                   LEFT JOIN calificaciones cal ON cal.carga_id = ca.id
                  WHERE ca.grupo_id = g.id) AS captura

            FROM grupos g
            INNER JOIN materias m ON m.id = g.materia_id
            INNER JOIN periodos p ON p.id = g.periodo_id
            WHERE g.docente_id = ?
            ORDER BY m.nombre, g.nombre_grupo
            """, docenteId);
    }

    // ---------- consultas paginadas (el servidor filtra y pagina) ----------

    private static final Set<String> ESTATUS_ALUMNO = Set.of("inscrito", "baja", "aprobado", "reprobado", "pendiente");

    // tamaño de página entre 1 y 50 (por defecto 10)
    private int tamanio(int size) {
        return size < 1 ? 10 : Math.min(size, 50);
    }

    // escapa % y _ para que se busquen como texto normal
    private String patron(String q) {
        String limpio = q.trim().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        return "%" + limpio + "%";
    }

    private void verificarGrupo(UUID docenteId, UUID grupoId) {
        Integer existe = jdbc.queryForObject("SELECT COUNT(*) FROM grupos WHERE id = ?", Integer.class, grupoId);
        if (existe == null || existe == 0) {
            throw new RecursoNoEncontradoException("El grupo no existe.");
        }
        Integer propio = jdbc.queryForObject(
                "SELECT COUNT(*) FROM grupos WHERE id = ? AND docente_id = ?", Integer.class, grupoId, docenteId);
        if (propio == null || propio == 0) {
            throw new AccessDeniedException("El grupo no pertenece al docente.");
        }
    }

    // Mis grupos con búsqueda por materia, periodo ("actual", id o vacío = todos) y carrera
    @Transactional(readOnly = true)
    public PageResponse<Map<String, Object>> buscarGrupos(UUID usuarioId, String q, String periodo,
                                                          String carrera, int page, int size) {
        UUID docenteId = docenteDe(usuarioId);
        int tam = tamanio(size);
        int pag = Math.max(0, page);

        StringBuilder where = new StringBuilder(" WHERE g.docente_id = ?");
        List<Object> args = new ArrayList<>();
        args.add(docenteId);

        if (q != null && !q.isBlank()) {
            where.append(" AND (m.nombre ILIKE ? OR m.clave ILIKE ?)");
            String like = patron(q);
            args.add(like);
            args.add(like);
        }
        if (periodo != null && !periodo.isBlank()) {
            if ("actual".equalsIgnoreCase(periodo)) {
                where.append(" AND p.es_actual");
            } else {
                try {
                    where.append(" AND p.id = ?");
                    args.add(Integer.parseInt(periodo.trim()));
                } catch (NumberFormatException e) {
                    throw new SolicitudInvalidaException("El periodo no es válido.");
                }
            }
        }
        if (carrera != null && !carrera.isBlank()) {
            where.append("""
                 AND EXISTS (SELECT 1 FROM carreras c WHERE c.id = m.carrera_id AND c.nombre = ?)""");
            args.add(carrera.trim());
        }

        String desde = " FROM grupos g JOIN materias m ON m.id = g.materia_id JOIN periodos p ON p.id = g.periodo_id";

        Long total = jdbc.queryForObject("SELECT COUNT(*)" + desde + where, Long.class, args.toArray());
        long t = total == null ? 0 : total;

        List<Object> argsPagina = new ArrayList<>(args);
        argsPagina.add(tam);
        argsPagina.add((long) pag * tam);

        List<Map<String, Object>> items = jdbc.queryForList("""
            SELECT g.id AS grupo_id, g.nombre_grupo, g.horario, g.cupo,
                   m.clave AS clave_materia, m.nombre AS materia,
                   p.nombre AS periodo, p.id AS periodo_id, p.es_actual AS periodo_actual,
                   (SELECT COUNT(*) FROM cargas_academicas ca WHERE ca.grupo_id = g.id) AS alumnos,
                   (SELECT c.nombre FROM carreras c WHERE c.id = m.carrera_id) AS carrera,
                   (SELECT CASE
                             WHEN COUNT(*) = 0 THEN NULL
                             WHEN COUNT(*) FILTER (WHERE cal."final" IS NULL) = 0 THEN 'Completa'
                             ELSE 'Pendiente'
                           END
                      FROM cargas_academicas ca
                      LEFT JOIN calificaciones cal ON cal.carga_id = ca.id
                     WHERE ca.grupo_id = g.id) AS captura
            """ + desde + where + " ORDER BY p.es_actual DESC, m.nombre, g.nombre_grupo LIMIT ? OFFSET ?",
                argsPagina.toArray());

        int paginas = (int) Math.max(1, (t + tam - 1) / tam);
        return new PageResponse<>(items, pag, tam, t, paginas);
    }

    // opciones de los filtros de Mis grupos (periodos y carreras del docente)
    @Transactional(readOnly = true)
    public Map<String, Object> filtrosGrupos(UUID usuarioId) {
        UUID docenteId = docenteDe(usuarioId);

        List<Map<String, Object>> periodos = jdbc.queryForList("""
            SELECT DISTINCT p.id, p.nombre, p.es_actual AS actual, p.fecha_inicio
              FROM grupos g JOIN periodos p ON p.id = g.periodo_id
             WHERE g.docente_id = ?
             ORDER BY p.fecha_inicio DESC
            """, docenteId);

        List<String> carreras = jdbc.queryForList("""
            SELECT DISTINCT c.nombre
              FROM grupos g
              JOIN materias m ON m.id = g.materia_id
              JOIN carreras c ON c.id = m.carrera_id
             WHERE g.docente_id = ?
             ORDER BY c.nombre
            """, String.class, docenteId);

        Map<String, Object> r = new LinkedHashMap<>();
        r.put("periodos", periodos);
        r.put("carreras", carreras);
        return r;
    }

    private static final String ALUMNOS_DESDE = """
        FROM cargas_academicas ca
        JOIN inscripciones i ON i.id = ca.inscripcion_id
        JOIN alumnos a ON a.id = i.alumno_id
        LEFT JOIN carreras c ON c.id = a.carrera_id
        LEFT JOIN calificaciones cal ON cal.carga_id = ca.id
        """;

    // Alumnos de un grupo del docente (búsqueda, estatus y paginación en el servidor)
    @Transactional(readOnly = true)
    public PageResponse<Map<String, Object>> listarAlumnosDelGrupo(UUID usuarioId, UUID grupoId, String q,
                                                                   String estatus, int page, int size) {
        UUID docenteId = docenteDe(usuarioId);
        verificarGrupo(docenteId, grupoId);

        int tam = tamanio(size);
        int pag = Math.max(0, page);

        StringBuilder where = new StringBuilder(" WHERE ca.grupo_id = ?");
        List<Object> args = new ArrayList<>();
        args.add(grupoId);
        filtrosAlumnos(where, args, q, estatus);

        Long total = jdbc.queryForObject("SELECT COUNT(*) " + ALUMNOS_DESDE + where, Long.class, args.toArray());
        long t = total == null ? 0 : total;

        List<Object> argsPagina = new ArrayList<>(args);
        argsPagina.add(tam);
        argsPagina.add((long) pag * tam);

        List<Map<String, Object>> items = jdbc.queryForList("""
            SELECT ca.id AS carga_id, a.matricula, a.nombre, a.apellido_paterno, a.apellido_materno,
                   c.nombre AS carrera, a.semestre_actual AS semestre,
                   i.estatus AS estatus_inscripcion,
                   cal.parcial, cal."final" AS "final",
                   COALESCE(cal.estatus, 'pendiente') AS estatus_nota,
                   (SELECT ROUND(AVG(v)::numeric, 1) FROM (VALUES (cal.parcial), (cal."final")) t(v)) AS promedio
            """ + ALUMNOS_DESDE + where + " ORDER BY a.matricula LIMIT ? OFFSET ?", argsPagina.toArray());

        int paginas = (int) Math.max(1, (t + tam - 1) / tam);
        return new PageResponse<>(items, pag, tam, t, paginas);
    }

    private void filtrosAlumnos(StringBuilder where, List<Object> args, String q, String estatus) {
        if (q != null && !q.isBlank()) {
            where.append(" AND ((a.nombre || ' ' || a.apellido_paterno || ' ' || COALESCE(a.apellido_materno, '')) ILIKE ?"
                    + " OR a.matricula ILIKE ?)");
            String like = patron(q);
            args.add(like);
            args.add(like);
        }
        if (estatus != null && !estatus.isBlank()) {
            String e = estatus.trim().toLowerCase();
            if (!ESTATUS_ALUMNO.contains(e)) {
                throw new SolicitudInvalidaException("El estatus no es válido.");
            }
            if (e.equals("inscrito") || e.equals("baja")) {
                where.append(" AND i.estatus = ?");
            } else {
                where.append(" AND COALESCE(cal.estatus, 'pendiente') = ?");
            }
            args.add(e);
        }
    }

    // Reporte del grupo: cifras generales + alumnos con promedio menor a 7.0 (paginados)
    @Transactional(readOnly = true)
    public Map<String, Object> reporteGrupo(UUID usuarioId, UUID grupoId, int page, int size) {
        UUID docenteId = docenteDe(usuarioId);
        verificarGrupo(docenteId, grupoId);

        int tam = tamanio(size);
        int pag = Math.max(0, page);

        Map<String, Object> cifras = jdbc.queryForMap("""
            SELECT COUNT(*) AS total_alumnos,
                   COUNT(*) FILTER (WHERE cal.estatus = 'aprobado') AS aprobados,
                   ROUND(AVG(pr.prom)::numeric, 1) AS promedio_grupo,
                   COUNT(*) FILTER (WHERE pr.prom < 7) AS en_riesgo
            FROM cargas_academicas ca
            LEFT JOIN calificaciones cal ON cal.carga_id = ca.id
            LEFT JOIN LATERAL (SELECT AVG(v) AS prom FROM (VALUES (cal.parcial), (cal."final")) t(v)) pr ON true
            WHERE ca.grupo_id = ?
            """, grupoId);

        long riesgo = ((Number) cifras.get("en_riesgo")).longValue();

        List<Map<String, Object>> items = jdbc.queryForList("""
            SELECT ca.id AS carga_id, a.matricula, a.nombre, a.apellido_paterno, a.apellido_materno,
                   cal.parcial, cal."final" AS "final",
                   ROUND(pr.prom::numeric, 1) AS promedio,
                   CASE WHEN pr.prom < 6 THEN 'Reprobado' ELSE 'En riesgo' END AS estatus_riesgo
            FROM cargas_academicas ca
            JOIN inscripciones i ON i.id = ca.inscripcion_id
            JOIN alumnos a ON a.id = i.alumno_id
            JOIN calificaciones cal ON cal.carga_id = ca.id
            JOIN LATERAL (SELECT AVG(v) AS prom FROM (VALUES (cal.parcial), (cal."final")) t(v)) pr ON true
            WHERE ca.grupo_id = ? AND pr.prom < 7
            ORDER BY pr.prom, a.matricula
            LIMIT ? OFFSET ?
            """, grupoId, tam, (long) pag * tam);

        int paginas = (int) Math.max(1, (riesgo + tam - 1) / tam);

        Map<String, Object> r = new LinkedHashMap<>(cifras);
        r.put("alumnos", new PageResponse<>(items, pag, tam, riesgo, paginas));
        return r;
    }

    // Guarda (o actualiza) parcial y final de una carga académica del docente
    @Transactional
    public void guardarCalificacion(UUID usuarioId, UUID cargaId,
                                    BigDecimal parcial, BigDecimal fin) {

        UUID docenteId = docenteDe(usuarioId);

        validarNota(parcial);
        validarNota(fin);

        // la carga debe pertenecer a un grupo del docente
        Integer propia = jdbc.queryForObject("""
            SELECT COUNT(*)
            FROM cargas_academicas ca
            INNER JOIN grupos g ON g.id = ca.grupo_id
            WHERE ca.id = ? AND g.docente_id = ?
            """, Integer.class, cargaId, docenteId);

        if (propia == null || propia == 0) {
            throw new AccessDeniedException("El alumno no pertenece a un grupo del docente.");
        }

        int actualizadas = jdbc.update("""
            UPDATE calificaciones
               SET parcial = ?, "final" = ?, capturada_en = now()
             WHERE carga_id = ?
            """, parcial, fin, cargaId);

        if (actualizadas == 0) {
            jdbc.update("""
                INSERT INTO calificaciones (id, carga_id, parcial, "final", capturada_en)
                VALUES (gen_random_uuid(), ?, ?, ?, now())
                """, cargaId, parcial, fin);
        }
    }

    // las calificaciones van de 0 a 10
    private void validarNota(BigDecimal nota) {
        if (nota != null
                && (nota.compareTo(BigDecimal.ZERO) < 0 || nota.compareTo(BigDecimal.TEN) > 0)) {
            throw new SolicitudInvalidaException("La calificación debe estar entre 0 y 10.");
        }
    }
}