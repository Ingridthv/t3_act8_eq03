package mx.edu.controlalumnos.controller;

import jakarta.validation.Valid;
import mx.edu.controlalumnos.dto.CarreraRequest;
import mx.edu.controlalumnos.dto.CarreraResponse;
import mx.edu.controlalumnos.dto.PageResponse;
import mx.edu.controlalumnos.service.CarreraService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
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

// crud de carreras. solo entra el administrador (lo valida SecurityConfig con /api/admin/**)
@RestController
@RequestMapping("/api/admin/carreras")
public class CarreraAdminController {

    private final CarreraService service;

    public CarreraAdminController(CarreraService service) {
        this.service = service;
    }

    // ejemplo: GET /api/admin/carreras?page=0&size=10&q=sis&estado=activa
    @GetMapping
    public PageResponse<CarreraResponse> listar(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "") String estado,
            @PageableDefault(size = 10, sort = "nombre") Pageable pageable) {
        return service.listar(q, estado, pageable);
    }

    @GetMapping("/{id}")
    public CarreraResponse obtener(@PathVariable Short id) {
        return service.obtener(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CarreraResponse crear(@Valid @RequestBody CarreraRequest req) {
        return service.crear(req);
    }

    @PutMapping("/{id}")
    public CarreraResponse actualizar(@PathVariable Short id, @Valid @RequestBody CarreraRequest req) {
        return service.actualizar(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Short id) {
        service.eliminar(id);
    }
}