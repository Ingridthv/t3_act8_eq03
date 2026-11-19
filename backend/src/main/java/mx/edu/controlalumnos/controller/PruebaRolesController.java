package mx.edu.controlalumnos.controller;

import java.util.Map;
import mx.edu.controlalumnos.security.AuthUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Rutas de ejemplo para comprobar que cada rol solo entra a lo suyo (403 en las demás).
 * Se reemplazan por los CRUD reales en el siguiente avance.
 */
@RestController
@RequestMapping("/api")
public class PruebaRolesController {

    @GetMapping("/admin/ping")
    public Map<String, String> admin(@AuthenticationPrincipal AuthUser u) {
        return Map.of("mensaje", "Hola administrador", "correo", u.correo());
    }

    @GetMapping("/docente/ping")
    public Map<String, String> docente(@AuthenticationPrincipal AuthUser u) {
        return Map.of("mensaje", "Hola docente", "correo", u.correo());
    }

    @GetMapping("/estudiante/ping")
    public Map<String, String> estudiante(@AuthenticationPrincipal AuthUser u) {
        return Map.of("mensaje", "Hola estudiante", "correo", u.correo());
    }
}
