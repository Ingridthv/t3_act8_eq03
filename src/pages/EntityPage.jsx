import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, Pencil, Trash2 } from 'lucide-react';
import EntityForm from '../components/academico/EntityForm.jsx';
import InscripcionForm from '../components/academico/InscripcionForm.jsx';
import MateriasInscripcionModal from '../components/academico/MateriasInscripcionModal.jsx';
import Alert from '../components/ui/Alert.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import ListFilters from '../components/ui/ListFilters.jsx';
import LoadingState from '../components/ui/LoadingState.jsx';
import Modal from '../components/ui/Modal.jsx';
import Pagination from '../components/users/Pagination.jsx';
import { useListParams, useServerList } from '../hooks/useServerList.js';
import { create, getOptions, list, remove, update } from '../services/academicApi.js';
import { initials, PAGE_SIZE } from '../utils/academico.js';
import { defaultToForm, defaultToPayload, ENTITIES, formatCell, tagTone } from '../utils/entities.js';

function Cell({ col, row }) {
  const text = formatCell(col, row);
  if (col.tag) return <span className={`tag tag--${tagTone(text)}`}>{text}</span>;
  if (col.avatar) {
    return (
      <div className="data-table__person">
        <Avatar initials={initials(text)} size="sm" />
        <span className="data-table__name">{text}</span>
      </div>
    );
  }
  return text;
}

// Pantalla de catálogo genérica: tabla + búsqueda + filtros + paginación en servidor
// + modales de alta/edición/eliminación. Cada catálogo solo aporta su configuración.
export default function EntityPage({ entity }) {
  const cfg = ENTITIES[entity];
  // todo viene de la base de datos: ya no se necesita la lista de alumnos de DummyJSON
  const ctx = useMemo(() => ({}), []);

  const filterNames = cfg.filters.map((f) => f.name);
  const [params, setParams] = useListParams(['q', ...filterNames], cfg.defaults);
  const fetcher = useCallback((p) => list(entity, ctx, p), [entity, ctx]);
  const { data, loading, error, reload } = useServerList(fetcher, params);

  // Opciones de selects que vienen del servidor (docentes, materias, alumnos, periodos).
  const [options, setOptions] = useState({});
  const [optionsTick, setOptionsTick] = useState(0);
  useEffect(() => {
    const kinds = new Set([...cfg.filters, ...cfg.fields].map((f) => f.options).filter((o) => typeof o === 'string'));
    Promise.all([...kinds].map(async (k) => [k, await getOptions(k, ctx)])).then((pairs) => setOptions(Object.fromEntries(pairs)));
  }, [cfg, ctx, optionsTick]);

  const [formModal, setFormModal] = useState(null); // { mode, row }
  const [toDelete, setToDelete] = useState(null);
  const [materiasRow, setMateriasRow] = useState(null); // inscripción cuyas materias se están asignando
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  const closeModals = () => {
    setFormModal(null);
    setToDelete(null);
    setActionError('');
  };

  const run = async (action, successText) => {
    setBusy(true);
    setActionError('');
    try {
      await action();
      closeModals();
      setNotice({ type: 'success', text: successText });
      setOptionsTick((t) => t + 1);
      reload();
    } catch (err) {
      setActionError(err.message || 'No se pudo completar la acción.');
    } finally {
      setBusy(false);
    }
  };

  // Inscribir alumno: si es nuevo, el servidor lo da de alta (matrícula y cuenta) y lo inscribe en un solo paso.
  const handleInscripcion = (v) =>
    run(
      () => create('inscripciones', ctx, v),
      v.modo === 'nuevo'
        ? 'Alumno inscrito. Se enviaron sus credenciales a su correo de contacto.'
        : 'Alumno inscrito correctamente.'
    );

  const handleSubmit = (values) => {
    const payload = cfg.toPayload ? cfg.toPayload(values) : defaultToPayload(cfg, values);
    return formModal.mode === 'create'
      ? run(() => create(entity, ctx, payload), cfg.createdMessage ?? 'Registro agregado correctamente.')
      : run(() => update(entity, ctx, formModal.row.id, payload), 'Cambios guardados correctamente.');
  };

  const resolved = (f) => (typeof f.options === 'string' ? (options[f.options] ?? []) : f.options);
  const selects = cfg.filters.map((f) => ({
    name: f.name, label: f.label, wide: f.wide, value: params[f.name], options: resolved(f), defaultValue: cfg.defaults?.[f.name] ?? '',
  }));
  const clearAll = () => setParams({ q: '', ...Object.fromEntries(filterNames.map((n) => [n, cfg.defaults?.[n] ?? ''])) });

  // Ancho de columnas: las que llevan nombre/correo reciben más espacio.
  const weights = [...cfg.columns.map((c) => (c.avatar ? 2.4 : ['carrera', 'correo', 'docente', 'coordinador', 'materia'].includes(c.key) ? 1.7 : c.tag || c.format === 'periodo' ? 1.35 : c.strong ? 1.7 : 1)), 1];
  const total = weights.reduce((a, b) => a + b, 0);
  const widths = weights.map((w) => +((w / total) * 100).toFixed(2));

  const items = data?.items ?? [];
  const [title, subtitle] = formModal?.mode === 'edit' ? cfg.editTitle : cfg.createTitle;

  return (
    <div className="page">
      {notice && <Alert type={notice.type} onClose={() => setNotice(null)}>{notice.text}</Alert>}

      <section className="card">
        <header className="card__header">
          <h2 className="card__title">{cfg.title}</h2>
          <button type="button" className="btn btn--primary" onClick={() => { setActionError(''); setFormModal({ mode: 'create' }); }}>
            {cfg.newLabel}
          </button>
        </header>

        <ListFilters
          search={params.q}
          placeholder={cfg.searchPlaceholder}
          selects={selects}
          onSearch={(v) => setParams({ q: v })}
          onSelect={(name, v) => setParams({ [name]: v })}
          onClear={clearAll}
        />

        {loading && !data && <LoadingState message={`Cargando ${cfg.noun}...`} />}
        {error && <ErrorState message={error} onRetry={reload} />}

        {data && !error && (
          <div style={{ opacity: loading ? 0.5 : 1 }} aria-busy={loading}>
            <div className="table-wrap">
              <table className="data-table" style={{ minWidth: 1000 }}>
                <colgroup>
                  {widths.map((w, i) => <col key={i} style={{ width: `${w}%` }} />)}
                </colgroup>
                <thead>
                  <tr>
                    {cfg.columns.map((c) => <th key={c.key} scope="col">{c.label}</th>)}
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td className="data-table__empty" colSpan={cfg.columns.length + 1}>No se encontraron {cfg.noun}. Cambia la búsqueda o limpia los filtros.</td></tr>
                  ) : (
                    items.map((row) => (
                      <tr key={row.id}>
                        {cfg.columns.map((c) => (
                          <td key={c.key} className={c.strong && !c.avatar ? 'data-table__strong' : undefined}><Cell col={c} row={row} /></td>
                        ))}
                        <td>
                          <div className="data-table__actions">
                            {entity === 'inscripciones' && (
                              <button type="button" className="icon-button" aria-label={`Materias de ${cfg.rowLabel(row)}`} title="Asignar materias"
                                onClick={() => setMateriasRow(row)}>
                                <BookOpen size={16} />
                              </button>
                            )}
                            <button type="button" className="icon-button" aria-label={`Editar ${cfg.rowLabel(row)}`}
                              onClick={() => { setActionError(''); setFormModal({ mode: 'edit', row }); }}>
                              <Pencil size={16} />
                            </button>
                            <button type="button" className="icon-button icon-button--danger" aria-label={`Eliminar ${cfg.rowLabel(row)}`}
                              onClick={() => { setActionError(''); setToDelete(row); }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={data.page} totalPages={data.totalPages} totalItems={data.total} limit={PAGE_SIZE}
              noun={cfg.noun} onPageChange={(p) => setParams({ page: p })} />
          </div>
        )}
      </section>

      {materiasRow && (
        <MateriasInscripcionModal row={materiasRow} onClose={() => { setMateriasRow(null); reload(); }} />
      )}

      {formModal && (
        <Modal title={title} subtitle={subtitle} onClose={closeModals} closeDisabled={busy}>
          {entity === 'inscripciones' && formModal.mode === 'create' ? (
            <InscripcionForm options={options} submitting={busy} serverError={actionError}
              onSubmit={handleInscripcion} onCancel={closeModals} />
          ) : (
          <EntityForm
            key={`${formModal.mode}-${formModal.row?.id ?? 'new'}`}
            fields={cfg.fields}
            mode={formModal.mode}
            initialValues={formModal.mode === 'edit' ? (cfg.toForm ?? ((r) => defaultToForm(cfg, r)))(formModal.row) : defaultToForm(cfg, {})}
            options={options}
            note={cfg.createNote}
            submitLabel={formModal.mode === 'create' ? cfg.saveLabel : 'Guardar cambios'}
            submitting={busy}
            serverError={actionError}
            onSubmit={handleSubmit}
            onCancel={closeModals}
          />
          )}
        </Modal>
      )}

      {toDelete && (
        <ConfirmDialog
          tone="danger"
          title={`¿Eliminar ${cfg.singular}?`}
          message={`Se eliminará "${cfg.rowLabel(toDelete)}" del sistema. Esta acción no se puede deshacer.`}
          confirmLabel="Sí, eliminar"
          loading={busy}
          error={actionError}
          onConfirm={() => run(() => remove(entity, ctx, toDelete.id), 'Registro eliminado correctamente.')}
          onCancel={closeModals}
        />
      )}
    </div>
  );
}
