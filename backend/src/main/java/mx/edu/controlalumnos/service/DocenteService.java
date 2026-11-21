
package mx.edu.controlalumnos.service;

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

    // Obtiene los datos del docente que inició sesión
    @Transactional(readOnly = true)
    public Map<String, Object> obtenerPerfil(UUID usuarioId) {

        Usuario usuario = usuarios.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado."));

        UUID docenteId = usuario.getDocenteId();

        if (docenteId == null) {
            throw new IllegalArgumentException("La cuenta no está relacionada con un docente.");
        }

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
    @Transactional(readOnly = true)
    public java.util.List<Map<String, Object>> listarGrupos(UUID usuarioId) {

        Usuario usuario = usuarios.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado."));

        UUID docenteId = usuario.getDocenteId();

        if (docenteId == null) {
            throw new IllegalArgumentException("La cuenta no está relacionada con un docente.");
        }

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
                p.nombre AS periodo
            FROM grupos g
            INNER JOIN materias m ON m.id = g.materia_id
            INNER JOIN periodos p ON p.id = g.periodo_id
            WHERE g.docente_id = ?
            ORDER BY m.nombre, g.nombre_grupo
            """, docenteId);
    }
}
