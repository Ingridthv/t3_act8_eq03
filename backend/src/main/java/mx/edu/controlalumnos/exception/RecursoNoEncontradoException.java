package mx.edu.controlalumnos.exception;

// se lanza cuando no existe el registro que piden (responde 404)
public class RecursoNoEncontradoException extends RuntimeException {
    public RecursoNoEncontradoException(String message) {
        super(message);
    }
}