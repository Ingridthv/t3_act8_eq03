import { useOutletContext, useParams } from 'react-router-dom';
import { Award, CheckSquare, AlertTriangle } from 'lucide-react';
import SelectorGrupo from './SelectorGrupo.jsx';
import useAlumnosGrupo from './useAlumnosGrupo.js';
import {
  nombreCompleto,
  iniciales,
  promedio,
  formato,
  aNumero,
  APROBATORIA,
  RIESGO
} from './utilsDocente.js';
import './DocenteGruposPage.css';
import './DocenteExtras.css';

export default function DocenteReportesPage() {
  const { grupoId } = useParams();
  const { grupos } = useOutletContext();

  if (!grupoId) {
    return (
      <SelectorGrupo
        grupos={grupos}
        destino="/docente/reportes"
        titulo="Elige un grupo para ver su reporte"
      />
    );
  }

  return <Reporte grupoId={grupoId} grupos={grupos} />;
}

function Reporte({ grupoId, grupos }) {
  const { alumnos, cargando, error } = useAlumnosGrupo(grupoId);
  const grupo = grupos.find((g) => String(g.grupo_id) === grupoId);

  // promedio de cada alumno
  const conPromedio = alumnos.map((a) => ({ ...a, prom: promedio(a.parcial, a.final) }));
  const calificados = conPromedio.filter((a) => a.prom !== null);

  const promedioGrupo = calificados.length
    ? calificados.reduce((s, a) => s + a.prom, 0) / calificados.length
    : null;

  const aprobados = conPromedio.filter(
    (a) => aNumero(a.final) !== null && a.prom >= APROBATORIA
  ).length;

  // alumnos con promedio menor a 7.0
  const enRiesgo = calificados
    .filter((a) => a.prom < RIESGO)
    .sort((a, b) => a.prom - b.prom);

  return (
    <div className="dc-reporte">
      <h2 className="dc-reporte__titulo">
        {grupo
          ? `${grupo.materia} · Grupo ${String(grupo.nombre_grupo).trim()} · ${grupo.periodo}`
          : 'Reporte del grupo'}
      </h2>

      {error && <p className="dc-error">{error}</p>}

      <section className="stat-grid">
        <article className="stat-card">
          <div className="stat-card__icon"><Award size={22} /></div>
          <div className="stat-card__body">
            <span className="stat-card__label">Promedio del grupo</span>
            <strong className="stat-card__value">{formato(promedioGrupo)}</strong>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card__icon"><CheckSquare size={22} /></div>
          <div className="stat-card__body">
            <span className="stat-card__label">Aprobados</span>
            <strong className="stat-card__value">{aprobados} de {alumnos.length}</strong>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card__icon"><AlertTriangle size={22} /></div>
          <div className="stat-card__body">
            <span className="stat-card__label">Con promedio menor a 7.0</span>
            <strong className="stat-card__value">{enRiesgo.length}</strong>
          </div>
        </article>
      </section>

      <section className="dg-card">
        <h2 className="dg-title">Alumnos con promedio menor a 7.0</h2>

        <div className="dg-table-wrap">
          <table className="dg-table">
            <thead>
              <tr>
                <th>Matrícula</th>
                <th>Alumno</th>
                <th>Parcial</th>
                <th>Final</th>
                <th>Promedio</th>
                <th>Estatus</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan="6" className="dg-empty">Cargando reporte...</td></tr>
              ) : enRiesgo.length === 0 ? (
                <tr><td colSpan="6" className="dg-empty">Ningún alumno con promedio menor a 7.0.</td></tr>
              ) : (
                enRiesgo.map((a) => (
                  <tr key={a.carga_id}>
                    <td>{a.matricula}</td>
                    <td>
                      <div className="dc-alumno">
                        <span className="dc-avatar">{iniciales(a)}</span>
                        {nombreCompleto(a)}
                      </div>
                    </td>
                    <td>{formato(aNumero(a.parcial))}</td>
                    <td>{formato(aNumero(a.final))}</td>
                    <td className="dc-negrita">{formato(a.prom)}</td>
                    <td>
                      <span className={'dg-badge ' + (a.prom < APROBATORIA ? 'dg-badge--rojo' : 'dg-badge--pend')}>
                        {a.prom < APROBATORIA ? 'Reprobado' : 'En riesgo'}
                      </span>
                    </td>
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
