import { useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import Paginacion from './Paginacion.jsx';
import useAlumnosGrupo from './useAlumnosGrupo.js';
import { nombreCompleto, iniciales, formato, aNumero } from './utilsDocente.js';
import './DocenteGruposPage.css';
import './DocenteExtras.css';

export default function DocenteAlumnosGrupoPage() {
  const { grupoId } = useParams();
  const { grupos } = useOutletContext();

  const grupo = grupos.find((g) => String(g.grupo_id) === grupoId);

  const [busqueda, setBusqueda] = useState('');
  const [estatus, setEstatus] = useState('');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);

  // el servidor busca, filtra y pagina
  const { alumnos: filas, total, cargando, error } = useAlumnosGrupo(grupoId, {
    q: busqueda,
    estatus,
    page: pagina,
    size: porPagina
  });

  function limpiar() {
    setBusqueda('');
    setEstatus('');
    setPagina(1);
  }

  return (
    <section className="dg-card">
      <h2 className="dg-title">
        {grupo ? `${grupo.materia} · Grupo ${String(grupo.nombre_grupo).trim()}` : 'Alumnos del grupo'}
      </h2>

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
          <option value="Inscrito">Inscrito</option>
          <option value="Baja">Baja</option>
        </select>

        <button type="button" className="dg-clear" onClick={limpiar}>Limpiar</button>
      </div>

      {error && <p className="dc-error">{error}</p>}

      <div className="dg-table-wrap">
        <table className="dg-table">
          <thead>
            <tr>
              <th>Matrícula</th>
              <th>Alumno</th>
              <th>Carrera</th>
              <th>Semestre</th>
              <th>Promedio</th>
              <th>Estatus</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan="6" className="dg-empty">Cargando alumnos...</td></tr>
            ) : filas.length === 0 ? (
              <tr><td colSpan="6" className="dg-empty">No hay alumnos para mostrar.</td></tr>
            ) : (
              filas.map((a) => {
                const etiqueta = a.estatus_inscripcion === 'baja' ? 'Baja' : 'Inscrito';
                return (
                  <tr key={a.carga_id}>
                    <td>{a.matricula}</td>
                    <td>
                      <div className="dc-alumno">
                        <span className="dc-avatar">{iniciales(a)}</span>
                        {nombreCompleto(a)}
                      </div>
                    </td>
                    <td>{a.carrera || '—'}</td>
                    <td>{a.semestre ? `${a.semestre}°` : '—'}</td>
                    <td className="dc-negrita">{formato(aNumero(a.promedio))}</td>
                    <td>
                      <span className={'dg-badge ' + (etiqueta === 'Baja' ? 'dg-badge--gris' : 'dg-badge--ok')}>
                        {etiqueta}
                      </span>
                    </td>
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
