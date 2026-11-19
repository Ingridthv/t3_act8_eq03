package mx.edu.controlalumnos.security;

import java.time.Instant;
import java.util.UUID;

/** Usuario autenticado dentro de una petición (sale del JWT). */
public record AuthUser(UUID id, String correo, String rol, String jti, Instant expiraEn) {
}
