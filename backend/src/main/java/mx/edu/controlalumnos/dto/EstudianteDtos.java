package mx.edu.controlalumnos.dto;

import java.math.BigDecimal;
import java.util.List;

/** Respuestas del módulo del estudiante (solo lectura, siempre de su propia cuenta). */
public final class EstudianteDtos {

    private EstudianteDtos() {
    }

    public record Perfil(String nombre, String nombreCompleto, String matricula, String correo, String carrera,
                         int semestreActual, int anioIngreso, String estatus, BigDecimal promedio) {
    }

    public record Resumen(String nombre, String periodoActual, BigDecimal promedio, int materiasEnCurso,
                          int semestreActual, List<MateriaFila> materias) {
    }

    public record PeriodoOpcion(int id, String nombre, boolean actual) {
    }

    public record MateriaFila(String clave, String materia, String docente, String grupo, String horario,
                              int creditos, String periodo, String estatus) {
    }

    public record CalificacionFila(String periodo, String clave, String materia, String docente,
                                   BigDecimal parcial, BigDecimal calificacionFinal, String estatus) {
    }
}
