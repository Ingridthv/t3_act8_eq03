import { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { docenteGuardarCalificacionRequest } from '../../services/api.js';
import Paginacion from './Paginacion.jsx';
import SelectorGrupo from './SelectorGrupo.jsx';
import useAlumnosGrupo from './useAlumnosGrupo.js';
import { nombreCompleto, iniciales, aNumero, estadoNota } from './utilsDocente.js';
import './DocenteGruposPage.css';
import './DocenteExtras.css';

const CLASE_ESTADO = {
  Aprobado: 'dg-badge--ok',
  Reprobado: 'dg-badge--rojo',
  Pendiente: 'dg-badge--gris'
};

export default function DocenteCalificacionesPage() {
  const { grupoId } = useParams();
  const { grupos } = useOutletContext();

  // sin grupo elegido: muestro la lista para escoger uno
  if (!grupoId) {
    return (
      <SelectorGrupo
        grupos={grupos}
        destino="/docente/calificaciones"
        titulo="Elige un grupo para capturar calificaciones"
      />
    );
  }

  return <Captura grupoId={grupoId} grupos={grupos} />;
}

function Captura({ grupoId, grupos }) {
  const { user } = useAuth();
  const { alumnos, cargando, error } = useAlumnosGrupo(grupoId);
  const grupo = grupos.find((g) => String(g.grupo_id) === grupoId);

  // copia editable de las calificaciones
  const [filas, setFilas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [estatus, setEstatus] = useState('');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [fallo, setFallo] = useState('');

  useEffect(() => {
    setFilas(
      alumnos.map((a) => ({
        ...a,
        parcial: a.parcial ?? '',
        final: a.final ?? '',
        origParcial: a.parcial ?? '',
        origFinal: a.final ?? ''
      }))
    );
  }, [alumnos]);

  function cambiar(cargaId, campo, valor) {
    setMensaje('');
    setFallo('');
    setFilas((lista) =>
      lista.map((f) => (f.carga_id === cargaId ? { ...f, [campo]: valor } : f))
    );
  }

  const texto = busqueda.trim().toLowerCase();
  const visibles = filas.filter((f) => {
    const coincide =
      nombreCompleto(f).toLowerCase().includes(texto) ||
      String(f.matricula).toLowerCase().includes(texto);
    const coincideEstatus = !estatus || estadoNota(f.parcial, f.final) === estatus;
    return coincide && coincideEstatus;
  });

  const paginaActual = Math.min(pagina, Math.max(1, Math.ceil(visibles.length / porPagina)));
  const pagina_filas = visibles.slice((paginaActual - 1) * porPagina, paginaActual * porPagina);

  function limpiar() {
    setBusqueda('');
    setEstatus('');
    setPagina(1);
  }

  // guardo solo las filas que cambiaron
  async function guardar() {
    setMensaje('');
    setFallo('');

    const cambiadas = filas.filter(
      (f) => String(f.parcial) !== String(f.origParcial) || String(f.final) !== String(f.origFinal)
    );

    if (cambiadas.length === 0) {
      setMensaje('No hay cambios por guardar.');
      return;
    }

    // las notas deben estar entre 0 y 10
    for (const f of cambiadas) {
      for (const campo of ['parcial', 'final']) {
        const n = aNumero(f[campo]);
        if (f[campo] !== '' && (n === null || n < 0 || n > 10)) {
          setFallo(`La calificación de ${nombreCompleto(f)} debe estar entre 0 y 10.`);
          return;
        }
      }
    }

    setGuardando(true);
    try {
      await Promise.all(
        cambiadas.map((f) =>
          docenteGuardarCalificacionRequest(user.token, f.carga_id, {
            parcial: aNumero(f.parcial),
            final: aNumero(f.final)
          })
        )
      );
      // lo guardado pasa a ser el nuevo valor original
      setFilas((lista) =>
        lista.map((f) => ({ ...f, origParcial: f.parcial, origFinal: f.final }))
      );
      setMensaje(`Se guardaron ${cambiadas.length} calificaciones.`);
    } catch (err) {
      setFallo(err.message || 'No se pudieron guardar las calificaciones.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="dg-card">
      <div className="dc-encabezado">
        <h2 className="dg-title" style={{ margin: 0 }}>
          {grupo
            ? `${grupo.materia} · Grupo ${String(grupo.nombre_grupo).trim()}`
            : 'Capturar calificaciones'}
        </h2>
        <button
          type="button"
          className="dc-guardar"
          onClick={guardar}
          disabled={guardando}
        >
          {guardando ? 'Guardando…' : 'Guardar calificaciones'}
        </button>
      </div>

      <div className="dg-filters">
        <div className="dg-search" style={{ width: 316 }}>
          <Search size={16} />
          <input
            className="dg-input"
            type="text"
            placeholder="Buscar por alumno o matrícula"
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
          />
        </div>

        <select
          className="dg-select"
          style={{ width: 207 }}
          value={estatus}
          onChange={(e) => { setEstatus(e.target.value); setPagina(1); }}
        >
          <option value="">Estatus</option>
          <option value="Aprobado">Aprobado</option>
          <option value="Reprobado">Reprobado</option>
          <option value="Pendiente">Pendiente</option>
        </select>

        <button type="button" className="dg-clear" onClick={limpiar}>Limpiar</button>
      </div>

      {error && <p className="dc-error">{error}</p>}
      {fallo && <p className="dc-error">{fallo}</p>}
      {mensaje && <p className="dc-exito">{mensaje}</p>}

      <div className="dg-table-wrap">
        <table className="dg-table">
          <thead>
            <tr>
              <th>Matrícula</th>
              <th>Alumno</th>
              <th>Parcial</th>
              <th>Final</th>
              <th>Estatus</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan="6" className="dg-empty">Cargando alumnos...</td></tr>
            ) : pagina_filas.length === 0 ? (
              <tr><td colSpan="6" className="dg-empty">No hay alumnos para mostrar.</td></tr>
            ) : (
              pagina_filas.map((f) => {
                const estado = estadoNota(f.parcial, f.final);
                return (
                  <tr key={f.carga_id}>
                    <td>{f.matricula}</td>
                    <td>
                      <div className="dc-alumno">
                        <span className="dc-avatar">{iniciales(f)}</span>
                        {nombreCompleto(f)}
                      </div>
                    </td>
                    <td>
                      <input
                        className="dc-nota"
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        placeholder="—"
                        value={f.parcial}
                        onChange={(e) => cambiar(f.carga_id, 'parcial', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="dc-nota"
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        placeholder="—"
                        value={f.final}
                        onChange={(e) => cambiar(f.carga_id, 'final', e.target.value)}
                      />
                    </td>
                    <td>
                      <span className={'dg-badge ' + CLASE_ESTADO[estado]}>{estado}</span>
                    </td>
                    <td>{estado === 'Reprobado' ? 'Revisar con tutoría' : '—'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Paginacion
        total={visibles.length}
        pagina={paginaActual}
        porPagina={porPagina}
        onPagina={setPagina}
        onPorPagina={(n) => { setPorPagina(n); setPagina(1); }}
      />
    </section>
  );
}
