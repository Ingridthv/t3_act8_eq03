package mx.edu.controlalumnos.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** Token JWT que ya cerró sesión (logout). Se guarda su identificador (jti). */
@Entity
@Table(name = "tokens_invalidados")
public class TokenInvalidado {

    @Id
    @Column(name = "jti", length = 64)
    private String jti;

    @Column(name = "usuario_id", nullable = false)
    private UUID usuarioId;

    @Column(name = "expira_en", nullable = false)
    private Instant expiraEn;

    @Column(name = "invalidado_en", nullable = false)
    private Instant invalidadoEn;

    protected TokenInvalidado() {
    }

    public TokenInvalidado(String jti, UUID usuarioId, Instant expiraEn) {
        this.jti = jti;
        this.usuarioId = usuarioId;
        this.expiraEn = expiraEn;
        this.invalidadoEn = Instant.now();
    }

    public String getJti() {
        return jti;
    }
}
