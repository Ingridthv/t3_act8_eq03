package mx.edu.controlalumnos.admin;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Inicio y Reportes del administrador (solo rol administrador, ver SecurityConfig). */
@RestController
@RequestMapping("/api/admin")
public class ReportesAdminController {

    private final ReporteAdminService servicio;

    public ReportesAdminController(ReporteAdminService servicio) {
        this.servicio = servicio;
    }

    @GetMapping("/resumen")
    public Map<String, Object> resumen() {
        return servicio.resumen();
    }

    // GET /api/admin/reportes?tipo=actuales&periodo=4
    @GetMapping("/reportes")
    public Map<String, Object> reporte(@RequestParam(defaultValue = "todos") String tipo,
                                       @RequestParam(defaultValue = "") String periodo) {
        return servicio.reporte(tipo, periodo);
    }
}
