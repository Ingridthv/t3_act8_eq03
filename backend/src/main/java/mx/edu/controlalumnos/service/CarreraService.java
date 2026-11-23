package mx.edu.controlalumnos.service;

import mx.edu.controlalumnos.dto.CarreraRequest;
import mx.edu.controlalumnos.dto.CarreraResponse;
import mx.edu.controlalumnos.dto.PageResponse;
import mx.edu.controlalumnos.exception.ConflictoException;
import mx.edu.controlalumnos.exception.RecursoNoEncontradoException;
import mx.edu.controlalumnos.model.Carrera;
import mx.edu.controlalumnos.repository.CarreraRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CarreraService {

    private final CarreraRepository repo;
    private final JdbcTemplate jdbc;

    public CarreraService(CarreraRepository repo, JdbcTemplate jdbc) {
        this.repo = repo;
        this.jdbc = jdbc;
    }

        // lista una pagina de carreras. la busqueda y los filtros se hacen en la base de datos
    @Transactional(readOnly = true)
    public PageResponse<CarreraResponse> listar(String q, String estado, int duracion, Pageable pageable) {
        boolean todas = estado == null || estado.isBlank();
        boolean activa = "activa".equalsIgnoreCase(estado);
        return PageResponse.of(repo.buscar(q.trim(), todas, activa, duracion, pageable).map(this::aRespuesta));
    }

    @Transactional(readOnly = true)
    public CarreraResponse obtener(Short id) {
        return aRespuesta(buscarPorId(id));
    }

    @Transactional
    public CarreraResponse crear(CarreraRequest req) {
        String clave = req.clave().trim().toUpperCase();
        String nombre = req.nombre().trim();
        // reviso que no se repita la clave ni el nombre
        if (repo.existsByClaveIgnoreCase(clave)) {
            throw new ConflictoException("Ya existe una carrera con esa clave.");
        }
        if (repo.existsByNombreIgnoreCase(nombre)) {
            throw new ConflictoException("Ya existe una carrera con ese nombre.");
        }
        Carrera c = new Carrera();
        aplicar(c, req, clave, nombre);
        return aRespuesta(repo.save(c));
    }

    @Transactional
    public CarreraResponse actualizar(Short id, CarreraRequest req) {
        Carrera c = buscarPorId(id);
        String clave = req.clave().trim().toUpperCase();
        String nombre = req.nombre().trim();
        // al editar se ignora la propia carrera al buscar repetidos
        if (repo.existsByClaveIgnoreCaseAndIdNot(clave, id)) {
            throw new ConflictoException("Ya existe otra carrera con esa clave.");
        }
        if (repo.existsByNombreIgnoreCaseAndIdNot(nombre, id)) {
            throw new ConflictoException("Ya existe otra carrera con ese nombre.");
        }
        aplicar(c, req, clave, nombre);
        return aRespuesta(repo.save(c));
    }

    @Transactional
    public void eliminar(Short id) {
        Carrera c = buscarPorId(id);
        repo.delete(c);
        // flush para que, si tiene alumnos relacionados, el error salga aqui y no despues
        repo.flush();
    }

    private Carrera buscarPorId(Short id) {
        return repo.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("La carrera no existe."));
    }

    
    // Copia los datos del formulario a la carrera
    private void aplicar(Carrera c, CarreraRequest req, String clave, String nombre) {
        c.setClave(clave);
        c.setNombre(nombre);
        c.setDuracionSemestres(req.duracionSemestres());

        // Solo cambia el coordinador si viene en la petición
        if (req.coordinadorId() != null) {
            c.setCoordinadorId(req.coordinadorId());
        }

        // Solo cambia el estado si viene en la petición
        if (req.activa() != null) {
            c.setActiva(req.activa());
        }
    }


    // convierte la entidad en el dto que se devuelve
    private CarreraResponse aRespuesta(Carrera c) {
        // alumnos activos de la carrera, contados en la base de datos
        Long alumnos = jdbc.queryForObject(
                "SELECT COUNT(*) FROM alumnos WHERE carrera_id = ? AND estatus = 'activo'", Long.class, c.getId());
        return new CarreraResponse(c.getId(), c.getClave(), c.getNombre(),
                c.getDuracionSemestres(), c.getCoordinadorId(), c.isActiva(), alumnos == null ? 0 : alumnos);
    }
}