
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  docentePerfilRequest,
  docenteGruposRequest
} from '../services/api.js';

export default function DocenteHomePage() {
  const { user, logout } = useAuth();

  // guardo la información del docente y sus grupos
  const [perfil, setPerfil] = useState(null);
  const [grupos, setGrupos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // cargo los datos del docente cuando entra a su módulo
  useEffect(() => {
    async function cargarDatos() {
      try {
        // hago las dos consultas para obtener el perfil y los grupos
        const [datosPerfil, datosGrupos] = await Promise.all([
          docentePerfilRequest(user.token),
          docenteGruposRequest(user.token)
        ]);

        setPerfil(datosPerfil);
        setGrupos(datosGrupos);
      } catch (err) {
        // guardo el mensaje si ocurre algún error
        setError(err.message || 'No se pudo cargar la información.');
      } finally {
        setCargando(false);
      }
    }

    cargarDatos();
  }, [user.token]);

  // muestro un mensaje mientras se cargan los datos
  if (cargando) {
    return (
      <main className="app-shell__main">
        <div className="state">
          <div className="spinner"></div>
          <p>Cargando información del docente...</p>
        </div>
      </main>
    );
  }

  // muestro el error si no se pudo obtener la información
  if (error) {
    return (
      <main className="app-shell__main">
        <div className="page">
          <div className="alert alert--error">
            <p className="alert__text">{error}</p>
          </div>
          <button className="btn btn--primary" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </main>
    );
  }

  // calculo el cupo total de todos los grupos asignados
  const totalCupo = grupos.reduce(
    (total, grupo) => total + (Number(grupo.cupo) || 0),
    0
  );

  return (
    <main className="app-shell__main">
      <div className="page">

        {/* encabezado de bienvenida */}
        <div>
          <p className="navbar__role">PANEL DE DOCENTE</p>
          <h1 className="page__title">
            ¡Bienvenido, {perfil?.nombre}!
          </h1>
          <p style={{ color: 'var(--gris)', marginTop: 6 }}>
            Aquí puedes consultar tu información y los grupos que tienes asignados.
          </p>
        </div>

        {/* tarjetas con el resumen de los grupos y materias */}
        <section className="stat-grid">
          <article className="stat-card">
            <div className="stat-card__icon">📚</div>
            <div className="stat-card__body">
              <span className="stat-card__label">Mis grupos</span>
              <strong className="stat-card__value">{grupos.length}</strong>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-card__icon">🎓</div>
            <div className="stat-card__body">
              <span className="stat-card__label">Materias asignadas</span>
              <strong className="stat-card__value">
                {new Set(grupos.map(g => g.clave_materia)).size}
              </strong>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-card__icon">👥</div>
            <div className="stat-card__body">
              <span className="stat-card__label">Cupo total</span>
              <strong className="stat-card__value">{totalCupo}</strong>
            </div>
          </article>
        </section>

        {/* información personal del docente */}
        <section className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">Mi información</h2>
              <p style={{ color: 'var(--gris)' }}>
                Datos de tu cuenta docente
              </p>
            </div>
            <span className="tag tag--rol">Docente</span>
          </div>

          <div className="settings-grid">
            <div className="profile">
              <div className="logo-mark" style={{ width: 56, height: 56, fontSize: 22 }}>
                {perfil?.nombre?.charAt(0)}
              </div>
              <div>
                <p className="profile__name">
                  {perfil?.nombre} {perfil?.apellidos}
                </p>
                <p style={{ color: 'var(--gris)' }}>{perfil?.correo}</p>
              </div>
            </div>

            <div>
              <p><strong>Clave docente:</strong> {perfil?.clave}</p>
              <p style={{ marginTop: 10 }}>
                <strong>Teléfono:</strong> {perfil?.telefono || 'No registrado'}
              </p>
              <p style={{ marginTop: 10 }}>
                <strong>Estado:</strong>{' '}
                <span className="tag tag--activo">
                  {perfil?.estatus || 'Activo'}
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* tabla donde se muestran los grupos asignados al docente */}
        <section className="card">
          <div className="card__header">
            <div>
              <h2 className="card__title">Mis grupos asignados</h2>
              <p style={{ color: 'var(--gris)' }}>
                Consulta las materias y horarios que tienes asignados.
              </p>
            </div>
            <span className="tag tag--neutro">
              {grupos.length} grupos
            </span>
          </div>

          <div className="table-wrap">
            <table className="data-table" style={{ minWidth: 850 }}>
              <thead>
                <tr>
                  <th>Materia</th>
                  <th>Clave</th>
                  <th>Grupo</th>
                  <th>Horario</th>
                  <th>Periodo</th>
                  <th>Cupo</th>
                </tr>
              </thead>

              <tbody>
                {grupos.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="data-table__empty">
                      No tienes grupos asignados actualmente.
                    </td>
                  </tr>
                ) : (
                  grupos.map((grupo) => (
                    <tr key={grupo.grupo_id}>
                      <td className="data-table__strong">
                        {grupo.materia}
                      </td>
                      <td>{grupo.clave_materia}</td>
                      <td>{grupo.nombre_grupo}</td>
                      <td>{grupo.horario}</td>
                      <td>{grupo.periodo}</td>
                      <td>{grupo.cupo}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* botón para salir de la cuenta */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn--secondary" onClick={logout}>
            Cerrar sesión
          </button>
        </div>

      </div>
    </main>
  );
}
