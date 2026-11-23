import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, UserCheck, Users } from 'lucide-react';
import ErrorState from '../components/ui/ErrorState.jsx';
import LoadingState from '../components/ui/LoadingState.jsx';
import UsersTable from '../components/users/UsersTable.jsx';
import { useServerList } from '../hooks/useServerList.js';
import { resumen } from '../services/adminApi.js';
import { aFila } from '../services/alumnosApi.js';

function StatCard({ icon: Icon, label, value }) {
  return (
    <article className="stat-card">
      <span className="stat-card__icon">
        <Icon size={24} aria-hidden="true" />
      </span>
      <div className="stat-card__body">
        <p className="stat-card__label">{label}</p>
        <p className="stat-card__value">{value}</p>
      </div>
    </article>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();

  // totales, promedio y alumnos recientes: todo lo calcula la base de datos
  const fetcher = useCallback(() => resumen(), []);
  const { data, loading, error, reload } = useServerList(fetcher, {});

  // Editar y eliminar se hacen en la pantalla Alumnos, que ya trae los diálogos de confirmación.
  const goToAction = (action, user) => navigate(`/alumnos?${action}=${user.id}`);

  if (loading && !data) return <LoadingState message="Cargando resumen..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const recientes = (data?.recientes ?? []).map(aFila);

  return (
    <div className="page">
      <h2 className="page__title">Resumen general</h2>

      <section className="stat-grid" aria-label="Estadísticas">
        <StatCard icon={Users} label="Total de alumnos" value={data.total} />
        <StatCard icon={UserCheck} label="Alumnos activos" value={data.activos} />
        <StatCard icon={TrendingUp} label="Promedio general" value={data.promedio == null ? '—' : Number(data.promedio).toFixed(1)} />
      </section>

      <section className="card">
        <h3 className="card__title">Alumnos recientes</h3>
        <UsersTable
          users={recientes}
          onEdit={(user) => goToAction('edit', user)}
          onDelete={(user) => goToAction('delete', user)}
        />
      </section>
    </div>
  );
}
