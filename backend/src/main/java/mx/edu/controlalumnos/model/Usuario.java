package mx.edu.controlalumnos.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "correo", nullable = false)
    private String correo;

    // BCrypt: la contraseña nunca se guarda en claro
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "rol_id")
    private Rol rol;

    // Buzón real donde llegan los avisos; si está vacío se usa el correo institucional
    @Column(name = "correo_contacto")
    private String correoContacto;

    // Celular real donde llegan los avisos SMS / WhatsApp; si está vacío se usa el del alumno o docente
    @Column(name = "telefono_contacto")
    private String telefonoContacto;

    @Column(name = "alumno_id")
    private UUID alumnoId;

    @Column(name = "docente_id")
    private UUID docenteId;

    @Column(name = "activo", nullable = false)
    private boolean activo;

    @Column(name = "debe_cambiar_password", nullable = false)
    private boolean debeCambiarPassword;

    @Column(name = "ultimo_acceso")
    private Instant ultimoAcceso;

    @Column(name = "creado_en", insertable = false, updatable = false)
    private Instant creadoEn;

    protected Usuario() {
    }

    public UUID getId() {
        return id;
    }

    public String getCorreo() {
        return correo;
    }

    public String getCorreoContacto() {
        return correoContacto;
    }

    public String getTelefonoContacto() {
        return telefonoContacto;
    }

    /** Dirección a la que se envían los correos de la cuenta. */
    public String correoDeEnvio() {
        return correoContacto != null && !correoContacto.isBlank() ? correoContacto : correo;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public Rol getRol() {
        return rol;
    }

    public UUID getAlumnoId() {
        return alumnoId;
    }

    public UUID getDocenteId() {
        return docenteId;
    }

    public boolean isActivo() {
        return activo;
    }

    public boolean isDebeCambiarPassword() {
        return debeCambiarPassword;
    }

    public Instant getUltimoAcceso() {
        return ultimoAcceso;
    }

    public void setUltimoAcceso(Instant ultimoAcceso) {
        this.ultimoAcceso = ultimoAcceso;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public void setDebeCambiarPassword(boolean debeCambiarPassword) {
        this.debeCambiarPassword = debeCambiarPassword;
    }
}
