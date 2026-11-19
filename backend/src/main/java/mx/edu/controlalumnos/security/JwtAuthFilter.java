package mx.edu.controlalumnos.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import mx.edu.controlalumnos.repository.TokenInvalidadoRepository;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** Lee "Authorization: Bearer ...", valida el JWT y revisa que no haya cerrado sesión. */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final TokenInvalidadoRepository tokensInvalidados;

    public JwtAuthFilter(JwtService jwtService, TokenInvalidadoRepository tokensInvalidados) {
        this.jwtService = jwtService;
        this.tokensInvalidados = tokensInvalidados;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String encabezado = request.getHeader("Authorization");
        if (encabezado != null && encabezado.startsWith("Bearer ")) {
            try {
                Claims claims = jwtService.leer(encabezado.substring(7));
                if (!tokensInvalidados.existsById(claims.getId())) {
                    String rol = claims.get("rol", String.class);
                    AuthUser usuario = new AuthUser(
                            UUID.fromString(claims.getSubject()),
                            claims.get("correo", String.class),
                            rol,
                            claims.getId(),
                            claims.getExpiration().toInstant());
                    var autenticacion = new UsernamePasswordAuthenticationToken(
                            usuario, null, List.of(new SimpleGrantedAuthority("ROLE_" + rol.toUpperCase())));
                    SecurityContextHolder.getContext().setAuthentication(autenticacion);
                }
            } catch (JwtException | IllegalArgumentException ex) {
                // Token alterado o vencido: la petición sigue sin autenticar y responderá 401.
                SecurityContextHolder.clearContext();
            }
        }
        chain.doFilter(request, response);
    }
}
