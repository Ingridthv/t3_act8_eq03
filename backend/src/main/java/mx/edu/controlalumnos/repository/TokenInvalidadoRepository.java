package mx.edu.controlalumnos.repository;

import mx.edu.controlalumnos.model.TokenInvalidado;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TokenInvalidadoRepository extends JpaRepository<TokenInvalidado, String> {
}
