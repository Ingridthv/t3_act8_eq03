package mx.edu.controlalumnos.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import mx.edu.controlalumnos.model.Usuario;
import mx.edu.controlalumnos.repository.UsuarioRepository;

import org.springframework.jdbc.core.JdbcTemplate;
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
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado."));

        UUID docenteId = usuario.getDocenteId();

        if (docenteId == null) {
            throw new IllegalArgumentException("La cuenta no está relacionada con un docente.");
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

                -- alumnos inscritos en el grupo
                (SELECT COUNT(*)
                   FROM cargas_academicas ca
                  WHERE ca.grupo_id = g.id) AS alumnos,

                -- carrera(s) de los alumnos del grupo
                (SELECT string_agg(DISTINCT c.nombre, ', ')
                   FROM cargas_academicas ca
                   JOIN inscripciones i ON i.id = ca.inscripcion_id
                   JOIN alumnos a ON a.id = i.alumno_id
                   JOIN carreras c ON c.id = a.carrera_id
                  WHERE ca.grupo_id = g.id) AS carrera,

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

    // Alumnos de un grupo del docente, con su parcial y final
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listarAlumnosDelGrupo(UUID usuarioId, UUID grupoId) {

        UUID docenteId = docenteDe(usuarioId);

        // el grupo debe ser del docente autenticado
        Integer propio = jdbc.queryForObject("""
            SELECT COUNT(*) FROM grupos WHERE id = ? AND docente_id = ?
            """, Integer.class, grupoId, docenteId);

        if (propio == null || propio == 0) {
            throw new IllegalArgumentException("El grupo no pertenece al docente.");
        }

        return jdbc.queryForList("""
            SELECT
                ca.id AS carga_id,
                a.matricula,
                a.nombre,
                a.apellido_paterno,
                a.apellido_materno,
                c.nombre AS carrera,
                a.semestre_actual AS semestre,
                a.estatus,
                cal.parcial,
                cal."final" AS "final"
            FROM cargas_academicas ca
            INNER JOIN inscripciones i ON i.id = ca.inscripcion_id
            INNER JOIN alumnos a ON a.id = i.alumno_id
            LEFT JOIN carreras c ON c.id = a.carrera_id
            LEFT JOIN calificaciones cal ON cal.carga_id = ca.id
            WHERE ca.grupo_id = ?
            ORDER BY a.matricula
            """, grupoId);
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
            throw new IllegalArgumentException("El alumno no pertenece a un grupo del docente.");
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
            throw new IllegalArgumentException("La calificación debe estar entre 0 y 10.");
        }
    }
}
