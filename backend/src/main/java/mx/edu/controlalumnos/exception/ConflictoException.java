package mx.edu.controlalumnos.exception;

// se lanza cuando hay un conflicto, por ejemplo una clave repetida (responde 409)
public class ConflictoException extends RuntimeException {
    public ConflictoException(String message) {
        super(message);
    }
}