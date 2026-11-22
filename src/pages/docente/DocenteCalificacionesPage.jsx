import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  docenteAlumnosGrupoRequest,
  docenteGuardarCalificacionRequest
} from '../../services/api.js';

// escala de calificación (cámbiala si usan 0-10)
const ESCALA_MAX = 100;

export default function DocenteCalificacionesPage() {
  const { user } = useAuth();
  const { grupos } = useOutletContext();

  const [grupoId, setGrupoId] = useState('');
  const [alumnos, setAlumnos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(null);

  // cuando elijo un grupo, cargo sus alumnos
  useEffect(() => {
    if (!grupoId) {
      setAlumnos([]);
      return;
    }

    async function cargarAlumnos() {
      setCargando(true);
      setError('');
      setMensaje('');
      try {
        const datos = await docenteAlumnosGrupoRequest(user.token, grupoId);
        // dejo la calificación como texto para poder editarla en el input
        setAlumnos(
          datos.map((a) => ({ ...a, nota: a.calificacion ?? '' }))
        );
      } catch (err) {
        setAlumnos([]);
        setError(err.message || 'No se pudieron cargar los alumnos.');
      } finally {
        setCargando(false);
      }
    }

    cargarAlumnos();
  }, [grupoId, user.token]);

  // actualizo la nota escrita en el input
  function cambiarNota(inscripcionId, valor) {
    setAlumnos((lista) =>
      lista.map((a) =>
        a.inscripcion_id === inscripcionId ? { ...a, nota: valor } : a
      )
    );
  }

  // guardo la calificación de un alumno
  async function guardar(alumno) {
    const valor = Number(alumno.nota);

    if (alumno.nota === '' || Number.isNaN(valor) || valor < 0 || valor > ESCALA_MAX) {
      setError(`La calificación debe estar entre 0 y ${ESCALA_MAX}.`);
      setMensaje('');
      return;
    }

    setGuardando(alumno.inscripcion_id);
    setError('');
    setMensaje('');
    try {
      await docenteGuardarCalificacionRequest(user.token, alumno.inscripcion_id, valor);
      setAlumnos((lista) =>
        lista.map((a) =>
          a.inscripcion_id === alumno.inscripcion_id ? { ...a, calificacion: valor } : a
        )
      );
      setMensaje(`Calificación de ${alumno.nombre} guardada.`);
    } catch (err) {
      setError(err.message || 'No se pudo guardar la calificación.');
    } finally {
      setGuardando(null);
    }
  }

  const pendientes = alumnos.filter(
    (a) => a.calificacion === null || a.calificacion === undefined
  ).length;

  return (
    <div className="page">
      <section className="card">
        <div className="card__header">
          <div>
            <h2 className="card__title">Calificaciones</h2>
            <p style={{ color: 'var(--gris)' }}>
              Selecciona un grupo para capturar o consultar calificaciones.
            </p>
          </div>

          <select
            value={grupoId}
            onChange={(e) => setGrupoId(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }}
          >
            <option value="">Elige un grupo…</option>
            {grupos.map((g) => (
              <option key={g.grupo_id} value={g.grupo_id}>
                {g.materia} · Grupo {g.nombre_grupo} · {g.periodo}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="alert alert--error">
            <p className="alert__text">{error}</p>
          </div>
        )}
        {mensaje && <p style={{ color: '#15803d', marginBottom: 12 }}>{mensaje}</p>}

        {!grupoId ? (
          <p style={{ color: 'var(--gris)' }}>Aún no has elegido un grupo.</p>
        ) : cargando ? (
          <div className="state">
            <div className="spinner"></div>
            <p>Cargando alumnos...</p>
          </div>
        ) : (
          <>
            <p style={{ marginBottom: 12 }}>
              <span className="tag tag--neutro">{alumnos.length} alumnos</span>{' '}
              <span className="tag tag--neutro">{pendientes} sin calificar</span>
            </p>

            <div className="table-wrap">
              <table className="data-table" style={{ minWidth: 700 }}>
                <thead>
                  <tr>
                    <th>Matrícula</th>
                    <th>Alumno</th>
                    <th>Calificación</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {alumnos.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="data-table__empty">
                        Este grupo no tiene alumnos inscritos.
                      </td>
                    </tr>
                  ) : (
                    alumnos.map((a) => (
                      <tr key={a.inscripcion_id}>
                        <td>{a.matricula}</td>
                        <td className="data-table__strong">
                          {a.nombre} {a.apellidos}
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max={ESCALA_MAX}
                            value={a.nota}
                            onChange={(e) => cambiarNota(a.inscripcion_id, e.target.value)}
                            style={{
                              width: 90,
                              padding: '6px 10px',
                              borderRadius: 8,
                              border: '1px solid #e5e7eb'
                            }}
                          />
                        </td>
                        <td>
                          <button
                            className="btn btn--primary"
                            disabled={guardando === a.inscripcion_id}
                            onClick={() => guardar(a)}
                          >
                            {guardando === a.inscripcion_id ? 'Guardando…' : 'Guardar'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}