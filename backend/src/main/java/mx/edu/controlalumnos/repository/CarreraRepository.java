package mx.edu.controlalumnos.repository;

import mx.edu.controlalumnos.model.Carrera;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CarreraRepository extends JpaRepository<Carrera, Short> {

        // busqueda por texto, filtro de estado y filtro de duracion, todo en el servidor.
    // si todas es true se ignora el filtro de activa, y si duracion es 0 se ignora el de duracion
    @Query("""
        select c from Carrera c
        where (:q = ''
               or lower(c.nombre) like lower(concat('%', :q, '%'))
               or lower(c.clave) like lower(concat('%', :q, '%')))
          and (:todas = true or c.activa = :activa)
          and (:duracion = 0 or cast(c.duracionSemestres as Integer) = :duracion)
        """)
    Page<Carrera> buscar(@Param("q") String q,
                         @Param("todas") boolean todas,
                         @Param("activa") boolean activa,
                         @Param("duracion") int duracion,
                         Pageable pageable);

    // para validar que no se repitan clave ni nombre
    boolean existsByClaveIgnoreCase(String clave);
    boolean existsByNombreIgnoreCase(String nombre);
    boolean existsByClaveIgnoreCaseAndIdNot(String clave, Short id);
    boolean existsByNombreIgnoreCaseAndIdNot(String nombre, Short id);
}