import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, ChevronDown, TrendingUp, Users } from 'lucide-react';
import ErrorState from '../components/ui/ErrorState.jsx';
import LoadingState from '../components/ui/LoadingState.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import { useListParams, useServerList } from '../hooks/useServerList.js';
import { options as loadOptions, reporte } from '../services/adminApi.js';

const TIPOS = [
  { id: 'todos', label: 'Todos los estudiantes' },
  { id: 'actuales', label: 'Solo inscritos actuales' },
];

// Barras horizontales: la más grande va en ámbar.
function HBars({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="hbars" aria-label="Alumnos por carrera">
      {rows.map((r, i) => (
        <li key={r.label} className="hbars__row">
          <span className="hbars__label">{r.label}</span>
          <span className="hbars__track">
            <span className={`hbars__bar${i === 0 ? ' hbars__bar--top' : ''}`} style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="hbars__value">{r.value}</span>
        </li>
      ))}
    </ul>
  );
}

// Barras verticales: la de mayor promedio va en ámbar.
function VBars({ rows }) {
  const values = rows.map((r) => r.value ?? 0);
  const max = Math.max(1, ...values);
  const topIndex = values.indexOf(Math.max(...values));
  return (
    <ul className="vbars" aria-label="Promedio por semestre">
      {rows.map((r, i) => (
        <li key={r.label} className="vbars__col">
          <span className="vbars__value">{r.value === null ? '—' : r.value.toFixed(1)}</span>
          <span className="vbars__track">
            <span className={`vbars__bar${r.value !== null && i === topIndex ? ' vbars__bar--top' : ''}`} style={{ height: `${((r.value ?? 0) / max) * 100}%` }} />
          </span>
          <span className="vbars__label">{r.label}</span>
        </li>
      ))}
    </ul>
  );
}

export default function ReportesPage() {
  const [periodos, setPeriodos] = useState([]);
  useEffect(() => {
    loadOptions('periodos').then(setPeriodos).catch(() => {});
  }, []);
  const [params, setParams] = useListParams(['tipo', 'periodo'], { tipo: 'todos' });
  const tipo = params.tipo === 'actuales' ? 'actuales' : 'todos';

  const fetcher = useCallback((p) => reporte(p), []);
  const { data, loading, error, reload } = useServerList(fetcher, { tipo, periodo: params.periodo });

  return (
    <div className="page">
      <h2 className="page__title">Reportes académicos</h2>

      <div className="report-controls">
        <span className="report-controls__label">Mostrar:</span>
        <div className="segmented" role="tablist" aria-label="Tipo de reporte">
          {TIPOS.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tipo === t.id}
              className={`segmented__item${tipo === t.id ? ' segmented__item--active' : ''}`}
              onClick={() => setParams({ tipo: t.id })}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="field__control report-controls__select">
          <select className={`field__input field__select${params.periodo ? '' : ' field__select--empty'}`}
            aria-label="Filtrar por periodo" value={params.periodo} onChange={(e) => setParams({ periodo: e.target.value })}>
            <option value="">Periodo</option>
            {periodos.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <ChevronDown size={20} className="field__icon field__icon--end" aria-hidden="true" />
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data && <LoadingState message="Generando reporte..." />}

      {data && !error && (
        <div style={{ opacity: loading ? 0.5 : 1 }} aria-busy={loading} className="page">
          <section className="stat-grid" aria-label="Resumen del reporte">
            <StatCard icon={TrendingUp} label="Promedio general" value={data.promedio === null ? '—' : data.promedio.toFixed(1)} />
            <StatCard icon={CheckCircle2} label="Tasa de aprobación" value={data.tasa === null ? '—' : `${Math.round(data.tasa * 100)}%`} />
            <StatCard icon={Users} label="Total de inscritos" value={data.total} />
          </section>

          <div className="chart-grid">
            <section className="card">
              <h3 className="card__title chart-title">Alumnos por carrera</h3>
              {data.total === 0 ? <p className="state__text">No hay alumnos con esos filtros.</p> : <HBars rows={data.porCarrera} />}
            </section>
            <section className="card">
              <h3 className="card__title chart-title">Promedio por semestre</h3>
              {data.promedio === null ? <p className="state__text">Aún no hay calificaciones finales con esos filtros.</p> : <VBars rows={data.porSemestre} />}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
