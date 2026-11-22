import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Search } from 'lucide-react';
import './DocenteGruposPage.css';

// periodo que se muestra al entrar, como en el Figma
const PERIODO_ACTUAL = 'Agosto-Diciembre 2021';

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
  const { grupos } = useOutletContext();
  const navigate = useNavigate();

  const [busqueda, setBusqueda] = useState('');
  const [periodo, setPeriodo] = useState(PERIODO_ACTUAL);
  const [carrera, setCarrera] = useState('');

  // opciones de los filtros a partir de los datos
  const periodos = [...new Set(grupos.map((g) => g.periodo))];
  const carreras = [...new Set(grupos.map((g) => g.carrera).filter(Boolean))];

  // aplico los tres filtros
  const visibles = grupos.filter((g) => {
    const coincideMateria = g.materia
      ?.toLowerCase()
      .includes(busqueda.trim().toLowerCase());
    const coincidePeriodo = !periodo || g.periodo === periodo;
    const coincideCarrera = !carrera || g.carrera === carrera;
    return coincideMateria && coincidePeriodo && coincideCarrera;
  });

  function limpiar() {
    setBusqueda('');
    setPeriodo('');
    setCarrera('');
  }

  return (
    <section className="dg-card">
      <h2 className="dg-title">
        {periodo ? `Grupos del periodo ${periodo}` : 'Grupos de todos los periodos'}
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
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <select
          className="dg-select"
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
        >
          <option value="">Periodo</option>
          {periodos.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select
          className="dg-select"
          value={carrera}
          onChange={(e) => setCarrera(e.target.value)}
        >
          <option value="">Carrera</option>
          {carreras.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <button type="button" className="dg-clear" onClick={limpiar}>
          Limpiar
        </button>
      </div>

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
            {visibles.length === 0 ? (
              <tr>
                <td colSpan="6" className="dg-empty">
                  No hay grupos que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              visibles.map((g) => (
                <tr
                  key={g.grupo_id}
                  className="dg-row-link"
                  onClick={() => navigate(`/docente/grupos/${g.grupo_id}`)}
                >
                  <td>{g.materia}</td>
                  <td>{g.nombre_grupo}</td>
                  <td>{g.carrera || '—'}</td>
                  <td>{g.horario}</td>
                  <td>{g.alumnos ?? g.cupo}</td>
                  <td><BadgeCaptura valor={g.captura} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
