package mx.edu.controlalumnos.exception;

import jakarta.servlet.http.HttpServletRequest;
import java.util.LinkedHashMap;
import java.util.Map;
import mx.edu.controlalumnos.dto.ApiError;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/** @ControllerAdvice: todos los errores salen como JSON con el mismo formato. */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> validacion(MethodArgumentNotValidException ex, HttpServletRequest req) {
        Map<String, String> errores = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(e -> errores.putIfAbsent(e.getField(), e.getDefaultMessage()));
        return responder(HttpStatus.BAD_REQUEST, "Hay datos que corregir.", req, errores);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> cuerpoInvalido(HttpMessageNotReadableException ex, HttpServletRequest req) {
        return responder(HttpStatus.BAD_REQUEST, "El cuerpo de la petición no es un JSON válido.", req, null);
    }

    @ExceptionHandler({CredencialesInvalidasException.class, AuthenticationException.class})
    public ResponseEntity<ApiError> noAutenticado(RuntimeException ex, HttpServletRequest req) {
        String mensaje = ex instanceof CredencialesInvalidasException
                ? ex.getMessage() : "Necesitas iniciar sesión.";
        return responder(HttpStatus.UNAUTHORIZED, mensaje, req, null);
    }

    @ExceptionHandler({CuentaInactivaException.class, AccessDeniedException.class})
    public ResponseEntity<ApiError> prohibido(RuntimeException ex, HttpServletRequest req) {
        String mensaje = ex instanceof CuentaInactivaException
                ? ex.getMessage() : "No tienes permiso para realizar esta acción.";
        return responder(HttpStatus.FORBIDDEN, mensaje, req, null);
    }

    @ExceptionHandler(SolicitudInvalidaException.class)
    public ResponseEntity<ApiError> solicitudInvalida(SolicitudInvalidaException ex, HttpServletRequest req) {
        return responder(HttpStatus.BAD_REQUEST, ex.getMessage(), req, null);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiError> noEncontrado(NoResourceFoundException ex, HttpServletRequest req) {
        return responder(HttpStatus.NOT_FOUND, "El recurso solicitado no existe.", req, null);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiError> metodoNoPermitido(HttpRequestMethodNotSupportedException ex, HttpServletRequest req) {
        return responder(HttpStatus.METHOD_NOT_ALLOWED, "Método no permitido para esta ruta.", req, null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> inesperado(Exception ex, HttpServletRequest req) {
        log.error("Error inesperado en {}", req.getRequestURI(), ex);
        return responder(HttpStatus.INTERNAL_SERVER_ERROR, "Ocurrió un error en el servidor. Inténtalo más tarde.", req, null);
    }

    private ResponseEntity<ApiError> responder(HttpStatus estado, String mensaje, HttpServletRequest req,
                                               Map<String, String> errores) {
        ApiError cuerpo = ApiError.of(estado.value(), estado.getReasonPhrase(), mensaje, req.getRequestURI(), errores);
        return ResponseEntity.status(estado).body(cuerpo);
    }
}
