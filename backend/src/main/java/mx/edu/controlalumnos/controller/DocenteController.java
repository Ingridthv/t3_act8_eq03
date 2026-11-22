package mx.edu.controlalumnos.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import mx.edu.controlalumnos.security.AuthUser;
import mx.edu.controlalumnos.service.DocenteService;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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

    // Alumnos de un grupo del docente, con parcial y final
    @GetMapping("/grupos/{grupoId}/alumnos")
    public List<Map<String, Object>> alumnosDelGrupo(
            @AuthenticationPrincipal AuthUser usuario,
            @PathVariable UUID grupoId) {
        return servicio.listarAlumnosDelGrupo(usuario.id(), grupoId);
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
            throw new IllegalArgumentException("La calificación no es un número válido.");
        }
    }
}
