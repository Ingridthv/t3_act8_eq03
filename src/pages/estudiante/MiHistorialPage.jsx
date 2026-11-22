import EstatusTag from '../../components/estudiante/EstatusTag.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import LoadingState from '../../components/ui/LoadingState.jsx';
import { useServerList } from '../../hooks/useServerList.js';
import { getPerfil, listHistorial } from '../../services/estudianteApi.js';
import { initials } from '../../utils/academico.js';
import CalificacionesLista from './CalificacionesLista.jsx';

const PARAMS = {};

export default function MiHistorialPage() {
  const { data: perfil, loading, error, reload } = useServerList(getPerfil, PARAMS);

  if (loading && !perfil) return <LoadingState message="Cargando tu historial..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="page">
      <section className="card">
        <h2 className="card__title">Mi historial académico</h2>

        <div className="summary-bar">
          <span className="avatar avatar--md avatar--initials" aria-hidden="true">{initials(perfil.nombreCompleto)}</span>
          <div className="summary-bar__name">
            <p className="profile__name">{perfil.nombreCompleto}</p>
            <p className="navbar__role">Matrícula {perfil.matricula}</p>
          </div>
          <dl className="summary-bar__item"><dt>Carrera</dt><dd>{perfil.carrera}</dd></dl>
          <dl className="summary-bar__item"><dt>Semestre</dt><dd>{perfil.semestreActual}°</dd></dl>
          <dl className="summary-bar__item">
            <dt>Promedio general</dt>
            <dd>{perfil.promedio == null ? '—' : Number(perfil.promedio).toFixed(1)}</dd>
          </dl>
          <dl className="summary-bar__item"><dt>Estatus</dt><dd><EstatusTag value={perfil.estatus} /></dd></dl>
        </div>

        <CalificacionesLista
          titulo=""
          fetcher={listHistorial}
          noun="registros"
          vacio="No se encontraron registros. Cambia la búsqueda o limpia los filtros."
        />
      </section>
    </div>
  );
}
