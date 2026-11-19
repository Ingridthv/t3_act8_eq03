package mx.edu.controlalumnos.exception;

public class CuentaInactivaException extends RuntimeException {
    public CuentaInactivaException() {
        super("Tu cuenta está desactivada. Contacta al administrador.");
    }
}
