import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, UserCheck, Users } from 'lucide-react';
import ErrorState from '../components/ui/ErrorState.jsx';
import LoadingState from '../components/ui/LoadingState.jsx';
import UsersTable from '../components/users/UsersTable.jsx';
import { useUsers } from '../context/UsersContext.jsx';

const RECENT_COUNT = 5;

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
  const { users, loading, error, reload } = useUsers();
  const navigate = useNavigate();

  // Editar y eliminar se hacen en la pantalla Alumnos, que ya trae los diálogos de confirmación.
  const goToAction = (action, user) => navigate(`/alumnos?${action}=${user.id}`);

  const stats = useMemo(() => {
    const totalAverage = users.reduce((sum, user) => sum + Number(user.average), 0);
    return {
      total: users.length,
      active: users.filter((user) => user.status === 'Activo').length,
      average: users.length ? (totalAverage / users.length).toFixed(1) : '0',
    };
  }, [users]);

  if (loading) return <LoadingState message="Cargando resumen..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="page">
      <h2 className="page__title">Resumen general</h2>

      <section className="stat-grid" aria-label="Estadísticas">
        <StatCard icon={Users} label="Total de alumnos" value={stats.total} />
        <StatCard icon={UserCheck} label="Alumnos activos" value={stats.active} />
        <StatCard icon={TrendingUp} label="Promedio general" value={stats.average} />
      </section>

      <section className="card">
        <h3 className="card__title">Alumnos recientes</h3>
        <UsersTable
          users={users.slice(0, RECENT_COUNT)}
          onEdit={(user) => goToAction('edit', user)}
          onDelete={(user) => goToAction('delete', user)}
        />
      </section>
    </div>
  );
}
