package mx.edu.controlalumnos.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

// datos que llegan al crear o editar una carrera
public record CarreraRequest(
        @NotBlank(message = "La clave es obligatoria.")
        @Size(max = 10, message = "La clave admite máximo 10 caracteres.")
        String clave,

        @NotBlank(message = "El nombre es obligatorio.")
        @Size(max = 150, message = "El nombre admite máximo 150 caracteres.")
        String nombre,

        @NotNull(message = "La duración en semestres es obligatoria.")
        @Min(value = 1, message = "La duración mínima es 1 semestre.")
        @Max(value = 14, message = "La duración máxima es 14 semestres.")
        Short duracionSemestres,

        UUID coordinadorId,
        Boolean activa
) {}