package mx.edu.controlalumnos.admin;

import jakarta.validation.Valid;
import java.util.Map;
import java.util.UUID;
import mx.edu.controlalumnos.admin.AlumnoAdminService.AlumnoRequest;
import mx.edu.controlalumnos.admin.CalificacionAdminService.CalificacionRequest;
import mx.edu.controlalumnos.admin.InscripcionAdminService.InscripcionRequest;
import mx.edu.controlalumnos.admin.UsuarioAdminService.UsuarioRequest;
import mx.edu.controlalumnos.dto.PageResponse;
import mx.edu.controlalumnos.security.AuthUser;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** CRUD del administrador: alumnos y usuarios (solo rol administrador, ver SecurityConfig). */
@RestController
@RequestMapping("/api/admin")
public class PersonasAdminController {

    private final AlumnoAdminService alumnos;
    private final UsuarioAdminService usuarios;

    private final InscripcionAdminService inscripciones;
    private final CalificacionAdminService calificaciones;

    public PersonasAdminController(AlumnoAdminService alumnos, UsuarioAdminService usuarios,
                                   InscripcionAdminService inscripciones, CalificacionAdminService calificaciones) {
        this.alumnos = alumnos;
        this.usuarios = usuarios;
        this.inscripciones = inscripciones;
        this.calificaciones = calificaciones;
    }

    // GET /api/admin/inscripciones?page=0&size=10&q=ana&carrera=1&periodo=actual&estatus=inscrito
    @GetMapping("/inscripciones")
    public PageResponse<Map<String, Object>> listarInscripciones(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "") String carrera,
            @RequestParam(defaultValue = "") String periodo,
            @RequestParam(defaultValue = "") String estatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return inscripciones.listar(q, carrera, periodo, estatus, page, size);
    }

    @PostMapping("/inscripciones")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> crearInscripcion(@Valid @RequestBody InscripcionRequest req) {
        return inscripciones.crear(req);
    }

    @PutMapping("/inscripciones/{id}")
    public Map<String, Object> actualizarInscripcion(@PathVariable UUID id, @Valid @RequestBody InscripcionRequest req) {
        return inscripciones.actualizar(id, req);
    }

    @DeleteMapping("/inscripciones/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminarInscripcion(@PathVariable UUID id) {
        inscripciones.eliminar(id);
    }

    /* ---------- materias de una inscripción: las asigna el administrador ---------- */

    @GetMapping("/inscripciones/{id}/materias")
    public java.util.List<Map<String, Object>> materiasDeInscripcion(@PathVariable UUID id) {
        return inscripciones.materias(id);
    }

    @GetMapping("/inscripciones/{id}/grupos-disponibles")
    public java.util.List<Map<String, Object>> gruposDisponibles(@PathVariable UUID id) {
        return inscripciones.gruposDisponibles(id);
    }

    // body: { "grupoId": "<uuid>" }
    @PostMapping("/inscripciones/{id}/materias")
    @ResponseStatus(HttpStatus.CREATED)
    public java.util.List<Map<String, Object>> asignarMateria(@PathVariable UUID id,
                                                              @RequestBody Map<String, String> body) {
        String g = body.get("grupoId");
        if (g == null || g.isBlank()) {
            throw new mx.edu.controlalumnos.exception.SolicitudInvalidaException("Selecciona un grupo.");
        }
        return inscripciones.asignarMateria(id, UUID.fromString(g));
    }

    @DeleteMapping("/inscripciones/{id}/materias/{cargaId}")
    public java.util.List<Map<String, Object>> quitarMateria(@PathVariable UUID id, @PathVariable UUID cargaId) {
        return inscripciones.quitarMateria(id, cargaId);
    }

    // GET /api/admin/calificaciones?page=0&size=10&q=ana&materia=<uuid>&parcial=aprobatorio&periodo=actual&estatus=pendiente
    @GetMapping("/calificaciones")
    public PageResponse<Map<String, Object>> listarCalificaciones(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "") String materia,
            @RequestParam(defaultValue = "") String parcial,
            @RequestParam(defaultValue = "") String periodo,
            @RequestParam(defaultValue = "") String estatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return calificaciones.listar(q, materia, parcial, periodo, estatus, page, size);
    }

    @PostMapping("/calificaciones")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> capturarCalificacion(@Valid @RequestBody CalificacionRequest req) {
        return calificaciones.crear(req);
    }

    @PutMapping("/calificaciones/{id}")
    public Map<String, Object> actualizarCalificacion(@PathVariable UUID id, @Valid @RequestBody CalificacionRequest req) {
        return calificaciones.actualizar(id, req);
    }

    @DeleteMapping("/calificaciones/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminarCalificacion(@PathVariable UUID id) {
        calificaciones.eliminar(id);
    }

    // GET /api/admin/alumnos?page=0&size=10&q=ana&carrera=1&semestre=4&estatus=activo&ingreso=2020
    @GetMapping("/alumnos")
    public PageResponse<Map<String, Object>> listarAlumnos(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "") String carrera,
            @RequestParam(defaultValue = "") String semestre,
            @RequestParam(defaultValue = "") String estatus,
            @RequestParam(defaultValue = "") String ingreso,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return alumnos.listar(q, carrera, semestre, estatus, ingreso, page, size);
    }

    @GetMapping("/alumnos/{id}")
    public Map<String, Object> obtenerAlumno(@PathVariable UUID id) {
        return alumnos.detalle(id);
    }

    @PostMapping("/alumnos")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> crearAlumno(@Valid @RequestBody AlumnoRequest req) {
        return alumnos.crear(req);
    }

    @PutMapping("/alumnos/{id}")
    public Map<String, Object> actualizarAlumno(@PathVariable UUID id, @Valid @RequestBody AlumnoRequest req) {
        return alumnos.actualizar(id, req);
    }

    @DeleteMapping("/alumnos/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminarAlumno(@PathVariable UUID id) {
        alumnos.eliminar(id);
    }

    // GET /api/admin/usuarios?page=0&size=10&q=ana&rol=docente&estatus=activo
    @GetMapping("/usuarios")
    public PageResponse<Map<String, Object>> listarUsuarios(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "") String rol,
            @RequestParam(defaultValue = "") String estatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return usuarios.listar(q, rol, estatus, page, size);
    }

    @PostMapping("/usuarios")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> crearUsuario(@Valid @RequestBody UsuarioRequest req) {
        return usuarios.crear(req);
    }

    @PutMapping("/usuarios/{id}")
    public Map<String, Object> actualizarUsuario(@PathVariable UUID id, @Valid @RequestBody UsuarioRequest req,
                                                 @AuthenticationPrincipal AuthUser yo) {
        return usuarios.actualizar(id, req, yo.id());
    }

    @DeleteMapping("/usuarios/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminarUsuario(@PathVariable UUID id, @AuthenticationPrincipal AuthUser yo) {
        usuarios.eliminar(id, yo.id());
    }
}
