package mx.edu.controlalumnos.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "roles")
public class Rol {

    @Id
    private Short id;

    @Column(name = "nombre", nullable = false)
    private String nombre;

    protected Rol() {
    }

    public Short getId() {
        return id;
    }

    public String getNombre() {
        return nombre;
    }
}
