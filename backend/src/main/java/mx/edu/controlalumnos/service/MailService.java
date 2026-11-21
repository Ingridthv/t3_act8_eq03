package mx.edu.controlalumnos.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/** Envío de correos con JavaMailSender (en el VPS sale por Postfix en localhost:25). */
@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final ObjectProvider<JavaMailSender> sender;
    private final String remitente;

    public MailService(ObjectProvider<JavaMailSender> sender,
                       @Value("${app.mail.from:no-reply@localhost}") String remitente) {
        this.sender = sender;
        this.remitente = remitente;
    }

    public void enviar(String para, String asunto, String texto) {
        JavaMailSender mail = sender.getIfAvailable();
        if (mail == null) {
            // Sin spring.mail.host (desarrollo local): se muestra en consola para poder probar.
            log.warn("Correo NO enviado (spring.mail.host sin configurar). Para: {} | {}\n{}", para, asunto, texto);
            return;
        }
        try {
            SimpleMailMessage m = new SimpleMailMessage();
            m.setFrom(remitente);
            m.setTo(para);
            m.setSubject(asunto);
            m.setText(texto);
            mail.send(m);
        } catch (Exception e) {
            log.error("No se pudo enviar el correo a {}: {}", para, e.getMessage());
        }
    }
}
