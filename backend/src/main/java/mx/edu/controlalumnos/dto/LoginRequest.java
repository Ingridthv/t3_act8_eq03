package mx.edu.controlalumnos.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "Ingresa tu correo institucional.")
        @Email(message = "Escribe un correo válido.")
        @Size(max = 120, message = "El correo es demasiado largo.")
        String correo,

        @NotBlank(message = "Ingresa tu contraseña.")
        @Size(max = 100, message = "La contraseña es demasiado larga.")
        String password) {
}
