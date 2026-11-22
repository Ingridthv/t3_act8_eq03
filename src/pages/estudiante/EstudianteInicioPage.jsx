import { Award, BookOpen, CalendarDays } from 'lucide-react';
import EstatusTag from '../../components/estudiante/EstatusTag.jsx';
import SimpleTable from '../../components/estudiante/SimpleTable.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import LoadingState from '../../components/ui/LoadingState.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import { useServerList } from '../../hooks/useServerList.js';
import { getResumen } from '../../services/estudianteApi.js';

const COLUMNAS = [
  { key: 'materia', label: 'Materia', width: '28%' },
  { key: 'docente', label: 'Docente', width: '22%' },
  { key: 'grupo', label: 'Grupo', width: '8%' },
  { key: 'horario', label: 'Horario', width: '26%' },
  { key: 'estatus', label: 'Estatus', width: '16%', render: (r) => <EstatusTag value={r.estatus} /> },
];

const PARAMS = {};

export default function EstudianteInicioPage() {
  const { data, loading, error, reload } = useServerList(getResumen, PARAMS);

  if (loading && !data) return <LoadingState message="Cargando tu resumen..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const promedio = data.promedio == null ? '—' : Number(data.promedio).toFixed(1);

  return (
    <div className="page">
      <h2 className="page__title">
        Hola, {data.nombre}{data.periodoActual ? ` · Periodo ${data.periodoActual}` : ''}
      </h2>

      <section className="stat-grid" aria-label="Resumen académico">
        <StatCard icon={Award} label="Promedio general" value={promedio} />
        <StatCard icon={BookOpen} label="Materias en curso" value={data.materiasEnCurso} />
        <StatCard icon={CalendarDays} label="Semestre actual" value={`${data.semestreActual}°`} />
      </section>

      <section className="card">
        <h3 className="card__title">Mis materias del periodo</h3>
        <SimpleTable
          columns={COLUMNAS}
          rows={data.materias}
          empty="No tienes materias inscritas en el periodo actual."
        />
      </section>
    </div>
  );
}
