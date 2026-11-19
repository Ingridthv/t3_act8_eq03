package mx.edu.controlalumnos.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import mx.edu.controlalumnos.dto.ApiError;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

/** 401 (sin token / token inválido) y 403 (rol sin permiso) también en JSON. */
@Component
public class JsonSecurityHandlers implements AuthenticationEntryPoint, AccessDeniedHandler {

    private final ObjectMapper mapper;

    public JsonSecurityHandlers(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public void commence(HttpServletRequest req, HttpServletResponse res, AuthenticationException ex)
            throws IOException {
        escribir(res, HttpStatus.UNAUTHORIZED, "Necesitas iniciar sesión o tu sesión expiró.", req);
    }

    @Override
    public void handle(HttpServletRequest req, HttpServletResponse res, AccessDeniedException ex)
            throws IOException {
        escribir(res, HttpStatus.FORBIDDEN, "No tienes permiso para realizar esta acción.", req);
    }

    private void escribir(HttpServletResponse res, HttpStatus estado, String mensaje, HttpServletRequest req)
            throws IOException {
        res.setStatus(estado.value());
        res.setContentType(MediaType.APPLICATION_JSON_VALUE);
        res.setCharacterEncoding("UTF-8");
        mapper.writeValue(res.getOutputStream(),
                ApiError.of(estado.value(), estado.getReasonPhrase(), mensaje, req.getRequestURI()));
    }
}
