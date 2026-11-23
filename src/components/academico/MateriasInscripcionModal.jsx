import { useCallback, useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import Alert from '../ui/Alert.jsx';
import LoadingState from '../ui/LoadingState.jsx';
import Modal from '../ui/Modal.jsx';
import { SelectField } from '../ui/TextField.jsx';
import * as adminApi from '../../services/adminApi.js';

// El administrador asigna (o quita) las materias de una inscripción, eligiendo el grupo de cada una.
export default function MateriasInscripcionModal({ row, onClose }) {
  const [materias, setMaterias] = useState(null);
  const [disponibles, setDisponibles] = useState([]);
  const [grupoId, setGrupoId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const [m, d] = await Promise.all([adminApi.materiasDeInscripcion(row.id), adminApi.gruposDisponibles(row.id)]);
      setMaterias(m);
      setDisponibles(d);
      setGrupoId('');
    } catch (e) {
      setError(e.message);
    }
  }, [row.id]);

  useEffect(() => { cargar(); }, [cargar]);

  const ejecutar = async (accion) => {
    setBusy(true);
    setError('');
    try {
      await accion();
      await cargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Materias del alumno" subtitle={`${row.alumno} · ${row.periodo}`} onClose={onClose} closeDisabled={busy} width={720}>
      {error && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}
      {!materias ? (
        <LoadingState message="Cargando materias..." />
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Clave</th><th>Materia</th><th>Grupo</th><th>Docente</th><th>Horario</th><th>Acción</th></tr>
              </thead>
              <tbody>
                {materias.length === 0 ? (
                  <tr><td className="data-table__empty" colSpan={6}>Aún no tiene materias asignadas.</td></tr>
                ) : materias.map((m) => (
                  <tr key={m.id}>
                    <td>{m.clave}</td>
                    <td>{m.materia}</td>
                    <td>{m.grupo}</td>
                    <td>{m.docente}</td>
                    <td>{m.horario ?? '—'}</td>
                    <td>
                      <button type="button" className="icon-button icon-button--danger" disabled={busy}
                        aria-label={`Quitar ${m.materia}`} onClick={() => ejecutar(() => adminApi.quitarMateria(row.id, m.id))}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="form" style={{ marginTop: 20 }}>
            <SelectField label="Agregar materia (grupo)" value={grupoId} onChange={(e) => setGrupoId(e.target.value)} disabled={busy}>
              <option value="">{disponibles.length ? 'Selecciona la materia y el grupo' : 'No hay más grupos disponibles en este periodo'}</option>
              {disponibles.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </SelectField>
            <div className="form__actions">
              <button type="button" className="btn btn--secondary" onClick={onClose} disabled={busy}>Cerrar</button>
              <button type="button" className="btn btn--primary" disabled={busy || !grupoId}
                onClick={() => ejecutar(() => adminApi.asignarMateria(row.id, grupoId))}>
                {busy ? 'Guardando...' : 'Asignar materia'}
              </button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
