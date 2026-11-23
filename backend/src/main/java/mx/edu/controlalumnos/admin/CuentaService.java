package mx.edu.controlalumnos.admin;

import java.security.SecureRandom;
import java.util.UUID;
import mx.edu.controlalumnos.exception.ConflictoException;
import mx.edu.controlalumnos.service.MailService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/** Crea la cuenta de acceso de un alumno o docente y le envía por correo su usuario y contraseña temporal. */
@Service
public class CuentaService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String MAYUS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final String MINUS = "abcdefghijkmnpqrstuvwxyz";
    private static final String NUMS = "23456789";
    private static final String ESPECIALES = "#$%&*+-?";

    private final JdbcTemplate jdbc;
    private final PasswordEncoder encoder;
    private final MailService mail;
    private final String urlFrontend;

    public CuentaService(JdbcTemplate jdbc, PasswordEncoder encoder, MailService mail,
                         @Value("${app.frontend-url:http://localhost:5173}") String urlFrontend) {
        this.jdbc = jdbc;
        this.encoder = encoder;
        this.mail = mail;
        this.urlFrontend = urlFrontend;
    }

    /** Contraseña temporal que cumple la regla (8+, mayúscula, número y carácter especial). */
    static String passwordTemporal() {
        String todos = MAYUS + MINUS + NUMS + ESPECIALES;
        StringBuilder sb = new StringBuilder();
        sb.append(MAYUS.charAt(RANDOM.nextInt(MAYUS.length())));
        sb.append(NUMS.charAt(RANDOM.nextInt(NUMS.length())));
        sb.append(ESPECIALES.charAt(RANDOM.nextInt(ESPECIALES.length())));
        while (sb.length() < 12) {
            sb.append(todos.charAt(RANDOM.nextInt(todos.length())));
        }
        return sb.toString();
    }

    public boolean correoEnUso(String correo, UUID ignorarUsuarioDe) {
        Integer n = jdbc.queryForObject(
                "SELECT COUNT(*) FROM usuarios WHERE lower(correo) = lower(?) AND COALESCE(alumno_id, docente_id) IS DISTINCT FROM ?",
                Integer.class, correo, ignorarUsuarioDe);
        return n != null && n > 0;
    }

    /** Crea el usuario (rol: administrador, docente o estudiante) y manda las credenciales al correo de contacto. */
    public void crear(String rol, String correo, String correoContacto, String telefonoContacto,
                      UUID alumnoId, UUID docenteId, String nombre) {
        if (correoEnUso(correo, null)) {
            throw new ConflictoException("Ya existe un usuario con el correo " + correo + ".");
        }
        String temporal = passwordTemporal();

        jdbc.update("""
            INSERT INTO usuarios (correo, password_hash, rol_id, alumno_id, docente_id, activo,
                                  debe_cambiar_password, correo_contacto, telefono_contacto)
            VALUES (?, ?, (SELECT id FROM roles WHERE nombre = ?), ?, ?, true, true, ?, ?)
            """, correo, encoder.encode(temporal), rol, alumnoId, docenteId,
                blanco(correoContacto), blanco(telefonoContacto));

        String destino = blanco(correoContacto) != null ? correoContacto.trim() : correo;
        String texto = "Hola " + nombre + ",\n\n"
                + "Se creó tu cuenta en Control Alumnos.\n\n"
                + "Usuario: " + correo + "\n"
                + "Contraseña temporal: " + temporal + "\n\n"
                + "Entra en " + urlFrontend + " y cámbiala en tu primer inicio de sesión.";

        Runnable enviar = () -> mail.enviar(destino, "Tus credenciales de acceso - Control Alumnos", texto);
        // el correo sale solo si la transacción se guardó
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    enviar.run();
                }
            });
        } else {
            enviar.run();
        }
    }

    static String blanco(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
