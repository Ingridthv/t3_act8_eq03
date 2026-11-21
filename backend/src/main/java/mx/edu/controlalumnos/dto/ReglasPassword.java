package mx.edu.controlalumnos.dto;

/** Regla única de contraseña: 8+ caracteres, 1 mayúscula, 1 número y 1 carácter especial. */
public final class ReglasPassword {
    public static final String PATRON = "^(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$";
    public static final String MENSAJE =
            "La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial.";

    private ReglasPassword() {
    }
}
