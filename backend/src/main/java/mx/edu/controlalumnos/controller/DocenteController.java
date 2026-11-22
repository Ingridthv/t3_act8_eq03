package mx.edu.controlalumnos.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import mx.edu.controlalumnos.dto.PageResponse;
import mx.edu.controlalumnos.exception.SolicitudInvalidaException;
import mx.edu.controlalumnos.security.AuthUser;
import mx.edu.controlalumnos.service.DocenteService;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/docente")
public class DocenteController {

    private final DocenteService servicio;

    public DocenteController(DocenteService servicio) {
        this.servicio = servicio;
    }

    // Consulta los datos del docente que inició sesión
    @GetMapping("/perfil")
    public Map<String, Object> perfil(@AuthenticationPrincipal AuthUser usuario) {
        return servicio.obtenerPerfil(usuario.id());
    }

    // Consulta los grupos asignados al docente
    @GetMapping("/grupos")
    public List<Map<String, Object>> grupos(@AuthenticationPrincipal AuthUser usuario) {
        return servicio.listarGrupos(usuario.id());
    }

    // Mis grupos paginados: GET /api/docente/grupos/pagina?page=0&size=10&q=web&periodo=actual&carrera=...
    @GetMapping("/grupos/pagina")
    public PageResponse<Map<String, Object>> gruposPagina(
            @AuthenticationPrincipal AuthUser usuario,
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "") String periodo,
            @RequestParam(defaultValue = "") String carrera,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return servicio.buscarGrupos(usuario.id(), q, periodo, carrera, page, size);
    }

    // opciones de los filtros (periodos y carreras del docente)
    @GetMapping("/grupos/filtros")
    public Map<String, Object> filtros(@AuthenticationPrincipal AuthUser usuario) {
        return servicio.filtrosGrupos(usuario.id());
    }

    // Alumnos de un grupo del docente, con parcial y final (paginado en el servidor)
    @GetMapping("/grupos/{grupoId}/alumnos")
    public PageResponse<Map<String, Object>> alumnosDelGrupo(
            @AuthenticationPrincipal AuthUser usuario,
            @PathVariable UUID grupoId,
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "") String estatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return servicio.listarAlumnosDelGrupo(usuario.id(), grupoId, q, estatus, page, size);
    }

    // Reporte del grupo (promedio, aprobados y alumnos con promedio menor a 7.0)
    @GetMapping("/grupos/{grupoId}/reporte")
    public Map<String, Object> reporte(
            @AuthenticationPrincipal AuthUser usuario,
            @PathVariable UUID grupoId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return servicio.reporteGrupo(usuario.id(), grupoId, page, size);
    }

    // Guarda parcial y final de un alumno (cargaId = carga académica)
    @PutMapping("/calificaciones/{cargaId}")
    public Map<String, Object> guardarCalificacion(
            @AuthenticationPrincipal AuthUser usuario,
            @PathVariable UUID cargaId,
            @RequestBody Map<String, Object> cuerpo) {

        servicio.guardarCalificacion(
                usuario.id(),
                cargaId,
                aDecimal(cuerpo.get("parcial")),
                aDecimal(cuerpo.get("final")));

        return Map.of("mensaje", "Calificación guardada");
    }

    // convierte el valor recibido a número (vacío = sin calificación)
    private BigDecimal aDecimal(Object valor) {
        if (valor == null || String.valueOf(valor).isBlank()) {
            return null;
        }
        try {
            return new BigDecimal(String.valueOf(valor));
        } catch (NumberFormatException e) {
            throw new SolicitudInvalidaException("La calificación no es un número válido.");
        }
    }
}
