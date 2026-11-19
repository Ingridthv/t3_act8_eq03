package mx.edu.controlalumnos.dto;

import java.time.Instant;
import java.util.UUID;

/** Datos del usuario autenticado (lo que React necesita para decidir a dónde ir). */
public record SesionResponse(
        UUID id,
        String correo,
        String nombre,
        String rol,
        boolean debeCambiarPassword,
        String token,
        Instant expiraEn) {
}
