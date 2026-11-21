package mx.edu.controlalumnos.dto;

import java.util.UUID;

// datos que se devuelven de una carrera
public record CarreraResponse(
        Short id,
        String clave,
        String nombre,
        Short duracionSemestres,
        UUID coordinadorId,
        boolean activa
) {}