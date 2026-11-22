import { useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { docenteGuardarCalificacionRequest } from '../../services/api.js';
import Paginacion from './Paginacion.jsx';
import SelectorGrupo, { CambiarGrupo } from './SelectorGrupo.jsx';
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
  const grupo = grupos.find((g) => String(g.grupo_id) === grupoId);

  const [busqueda, setBusqueda] = useState('');
  const [estatus, setEstatus] = useState('');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [fallo, setFallo] = useState('');

  // el servidor busca, filtra y pagina
  const { alumnos, total, cargando, error, recargar } = useAlumnosGrupo(grupoId, {
    q: busqueda,
    estatus,
    page: pagina,
    size: porPagina
  });

  // cambios sin guardar, por carga académica (se conservan al cambiar de página)
  const [ediciones, setEdiciones] = useState({});

  function valor(f, campo) {
    const e = ediciones[f.carga_id];
    if (e && campo in e) return e[campo];
    return f[campo] ?? '';
  }

  // guardo siempre el par parcial/final de la fila, así no se pierde el otro valor al cambiar de página
  function cambiar(f, campo, nuevo) {
    setMensaje('');
    setFallo('');
    setEdiciones((prev) => ({
      ...prev,
      [f.carga_id]: {
        parcial: valor(f, 'parcial'),
        final: valor(f, 'final'),
        ...prev[f.carga_id],
        [campo]: nuevo
      }
    }));
  }

  const pagina_filas = alumnos;

  function limpiar() {
    setBusqueda('');
    setEstatus('');
    setPagina(1);
  }

  // guardo solo las filas que cambiaron
  async function guardar() {
    setMensaje('');
    setFallo('');

    const cambiadas = Object.entries(ediciones);

    if (cambiadas.length === 0) {
      setMensaje('No hay cambios por guardar.');
      return;
    }

    // las notas deben estar entre 0 y 10
    for (const [, e] of cambiadas) {
      for (const campo of ['parcial', 'final']) {
        const n = aNumero(e[campo]);
        if (e[campo] !== '' && (n === null || n < 0 || n > 10)) {
          setFallo('Las calificaciones deben estar entre 0 y 10.');
          return;
        }
      }
    }

    setGuardando(true);
    try {
      await Promise.all(
        cambiadas.map(([cargaId, e]) =>
          docenteGuardarCalificacionRequest(user.token, cargaId, {
            parcial: aNumero(e.parcial),
            final: aNumero(e.final)
          })
        )
      );
      setEdiciones({});
      recargar();
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
        <div className="dc-encabezado__acciones">
          <CambiarGrupo grupos={grupos} grupoId={grupoId} destino="/docente/calificaciones" />
          <button
            type="button"
            className="dc-guardar"
            onClick={guardar}
            disabled={guardando}
          >
            {guardando ? 'Guardando…' : 'Guardar calificaciones'}
          </button>
        </div>
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
                const estado = estadoNota(valor(f, 'parcial'), valor(f, 'final'));
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
                        value={valor(f, 'parcial')}
                        onChange={(e) => cambiar(f, 'parcial', e.target.value)}
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
                        value={valor(f, 'final')}
                        onChange={(e) => cambiar(f, 'final', e.target.value)}
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
        total={total}
        pagina={pagina}
        porPagina={porPagina}
        onPagina={setPagina}
        onPorPagina={(n) => { setPorPagina(n); setPagina(1); }}
      />
    </section>
  );
}
