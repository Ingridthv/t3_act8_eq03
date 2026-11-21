package mx.edu.controlalumnos.exception;

/** Petición válida en forma pero no aceptable (400): contraseña actual incorrecta, enlace vencido, etc. */
public class SolicitudInvalidaException extends RuntimeException {
    public SolicitudInvalidaException(String mensaje) {
        super(mensaje);
    }
}
