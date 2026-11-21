package mx.edu.controlalumnos.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

// entidad que representa la tabla carreras de postgresql
@Entity
@Table(name = "carreras")
public class Carrera {

    // la base genera el id sola (identity)
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Short id;

    @Column(nullable = false, length = 10, unique = true)
    private String clave;

    @Column(nullable = false, unique = true)
    private String nombre;

    @Column(name = "duracion_semestres", nullable = false)
    private Short duracionSemestres = 9;

    // id del docente que coordina la carrera (puede ser null)
    @Column(name = "coordinador_id")
    private UUID coordinadorId;

    @Column(nullable = false)
    private boolean activa = true;

    public Short getId() { return id; }
    public String getClave() { return clave; }
    public void setClave(String clave) { this.clave = clave; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public Short getDuracionSemestres() { return duracionSemestres; }
    public void setDuracionSemestres(Short duracionSemestres) { this.duracionSemestres = duracionSemestres; }
    public UUID getCoordinadorId() { return coordinadorId; }
    public void setCoordinadorId(UUID coordinadorId) { this.coordinadorId = coordinadorId; }
    public boolean isActiva() { return activa; }
    public void setActiva(boolean activa) { this.activa = activa; }
}