package mx.edu.controlalumnos.service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpRequest.BodyPublishers;
import java.net.http.HttpResponse;
import java.net.http.HttpResponse.BodyHandlers;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/** Envío de SMS y WhatsApp con la API REST de Twilio. Si no hay credenciales, solo escribe en el log. */
@Service
public class TwilioService {

    private static final Logger log = LoggerFactory.getLogger(TwilioService.class);

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    private final String accountSid;
    private final String authToken;
    private final String smsFrom;
    private final String whatsappFrom;

    public TwilioService(@Value("${app.twilio.account-sid:}") String accountSid,
                         @Value("${app.twilio.auth-token:}") String authToken,
                         @Value("${app.twilio.sms-from:}") String smsFrom,
                         @Value("${app.twilio.whatsapp-from:}") String whatsappFrom) {
        this.accountSid = accountSid;
        this.authToken = authToken;
        this.smsFrom = smsFrom;
        this.whatsappFrom = whatsappFrom;
    }

    public void enviarSms(String para, String texto) {
        enviar(para, smsFrom, texto, "SMS");
    }

    public void enviarWhatsApp(String para, String texto) {
        enviar("whatsapp:" + para, whatsappFrom, texto, "WhatsApp");
    }

    private void enviar(String para, String de, String texto, String canal) {
        if (accountSid.isBlank() || authToken.isBlank() || de.isBlank()) {
            log.warn("{} NO enviado (Twilio sin configurar). A {}: {}", canal, ocultar(para), texto);
            return;
        }
        try {
            String formulario = "To=" + codificar(para) + "&From=" + codificar(de) + "&Body=" + codificar(texto);
            String credenciales = Base64.getEncoder()
                    .encodeToString((accountSid + ":" + authToken).getBytes(StandardCharsets.UTF_8));
            HttpRequest peticion = HttpRequest
                    .newBuilder(URI.create("https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json"))
                    .timeout(Duration.ofSeconds(10))
                    .header("Authorization", "Basic " + credenciales)
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(BodyPublishers.ofString(formulario))
                    .build();
            HttpResponse<String> respuesta = http.send(peticion, BodyHandlers.ofString());
            if (respuesta.statusCode() >= 300) {
                log.error("Twilio rechazó el {} a {}: HTTP {} {}", canal, ocultar(para), respuesta.statusCode(),
                        respuesta.body());
            } else {
                log.info("Twilio: {} enviado a {}", canal, ocultar(para));
            }
        } catch (Exception e) {
            log.error("No se pudo enviar el {} a {}: {}", canal, ocultar(para), e.getMessage());
        }
    }

    private static String codificar(String valor) {
        return URLEncoder.encode(valor, StandardCharsets.UTF_8);
    }

    // En los logs solo se ven los últimos 4 dígitos del teléfono
    private static String ocultar(String telefono) {
        return telefono.length() <= 4 ? "****" : "****" + telefono.substring(telefono.length() - 4);
    }
}
