package mx.edu.controlalumnos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CambiarPasswordRequest(
        @NotBlank(message = "Escribe tu contraseña actual.") String actual,
        @NotBlank(message = "Escribe la nueva contraseña.")
        @Pattern(regexp = ReglasPassword.PATRON, message = ReglasPassword.MENSAJE) String nueva) {
}
