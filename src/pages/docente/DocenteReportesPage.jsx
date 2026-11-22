import { useOutletContext } from 'react-router-dom';

export default function DocenteReportesPage() {
  const { grupos } = useOutletContext();

  // resumen por periodo con los datos que ya trae la API de grupos
  const resumen = Object.values(
    grupos.reduce((acc, g) => {
      const r = acc[g.periodo] || { periodo: g.periodo, grupos: 0, materias: new Set(), cupo: 0 };
      r.grupos += 1;
      r.materias.add(g.clave_materia);
      r.cupo += Number(g.cupo) || 0;
      acc[g.periodo] = r;
      return acc;
    }, {})
  );

  return (
    <div className="page">
      <section className="card">
        <h2 className="card__title">Resumen por periodo</h2>
        <p style={{ color: 'var(--gris)' }}>
          Grupos, materias y cupo que has tenido en cada periodo.
        </p>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Periodo</th>
                <th>Grupos</th>
                <th>Materias</th>
                <th>Cupo total</th>
              </tr>
            </thead>
            <tbody>
              {resumen.length === 0 ? (
                <tr>
                  <td colSpan="4" className="data-table__empty">
                    No hay información para mostrar.
                  </td>
                </tr>
              ) : (
                resumen.map((r) => (
                  <tr key={r.periodo}>
                    <td className="data-table__strong">{r.periodo}</td>
                    <td>{r.grupos}</td>
                    <td>{r.materias.size}</td>
                    <td>{r.cupo}</td>
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