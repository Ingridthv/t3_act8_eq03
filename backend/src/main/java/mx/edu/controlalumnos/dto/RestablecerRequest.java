package mx.edu.controlalumnos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record RestablecerRequest(
        @NotBlank(message = "Falta el código de recuperación.") String token,
        @NotBlank(message = "Escribe la nueva contraseña.")
        @Pattern(regexp = ReglasPassword.PATRON, message = ReglasPassword.MENSAJE) String nueva) {
}
