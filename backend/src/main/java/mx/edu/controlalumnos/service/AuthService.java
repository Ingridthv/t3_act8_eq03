package mx.edu.controlalumnos.service;

import java.time.Instant;
import mx.edu.controlalumnos.dto.LoginRequest;
import mx.edu.controlalumnos.dto.SesionResponse;
import mx.edu.controlalumnos.exception.CredencialesInvalidasException;
import mx.edu.controlalumnos.exception.CuentaInactivaException;
import mx.edu.controlalumnos.model.TokenInvalidado;
import mx.edu.controlalumnos.model.Usuario;
import mx.edu.controlalumnos.repository.TokenInvalidadoRepository;
import mx.edu.controlalumnos.repository.UsuarioRepository;
import mx.edu.controlalumnos.security.AuthUser;
import mx.edu.controlalumnos.security.JwtService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UsuarioRepository usuarios;
    private final TokenInvalidadoRepository tokensInvalidados;
    private final PasswordEncoder encoder;
    private final JwtService jwtService;
    private final JdbcTemplate jdbc;

    public AuthService(UsuarioRepository usuarios, TokenInvalidadoRepository tokensInvalidados,
                       PasswordEncoder encoder, JwtService jwtService, JdbcTemplate jdbc) {
        this.usuarios = usuarios;
        this.tokensInvalidados = tokensInvalidados;
        this.encoder = encoder;
        this.jwtService = jwtService;
        this.jdbc = jdbc;
    }

    @Transactional
    public SesionResponse login(LoginRequest datos) {
        Usuario usuario = usuarios.findByCorreoIgnoreCase(datos.correo().trim())
                .orElseThrow(CredencialesInvalidasException::new);

        if (!encoder.matches(datos.password(), usuario.getPasswordHash())) {
            throw new CredencialesInvalidasException();
        }
        if (!usuario.isActivo()) {
            throw new CuentaInactivaException();
        }

        usuario.setUltimoAcceso(Instant.now());
        Instant expira = jwtService.calcularExpiracion();
        String token = jwtService.generar(usuario, expira);
        return construirSesion(usuario, token, expira);
    }

    @Transactional(readOnly = true)
    public SesionResponse perfil(AuthUser actual) {
        Usuario usuario = usuarios.findById(actual.id()).orElseThrow(CredencialesInvalidasException::new);
        return construirSesion(usuario, null, actual.expiraEn());
    }

    /** Logout: el jti del token queda en tokens_invalidados y deja de funcionar. */
    @Transactional
    public void logout(AuthUser actual) {
        if (!tokensInvalidados.existsById(actual.jti())) {
            tokensInvalidados.save(new TokenInvalidado(actual.jti(), actual.id(), actual.expiraEn()));
        }
    }

    private SesionResponse construirSesion(Usuario u, String token, Instant expira) {
        return new SesionResponse(u.getId(), u.getCorreo(), nombreVisible(u), u.getRol().getNombre(),
                u.isDebeCambiarPassword(), token, expira);
    }

    private String nombreVisible(Usuario u) {
        if (u.getDocenteId() != null) {
            return jdbc.queryForObject(
                    "SELECT nombre || ' ' || apellidos FROM docentes WHERE id = ?", String.class, u.getDocenteId());
        }
        if (u.getAlumnoId() != null) {
            return jdbc.queryForObject(
                    "SELECT nombre || ' ' || apellido_paterno FROM alumnos WHERE id = ?", String.class, u.getAlumnoId());
        }
        // administradores: el nombre se guarda en la propia cuenta
        String nombre = jdbc.queryForObject("SELECT nombre FROM usuarios WHERE id = ?", String.class, u.getId());
        return nombre != null && !nombre.isBlank() ? nombre : "Administrador";
    }
}
