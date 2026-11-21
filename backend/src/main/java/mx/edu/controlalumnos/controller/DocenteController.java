
package mx.edu.controlalumnos.controller;

import java.util.List;
import java.util.Map;

import mx.edu.controlalumnos.security.AuthUser;
import mx.edu.controlalumnos.service.DocenteService;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
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
}
