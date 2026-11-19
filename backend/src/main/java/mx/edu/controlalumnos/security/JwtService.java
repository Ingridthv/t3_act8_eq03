package mx.edu.controlalumnos.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import mx.edu.controlalumnos.model.Usuario;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final SecretKey clave;
    private final long minutos;

    public JwtService(@Value("${app.jwt.secret}") String secreto,
                      @Value("${app.jwt.expiration-minutes}") long minutos) {
        byte[] bytes = secreto.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("app.jwt.secret debe tener al menos 32 caracteres.");
        }
        this.clave = Keys.hmacShaKeyFor(bytes);
        this.minutos = minutos;
    }

    public Instant calcularExpiracion() {
        return Instant.now().plus(minutos, ChronoUnit.MINUTES);
    }

    /** Genera un token con identificador único (jti) para poder invalidarlo en el logout. */
    public String generar(Usuario usuario, Instant expira) {
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(usuario.getId().toString())
                .claim("correo", usuario.getCorreo())
                .claim("rol", usuario.getRol().getNombre())
                .issuedAt(new Date())
                .expiration(Date.from(expira))
                .signWith(clave)
                .compact();
    }

    /** Lanza JwtException si el token está alterado o vencido. */
    public Claims leer(String token) {
        return Jwts.parser().verifyWith(clave).build().parseSignedClaims(token).getPayload();
    }
}
