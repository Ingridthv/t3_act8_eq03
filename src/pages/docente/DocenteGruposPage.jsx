import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { docenteFiltrosRequest, docenteGruposPaginaRequest } from '../../services/api.js';
import Paginacion from './Paginacion.jsx';
import './DocenteGruposPage.css';
import './DocenteExtras.css';

// badge de la columna "Captura" (Completa / Pendiente)
function BadgeCaptura({ valor }) {
  const texto = String(valor || '').toLowerCase();

  if (texto === 'completa') {
    return <span className="dg-badge dg-badge--ok">Completa</span>;
  }
  if (texto === 'pendiente') {
    return <span className="dg-badge dg-badge--pend">Pendiente</span>;
  }
  return <span>—</span>;
}

export default function DocenteGruposPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [busqueda, setBusqueda] = useState('');
  // al entrar se muestra el periodo actual (lo define la base de datos)
  const [periodo, setPeriodo] = useState('actual');
  const [carrera, setCarrera] = useState('');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);

  const [filtros, setFiltros] = useState({ periodos: [], carreras: [] });
  const [datos, setDatos] = useState({ items: [], total: 0 });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // opciones de los selects
  useEffect(() => {
    docenteFiltrosRequest(user.token).then(setFiltros).catch(() => {});
  }, [user.token]);

  // grupos de la página actual (filtra y pagina el servidor)
  useEffect(() => {
    let vigente = true;
    const espera = setTimeout(async () => {
      setCargando(true);
      setError('');
      try {
        const res = await docenteGruposPaginaRequest(user.token, {
          q: busqueda.trim(),
          periodo,
          carrera,
          page: pagina,
          size: porPagina
        });
        if (vigente) setDatos(res);
      } catch (err) {
        if (vigente) {
          setDatos({ items: [], total: 0 });
          setError(err.message || 'No se pudieron cargar los grupos.');
        }
      } finally {
        if (vigente) setCargando(false);
      }
    }, busqueda ? 300 : 0);

    return () => {
      vigente = false;
      clearTimeout(espera);
    };
  }, [user.token, busqueda, periodo, carrera, pagina, porPagina]);

  const periodoElegido = filtros.periodos.find((p) =>
    periodo === 'actual' ? p.actual : String(p.id) === periodo
  );

  function limpiar() {
    setBusqueda('');
    setPeriodo('actual');
    setCarrera('');
    setPagina(1);
  }

  return (
    <section className="dg-card">
      <h2 className="dg-title">
        {periodoElegido ? `Grupos del periodo ${periodoElegido.nombre}` : 'Grupos de todos los periodos'}
      </h2>

      {/* filtros */}
      <div className="dg-filters">
        <div className="dg-search">
          <Search size={16} />
          <input
            className="dg-input"
            type="text"
            placeholder="Buscar por materia"
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
          />
        </div>

        <select
          className="dg-select dg-select--periodo"
          value={periodo}
          onChange={(e) => { setPeriodo(e.target.value); setPagina(1); }}
        >
          <option value="">Todos los periodos</option>
          {filtros.periodos.map((p) => (
            <option key={p.id} value={p.actual ? 'actual' : String(p.id)}>{p.nombre}</option>
          ))}
        </select>

        <select
          className="dg-select"
          value={carrera}
          onChange={(e) => { setCarrera(e.target.value); setPagina(1); }}
        >
          <option value="">Carrera</option>
          {filtros.carreras.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <button type="button" className="dg-clear" onClick={limpiar}>
          Limpiar
        </button>
      </div>

      {error && <p className="dc-error">{error}</p>}

      {/* tabla */}
      <div className="dg-table-wrap">
        <table className="dg-table">
          <thead>
            <tr>
              <th style={{ width: '24%' }}>Materia</th>
              <th style={{ width: '9%' }}>Grupo</th>
              <th style={{ width: '20%' }}>Carrera</th>
              <th style={{ width: '24%' }}>Horario</th>
              <th style={{ width: '10%' }}>Alumnos</th>
              <th style={{ width: '13%' }}>Captura</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan="6" className="dg-empty">Cargando grupos...</td></tr>
            ) : datos.items.length === 0 ? (
              <tr>
                <td colSpan="6" className="dg-empty">
                  No hay grupos que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              datos.items.map((g) => (
                <tr
                  key={g.grupo_id}
                  className="dg-row-link"
                  onClick={() => navigate(`/docente/grupos/${g.grupo_id}`)}
                >
                  <td>{g.materia}</td>
                  <td>{String(g.nombre_grupo).trim()}</td>
                  <td>{g.carrera || '—'}</td>
                  <td>{g.horario}</td>
                  <td>{g.alumnos}</td>
                  <td><BadgeCaptura valor={g.captura} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Paginacion
        total={datos.total}
        pagina={pagina}
        porPagina={porPagina}
        onPagina={setPagina}
        onPorPagina={(n) => { setPorPagina(n); setPagina(1); }}
      />
    </section>
  );
}
