import { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { Award, CheckSquare, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { docenteReporteRequest } from '../../services/api.js';
import Paginacion from './Paginacion.jsx';
import SelectorGrupo, { CambiarGrupo } from './SelectorGrupo.jsx';
import { nombreCompleto, iniciales, formato, aNumero } from './utilsDocente.js';
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
  const { user } = useAuth();
  const grupo = grupos.find((g) => String(g.grupo_id) === grupoId);

  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // las cifras y la lista de alumnos en riesgo las calcula el servidor
  useEffect(() => {
    let vigente = true;
    async function cargar() {
      setCargando(true);
      setError('');
      try {
        const res = await docenteReporteRequest(user.token, grupoId, { page: pagina, size: porPagina });
        if (vigente) setDatos(res);
      } catch (err) {
        if (vigente) {
          setDatos(null);
          setError(err.message || 'No se pudo cargar el reporte.');
        }
      } finally {
        if (vigente) setCargando(false);
      }
    }
    cargar();
    return () => { vigente = false; };
  }, [user.token, grupoId, pagina, porPagina]);

  const enRiesgo = datos?.alumnos?.items || [];
  const totalRiesgo = datos?.alumnos?.total ?? 0;

  return (
    <div className="dc-reporte">
      <div className="dc-reporte__cabecera">
        <h2 className="dc-reporte__titulo">
          {grupo
            ? `${grupo.materia} · Grupo ${String(grupo.nombre_grupo).trim()} · ${grupo.periodo}`
            : 'Reporte del grupo'}
        </h2>
        <CambiarGrupo grupos={grupos} grupoId={grupoId} destino="/docente/reportes" />
      </div>

      {error && <p className="dc-error">{error}</p>}

      <section className="stat-grid">
        <article className="stat-card">
          <div className="stat-card__icon"><Award size={22} /></div>
          <div className="stat-card__body">
            <span className="stat-card__label">Promedio del grupo</span>
            <strong className="stat-card__value">{formato(aNumero(datos?.promedio_grupo))}</strong>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card__icon"><CheckSquare size={22} /></div>
          <div className="stat-card__body">
            <span className="stat-card__label">Aprobados</span>
            <strong className="stat-card__value">{datos ? `${datos.aprobados} de ${datos.total_alumnos}` : '—'}</strong>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card__icon"><AlertTriangle size={22} /></div>
          <div className="stat-card__body">
            <span className="stat-card__label">Con promedio menor a 7.0</span>
            <strong className="stat-card__value">{totalRiesgo}</strong>
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
                    <td className="dc-negrita">{formato(aNumero(a.promedio))}</td>
                    <td>
                      <span className={'dg-badge ' + (a.estatus_riesgo === 'Reprobado' ? 'dg-badge--rojo' : 'dg-badge--pend')}>
                        {a.estatus_riesgo}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Paginacion
          total={totalRiesgo}
          pagina={pagina}
          porPagina={porPagina}
          onPagina={setPagina}
          onPorPagina={(n) => { setPorPagina(n); setPagina(1); }}
        />
      </section>
    </div>
  );
}
