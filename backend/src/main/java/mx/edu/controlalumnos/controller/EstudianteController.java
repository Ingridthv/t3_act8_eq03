package mx.edu.controlalumnos.controller;

import java.util.List;
import mx.edu.controlalumnos.dto.EstudianteDtos.CalificacionFila;
import mx.edu.controlalumnos.dto.EstudianteDtos.MateriaFila;
import mx.edu.controlalumnos.dto.EstudianteDtos.PeriodoOpcion;
import mx.edu.controlalumnos.dto.EstudianteDtos.Perfil;
import mx.edu.controlalumnos.dto.EstudianteDtos.Resumen;
import mx.edu.controlalumnos.dto.PageResponse;
import mx.edu.controlalumnos.security.AuthUser;
import mx.edu.controlalumnos.service.EstudianteService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Módulo del estudiante. SecurityConfig solo deja entrar a /api/estudiante/** al rol ESTUDIANTE. */
@RestController
@RequestMapping("/api/estudiante")
public class EstudianteController {

    private final EstudianteService service;

    public EstudianteController(EstudianteService service) {
        this.service = service;
    }

    @GetMapping("/resumen")
    public Resumen resumen(@AuthenticationPrincipal AuthUser u) {
        return service.resumen(u.id());
    }

    @GetMapping("/perfil")
    public Perfil perfil(@AuthenticationPrincipal AuthUser u) {
        return service.perfil(u.id());
    }

    @GetMapping("/periodos")
    public List<PeriodoOpcion> periodos(@AuthenticationPrincipal AuthUser u) {
        return service.periodos(u.id());
    }

    // ejemplo: GET /api/estudiante/materias?page=0&size=10&q=web&periodo=actual&estatus=en curso
    @GetMapping("/materias")
    public PageResponse<MateriaFila> materias(@AuthenticationPrincipal AuthUser u,
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "") String periodo,
            @RequestParam(defaultValue = "") String estatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return service.materias(u.id(), q, periodo, estatus, page, size);
    }

    // sirve para "Mis calificaciones" (más reciente primero) y "Mi historial" (orden=asc)
    @GetMapping("/calificaciones")
    public PageResponse<CalificacionFila> calificaciones(@AuthenticationPrincipal AuthUser u,
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "") String periodo,
            @RequestParam(defaultValue = "") String estatus,
            @RequestParam(defaultValue = "desc") String orden,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return service.calificaciones(u.id(), q, periodo, estatus, orden, page, size);
    }
}
