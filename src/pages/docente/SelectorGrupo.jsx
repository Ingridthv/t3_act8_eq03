import { Navigate, useNavigate } from 'react-router-dom';
import './DocenteGruposPage.css';
import './DocenteExtras.css';

// lista de grupos para elegir; al hacer clic se va a `${destino}/${grupo_id}`
export default function SelectorGrupo({ grupos, destino, titulo }) {
  const navigate = useNavigate();

  const delPeriodo = grupos.filter((g) => g.periodo_actual);
  const lista = delPeriodo.length > 0 ? delPeriodo : grupos;

  // como en el Figma: la pantalla abre directo con un grupo del periodo actual
  if (lista.length > 0) {
    return <Navigate to={`${destino}/${lista[0].grupo_id}`} replace />;
  }

  return (
    <section className="dg-card">
      <h2 className="dg-title">{titulo}</h2>

      <div className="dg-table-wrap">
        <table className="dg-table">
          <thead>
            <tr>
              <th>Materia</th>
              <th>Grupo</th>
              <th>Carrera</th>
              <th>Horario</th>
              <th>Periodo</th>
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 ? (
              <tr>
                <td colSpan="5" className="dg-empty">No tienes grupos asignados.</td>
              </tr>
            ) : (
              lista.map((g) => (
                <tr
                  key={g.grupo_id}
                  className="dg-row-link"
                  onClick={() => navigate(`${destino}/${g.grupo_id}`)}
                >
                  <td>{g.materia}</td>
                  <td>{String(g.nombre_grupo).trim()}</td>
                  <td>{g.carrera || '—'}</td>
                  <td>{g.horario}</td>
                  <td>{g.periodo}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// select para cambiar de grupo sin volver al listado
export function CambiarGrupo({ grupos, grupoId, destino }) {
  const navigate = useNavigate();
  const actuales = grupos.filter((g) => g.periodo_actual);
  const opciones = actuales.length > 0 ? actuales : grupos;

  return (
    <select
      className="dg-select dc-cambiar-grupo"
      value={grupoId}
      onChange={(e) => navigate(`${destino}/${e.target.value}`)}
      aria-label="Cambiar de grupo"
    >
      {opciones.map((g) => (
        <option key={g.grupo_id} value={g.grupo_id}>
          {g.materia} · Grupo {String(g.nombre_grupo).trim()}
        </option>
      ))}
    </select>
  );
}
