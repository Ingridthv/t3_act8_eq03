package mx.edu.controlalumnos.admin;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import mx.edu.controlalumnos.dto.PageResponse;
import mx.edu.controlalumnos.admin.DocenteAdminService.DocenteRequest;
import mx.edu.controlalumnos.admin.GrupoAdminService.GrupoRequest;
import mx.edu.controlalumnos.admin.MateriaAdminService.MateriaRequest;
import mx.edu.controlalumnos.admin.PeriodoAdminService.PeriodoRequest;
import org.springframework.http.HttpStatus;
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

/** CRUD del administrador: docentes, materias y periodos (solo rol administrador, ver SecurityConfig). */
@RestController
@RequestMapping("/api/admin")
public class CatalogosAdminController {

    private final DocenteAdminService docentes;
    private final MateriaAdminService materias;
    private final GrupoAdminService grupos;
    private final PeriodoAdminService periodos;
    private final OpcionesAdminService opciones;

    public CatalogosAdminController(DocenteAdminService docentes, MateriaAdminService materias,
                                    GrupoAdminService grupos, PeriodoAdminService periodos, OpcionesAdminService opciones) {
        this.docentes = docentes;
        this.materias = materias;
        this.grupos = grupos;
        this.periodos = periodos;
        this.opciones = opciones;
    }

    /* ---------- opciones para selects ---------- */

    @GetMapping("/opciones/{tipo}")
    public List<Map<String, Object>> opciones(@PathVariable String tipo) {
        return opciones.opciones(tipo);
    }

    /* ---------- docentes ---------- */

    // GET /api/admin/docentes?page=0&size=10&q=ortiz&carrera=1&estatus=activo
    @GetMapping("/docentes")
    public PageResponse<Map<String, Object>> listarDocentes(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "") String carrera,
            @RequestParam(defaultValue = "") String estatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return docentes.listar(q, carrera, estatus, page, size);
    }

    @PostMapping("/docentes")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> crearDocente(@Valid @RequestBody DocenteRequest req) {
        return docentes.crear(req);
    }

    @PutMapping("/docentes/{id}")
    public Map<String, Object> actualizarDocente(@PathVariable UUID id, @Valid @RequestBody DocenteRequest req) {
        return docentes.actualizar(id, req);
    }

    @DeleteMapping("/docentes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminarDocente(@PathVariable UUID id) {
        docentes.eliminar(id);
    }

    /* ---------- materias ---------- */

    // GET /api/admin/materias?page=0&size=10&q=web&carrera=1&semestre=3&estatus=activa
    @GetMapping("/materias")
    public PageResponse<Map<String, Object>> listarMaterias(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "") String carrera,
            @RequestParam(defaultValue = "") String semestre,
            @RequestParam(defaultValue = "") String estatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return materias.listar(q, carrera, semestre, estatus, page, size);
    }

    @PostMapping("/materias")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> crearMateria(@Valid @RequestBody MateriaRequest req) {
        return materias.crear(req);
    }

    @PutMapping("/materias/{id}")
    public Map<String, Object> actualizarMateria(@PathVariable UUID id, @Valid @RequestBody MateriaRequest req) {
        return materias.actualizar(id, req);
    }

    @DeleteMapping("/materias/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminarMateria(@PathVariable UUID id) {
        materias.eliminar(id);
    }

    /* ---------- grupos (materia + docente + horario) ---------- */

    // GET /api/admin/grupos?page=0&size=10&q=web&carrera=1&docente=<uuid>&periodo=actual
    @GetMapping("/grupos")
    public PageResponse<Map<String, Object>> listarGrupos(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "") String carrera,
            @RequestParam(defaultValue = "") String docente,
            @RequestParam(defaultValue = "actual") String periodo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return grupos.listar(q, carrera, docente, periodo, page, size);
    }

    @PostMapping("/grupos")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> crearGrupo(@Valid @RequestBody GrupoRequest req) {
        return grupos.crear(req);
    }

    @PutMapping("/grupos/{id}")
    public Map<String, Object> actualizarGrupo(@PathVariable UUID id, @Valid @RequestBody GrupoRequest req) {
        return grupos.actualizar(id, req);
    }

    @DeleteMapping("/grupos/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminarGrupo(@PathVariable UUID id) {
        grupos.eliminar(id);
    }

    /* ---------- periodos ---------- */

    // GET /api/admin/periodos?page=0&size=10&q=2021&anio=2021&estatus=actual
    @GetMapping("/periodos")
    public PageResponse<Map<String, Object>> listarPeriodos(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "") String anio,
            @RequestParam(defaultValue = "") String estatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return periodos.listar(q, anio, estatus, page, size);
    }

    @PostMapping("/periodos")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> crearPeriodo(@Valid @RequestBody PeriodoRequest req) {
        return periodos.crear(req);
    }

    @PutMapping("/periodos/{id}")
    public Map<String, Object> actualizarPeriodo(@PathVariable Short id, @Valid @RequestBody PeriodoRequest req) {
        return periodos.actualizar(id, req);
    }

    @DeleteMapping("/periodos/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminarPeriodo(@PathVariable Short id) {
        periodos.eliminar(id);
    }
}
