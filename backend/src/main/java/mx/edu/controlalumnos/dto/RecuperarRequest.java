package mx.edu.controlalumnos.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record RecuperarRequest(
        @NotBlank(message = "Escribe tu correo institucional.")
        @Email(message = "Escribe un correo válido.") String correo) {
}
