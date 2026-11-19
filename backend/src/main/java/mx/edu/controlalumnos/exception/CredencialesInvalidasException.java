package mx.edu.controlalumnos.exception;

/** Correo o contraseña incorrectos (mismo mensaje en ambos casos, para no revelar qué correos existen). */
public class CredencialesInvalidasException extends RuntimeException {
    public CredencialesInvalidasException() {
        super("Correo o contraseña incorrectos.");
    }
}
