import { useEffect, useState } from 'react';
import EstatusTag from '../../components/estudiante/EstatusTag.jsx';
import SimpleTable from '../../components/estudiante/SimpleTable.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import ListFilters from '../../components/ui/ListFilters.jsx';
import LoadingState from '../../components/ui/LoadingState.jsx';
import Pagination from '../../components/users/Pagination.jsx';
import { useListParams, useServerList } from '../../hooks/useServerList.js';
import { getPeriodos } from '../../services/estudianteApi.js';
import { PAGE_SIZE } from '../../utils/academico.js';

const nota = (v) => (v == null ? '—' : Number(v).toFixed(1));

const ESTATUS = ['Aprobado', 'Reprobado', 'Pendiente'].map((e) => ({ value: e.toLowerCase(), label: e }));

// Tabla con filtros y paginacion del servidor, compartida por "Mis calificaciones" y "Mi historial".
// fetcher: funcion estable (definida fuera del componente) que pide la pagina al backend.
export default function CalificacionesLista({ titulo, fetcher, conDocente, filtroEstatus, vacio, noun }) {
  const keys = filtroEstatus ? ['q', 'periodo', 'estatus'] : ['q', 'periodo'];
  const [params, setParams] = useListParams(keys);
  const { data, loading, error, reload } = useServerList(fetcher, params);

  const [periodos, setPeriodos] = useState([]);
  useEffect(() => {
    getPeriodos().then(setPeriodos).catch(() => setPeriodos([]));
  }, []);

  const columnas = [
    { key: 'periodo', label: 'Periodo', width: '13%' },
    { key: 'materia', label: 'Materia', width: conDocente ? '27%' : '38%' },
    ...(conDocente ? [{ key: 'docente', label: 'Docente', width: '22%' }] : []),
    { key: 'parcial', label: 'Parcial', width: '10%', render: (r) => nota(r.parcial) },
    { key: 'calificacionFinal', label: 'Final', width: '10%', render: (r) => <strong>{nota(r.calificacionFinal)}</strong> },
    { key: 'estatus', label: 'Estatus', width: '14%', render: (r) => <EstatusTag value={r.estatus} /> },
  ];

  const selects = [
    {
      name: 'periodo', label: 'Periodo', value: params.periodo, defaultValue: '',
      options: periodos.map((p) => ({ value: String(p.id), label: p.nombre })),
    },
    ...(filtroEstatus
      ? [{ name: 'estatus', label: 'Estatus', value: params.estatus, options: ESTATUS, defaultValue: '' }]
      : []),
  ];
  const limpiar = () => setParams({ q: '', periodo: '', estatus: '' });

  return (
    <>
      {titulo && <h2 className="card__title">{titulo}</h2>}
      <ListFilters
        search={params.q}
        placeholder="Buscar por materia"
        selects={selects}
        onSearch={(v) => setParams({ q: v })}
        onSelect={(name, v) => setParams({ [name]: v })}
        onClear={limpiar}
      />

      {loading && !data && <LoadingState message="Cargando calificaciones..." />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && !error && (
        <div style={{ opacity: loading ? 0.5 : 1 }} aria-busy={loading}>
          <SimpleTable columns={columnas} rows={data.items} empty={vacio} />
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            totalItems={data.total}
            limit={PAGE_SIZE}
            noun={noun}
            onPageChange={(p) => setParams({ page: p })}
          />
        </div>
      )}
    </>
  );
}
