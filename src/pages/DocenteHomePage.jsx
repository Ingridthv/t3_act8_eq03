import { useOutletContext } from 'react-router-dom';
import { Users, User, Clock } from 'lucide-react';

// periodo que muestra el diseño de Figma (luego puedes calcularlo)
const PERIODO_ACTUAL = 'Agosto-Diciembre 2021';

export default function DocenteHomePage() {
  // perfil y grupos los carga DocenteLayout
  const { perfil, grupos } = useOutletContext();

  const gruposPeriodo = grupos.filter((g) => g.periodo === PERIODO_ACTUAL);

  // si la API no trae "alumnos", uso el cupo
  const totalAlumnos = gruposPeriodo.reduce(
    (total, g) => total + (Number(g.alumnos ?? g.cupo) || 0),
    0
  );

  // calificaciones pendientes (la API manda "pendientes" por grupo)
  const pendientes = gruposPeriodo.reduce(
    (total, g) => total + (Number(g.pendientes) || 0),
    0
  );

  return (
    <div className="page">
      <h1 className="page__title">
        Hola, {perfil?.nombre} · Periodo {PERIODO_ACTUAL}
      </h1>

      <section className="stat-grid">
        <article className="stat-card">
          <div className="stat-card__icon"><Users size={22} /></div>
          <div className="stat-card__body">
            <span className="stat-card__label">Grupos activos</span>
            <strong className="stat-card__value">{gruposPeriodo.length}</strong>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card__icon"><User size={22} /></div>
          <div className="stat-card__body">
            <span className="stat-card__label">Alumnos a cargo</span>
            <strong className="stat-card__value">{totalAlumnos}</strong>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card__icon"><Clock size={22} /></div>
          <div className="stat-card__body">
            <span className="stat-card__label">Calificaciones pendientes</span>
            <strong className="stat-card__value">{pendientes}</strong>
          </div>
        </article>
      </section>

      <section className="card">
        <h2 className="card__title">Mis grupos del periodo</h2>

        <div className="table-wrap">
          <table className="data-table" style={{ minWidth: 850 }}>
            <thead>
              <tr>
                <th>Materia</th>
                <th>Grupo</th>
                <th>Carrera</th>
                <th>Horario</th>
                <th>Alumnos</th>
              </tr>
            </thead>
            <tbody>
              {gruposPeriodo.length === 0 ? (
                <tr>
                  <td colSpan="5" className="data-table__empty">
                    No tienes grupos asignados en este periodo.
                  </td>
                </tr>
              ) : (
                gruposPeriodo.map((g) => (
                  <tr key={g.grupo_id}>
                    <td>{g.materia}</td>
                    <td>{g.nombre_grupo}</td>
                    <td>{g.carrera || '—'}</td>
                    <td>{g.horario}</td>
                    <td>{g.alumnos ?? g.cupo}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
