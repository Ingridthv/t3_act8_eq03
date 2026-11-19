package mx.edu.controlalumnos.repository;

import java.util.Optional;
import java.util.UUID;
import mx.edu.controlalumnos.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {
    Optional<Usuario> findByCorreoIgnoreCase(String correo);
}
