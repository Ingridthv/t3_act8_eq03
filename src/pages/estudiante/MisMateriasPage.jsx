import { useEffect, useState } from 'react';
import EstatusTag from '../../components/estudiante/EstatusTag.jsx';
import SimpleTable from '../../components/estudiante/SimpleTable.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import ListFilters from '../../components/ui/ListFilters.jsx';
import LoadingState from '../../components/ui/LoadingState.jsx';
import Pagination from '../../components/users/Pagination.jsx';
import { useListParams, useServerList } from '../../hooks/useServerList.js';
import { getPeriodos, listMaterias } from '../../services/estudianteApi.js';
import { PAGE_SIZE } from '../../utils/academico.js';

const COLUMNAS = [
  { key: 'materia', label: 'Materia', width: '24%' },
  { key: 'docente', label: 'Docente', width: '18%' },
  { key: 'grupo', label: 'Grupo', width: '8%' },
  { key: 'horario', label: 'Horario', width: '22%' },
  { key: 'creditos', label: 'Créditos', width: '10%' },
  { key: 'estatus', label: 'Estatus', width: '18%', render: (r) => <EstatusTag value={r.estatus} /> },
];

const ESTATUS = ['En curso', 'Aprobado', 'Reprobado', 'Pendiente'].map((e) => ({ value: e.toLowerCase(), label: e }));
const DEFAULTS = { periodo: 'actual' };

export default function MisMateriasPage() {
  const [params, setParams] = useListParams(['q', 'periodo', 'estatus'], DEFAULTS);
  const { data, loading, error, reload } = useServerList(listMaterias, params);

  const [periodos, setPeriodos] = useState([]);
  useEffect(() => {
    getPeriodos().then(setPeriodos).catch(() => setPeriodos([]));
  }, []);

  const actual = periodos.find((p) => p.actual);
  const opcionesPeriodo = [
    { value: 'actual', label: 'Periodo actual' },
    ...periodos.map((p) => ({ value: String(p.id), label: p.nombre })),
  ];
  const selects = [
    { name: 'periodo', label: 'Todos los periodos', value: params.periodo, options: opcionesPeriodo, defaultValue: 'actual' },
    { name: 'estatus', label: 'Estatus', value: params.estatus, options: ESTATUS, defaultValue: '' },
  ];
  const limpiar = () => setParams({ q: '', periodo: 'actual', estatus: '' });

  const titulo = params.periodo === 'actual' && actual ? `Materias del periodo ${actual.nombre}` : 'Mis materias';

  return (
    <div className="page">
      <section className="card">
        <h2 className="card__title">{titulo}</h2>

        <ListFilters
          search={params.q}
          placeholder="Buscar por materia"
          selects={selects}
          onSearch={(v) => setParams({ q: v })}
          onSelect={(name, v) => setParams({ [name]: v })}
          onClear={limpiar}
        />

        {loading && !data && <LoadingState message="Cargando tus materias..." />}
        {error && <ErrorState message={error} onRetry={reload} />}

        {data && !error && (
          <div style={{ opacity: loading ? 0.5 : 1 }} aria-busy={loading}>
            <SimpleTable
              columns={COLUMNAS}
              rows={data.items}
              empty="No se encontraron materias. Cambia la búsqueda o limpia los filtros."
            />
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              totalItems={data.total}
              limit={PAGE_SIZE}
              noun="materias"
              onPageChange={(p) => setParams({ page: p })}
            />
          </div>
        )}
      </section>
    </div>
  );
}
