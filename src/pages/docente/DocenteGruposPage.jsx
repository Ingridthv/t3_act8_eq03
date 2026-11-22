import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';

export default function DocenteGruposPage() {
  const { grupos } = useOutletContext();
  const [periodo, setPeriodo] = useState('todos');

  // lista de periodos disponibles para el filtro
  const periodos = [...new Set(grupos.map((g) => g.periodo))];
  const visibles =
    periodo === 'todos' ? grupos : grupos.filter((g) => g.periodo === periodo);

  return (
    <div className="page">
      <section className="card">
        <div className="card__header">
          <div>
            <h2 className="card__title">Mis grupos</h2>
            <p style={{ color: 'var(--gris)' }}>
              Todas las materias y horarios que tienes asignados.
            </p>
          </div>
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }}
          >
            <option value="todos">Todos los periodos</option>
            {periodos.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="table-wrap">
          <table className="data-table" style={{ minWidth: 850 }}>
            <thead>
              <tr>
                <th>Materia</th>
                <th>Clave</th>
                <th>Grupo</th>
                <th>Horario</th>
                <th>Periodo</th>
                <th>Cupo</th>
              </tr>
            </thead>
            <tbody>
              {visibles.length === 0 ? (
                <tr>
                  <td colSpan="6" className="data-table__empty">
                    No hay grupos para mostrar.
                  </td>
                </tr>
              ) : (
                visibles.map((g) => (
                  <tr key={g.grupo_id}>
                    <td className="data-table__strong">{g.materia}</td>
                    <td>{g.clave_materia}</td>
                    <td>{g.nombre_grupo}</td>
                    <td>{g.horario}</td>
                    <td>{g.periodo}</td>
                    <td>{g.cupo}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}