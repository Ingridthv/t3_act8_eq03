package mx.edu.controlalumnos.service;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import mx.edu.controlalumnos.model.Usuario;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/** Avisos de seguridad por SMS y WhatsApp, disparados por acciones reales del sistema. */
@Service
public class NotificacionService {

    private static final Logger log = LoggerFactory.getLogger(NotificacionService.class);

    private final TwilioService twilio;
    private final JdbcTemplate jdbc;

    public NotificacionService(TwilioService twilio, JdbcTemplate jdbc) {
        this.twilio = twilio;
        this.jdbc = jdbc;
    }

    /** Se manda solo si la transacción que cambió la contraseña se confirmó, y sin frenar la respuesta. */
    public void avisoCambioPassword(Usuario usuario) {
        String telefono = telefonoDe(usuario);
        if (telefono == null) {
            log.info("Sin teléfono para avisar al usuario {}", usuario.getId());
            return;
        }
        String texto = "Control Alumnos: tu contraseña fue modificada. "
                + "Si no fuiste tú, avisa de inmediato al administrador.";
        Runnable envio = () -> CompletableFuture.runAsync(() -> {
            twilio.enviarSms(telefono, texto);
            twilio.enviarWhatsApp(telefono, texto);
        });
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    envio.run();
                }
            });
        } else {
            envio.run();
        }
    }

    private String telefonoDe(Usuario u) {
        if (u.getTelefonoContacto() != null && !u.getTelefonoContacto().isBlank()) {
            return u.getTelefonoContacto();
        }
        String sql = u.getDocenteId() != null ? "SELECT telefono FROM docentes WHERE id = ?"
                : u.getAlumnoId() != null ? "SELECT telefono FROM alumnos WHERE id = ?" : null;
        if (sql == null) {
            return null;
        }
        List<String> filas = jdbc.queryForList(sql, String.class,
                u.getDocenteId() != null ? u.getDocenteId() : u.getAlumnoId());
        return filas.isEmpty() || filas.get(0) == null || filas.get(0).isBlank() ? null : filas.get(0);
    }
}
