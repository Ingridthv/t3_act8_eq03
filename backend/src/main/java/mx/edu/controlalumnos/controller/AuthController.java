package mx.edu.controlalumnos.controller;

import jakarta.validation.Valid;
import mx.edu.controlalumnos.dto.CambiarPasswordRequest;
import mx.edu.controlalumnos.dto.LoginRequest;
import mx.edu.controlalumnos.dto.RecuperarRequest;
import mx.edu.controlalumnos.dto.RestablecerRequest;
import mx.edu.controlalumnos.dto.SesionResponse;
import mx.edu.controlalumnos.security.AuthUser;
import mx.edu.controlalumnos.service.AuthService;
import mx.edu.controlalumnos.service.PasswordService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final PasswordService passwordService;

    public AuthController(AuthService authService, PasswordService passwordService) {
        this.authService = authService;
        this.passwordService = passwordService;
    }

    @PostMapping("/login")
    public SesionResponse login(@Valid @RequestBody LoginRequest datos) {
        return authService.login(datos);
    }

    @GetMapping("/me")
    public SesionResponse me(@AuthenticationPrincipal AuthUser usuario) {
        return authService.perfil(usuario);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@AuthenticationPrincipal AuthUser usuario) {
        authService.logout(usuario);
    }

    @PostMapping("/cambiar-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cambiarPassword(@AuthenticationPrincipal AuthUser usuario,
                                @Valid @RequestBody CambiarPasswordRequest datos) {
        passwordService.cambiar(usuario, datos);
    }

    @PostMapping("/recuperar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void recuperar(@Valid @RequestBody RecuperarRequest datos) {
        passwordService.solicitarRecuperacion(datos.correo());
    }

    @PostMapping("/restablecer")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void restablecer(@Valid @RequestBody RestablecerRequest datos) {
        passwordService.restablecer(datos);
    }
}
