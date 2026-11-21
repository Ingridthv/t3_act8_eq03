package mx.edu.controlalumnos.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import mx.edu.controlalumnos.dto.CambiarPasswordRequest;
import mx.edu.controlalumnos.dto.RestablecerRequest;
import mx.edu.controlalumnos.exception.CredencialesInvalidasException;
import mx.edu.controlalumnos.exception.SolicitudInvalidaException;
import mx.edu.controlalumnos.model.Usuario;
import mx.edu.controlalumnos.repository.UsuarioRepository;
import mx.edu.controlalumnos.security.AuthUser;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PasswordService {

    private static final int MINUTOS_VIGENCIA = 30;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UsuarioRepository usuarios;
    private final PasswordEncoder encoder;
    private final JdbcTemplate jdbc;
    private final MailService mail;
    private final NotificacionService notificaciones;
    private final String urlFrontend;

    public PasswordService(UsuarioRepository usuarios, PasswordEncoder encoder, JdbcTemplate jdbc,
                           MailService mail, NotificacionService notificaciones,
                           @Value("${app.frontend-url:http://localhost:5173}") String urlFrontend) {
        this.usuarios = usuarios;
        this.encoder = encoder;
        this.jdbc = jdbc;
        this.mail = mail;
        this.notificaciones = notificaciones;
        this.urlFrontend = urlFrontend;
    }

    /** Cambio estando con sesión: exige la contraseña actual. */
    @Transactional
    public void cambiar(AuthUser actual, CambiarPasswordRequest datos) {
        Usuario usuario = usuarios.findById(actual.id()).orElseThrow(CredencialesInvalidasException::new);
        if (!encoder.matches(datos.actual(), usuario.getPasswordHash())) {
            throw new SolicitudInvalidaException("La contraseña actual no es correcta.");
        }
        if (encoder.matches(datos.nueva(), usuario.getPasswordHash())) {
            throw new SolicitudInvalidaException("La nueva contraseña debe ser diferente a la actual.");
        }
        usuario.setPasswordHash(encoder.encode(datos.nueva()));
        usuario.setDebeCambiarPassword(false);
        notificaciones.avisoCambioPassword(usuario);
    }

    /** Recuperación: siempre responde igual para no revelar si el correo existe. */
    @Transactional
    public void solicitarRecuperacion(String correo) {
        usuarios.findByCorreoIgnoreCase(correo.trim()).filter(Usuario::isActivo).ifPresent(u -> {
            byte[] bytes = new byte[32];
            RANDOM.nextBytes(bytes);
            String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

            // Un solo enlace vigente por usuario
            jdbc.update("UPDATE tokens_recuperacion SET usado = true WHERE usuario_id = ? AND usado = false", u.getId());
            jdbc.update("INSERT INTO tokens_recuperacion (usuario_id, token_hash, expira_en) VALUES (?, ?, ?)",
                    u.getId(), hash(token), java.sql.Timestamp.from(Instant.now().plusSeconds(MINUTOS_VIGENCIA * 60L)));

            String enlace = urlFrontend + "/#/restablecer?token=" + token;
            mail.enviar(u.correoDeEnvio(), "Recuperación de contraseña - Control Alumnos",
                    "Hola,\n\nRecibimos una solicitud para restablecer tu contraseña.\n"
                            + "Abre este enlace (vence en " + MINUTOS_VIGENCIA + " minutos):\n\n" + enlace
                            + "\n\nSi no fuiste tú, ignora este mensaje: tu contraseña no cambiará.");
        });
    }

    @Transactional
    public void restablecer(RestablecerRequest datos) {
        List<java.util.Map<String, Object>> filas = jdbc.queryForList(
                "SELECT id, usuario_id FROM tokens_recuperacion WHERE token_hash = ? AND usado = false AND expira_en > now()",
                hash(datos.token()));
        if (filas.isEmpty()) {
            throw new SolicitudInvalidaException("El enlace de recuperación no es válido o ya venció. Solicita uno nuevo.");
        }
        Usuario usuario = usuarios.findById((java.util.UUID) filas.get(0).get("usuario_id"))
                .orElseThrow(() -> new SolicitudInvalidaException("El enlace de recuperación no es válido."));
        usuario.setPasswordHash(encoder.encode(datos.nueva()));
        usuario.setDebeCambiarPassword(false);
        jdbc.update("UPDATE tokens_recuperacion SET usado = true WHERE id = ?", filas.get(0).get("id"));
        notificaciones.avisoCambioPassword(usuario);
    }

    // En la BD solo se guarda el hash del token, nunca el token en claro
    private static String hash(String token) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
