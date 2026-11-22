// Tabla de solo lectura con el mismo estilo del sistema.
// columns: [{ key, label, width, render?(row) }]
export default function SimpleTable({ columns, rows, empty, minWidth = 760 }) {
  return (
    <div className="table-wrap">
      <table className="data-table" style={{ minWidth }}>
        <colgroup>
          {columns.map((c) => <col key={c.key} style={c.width ? { width: c.width } : undefined} />)}
        </colgroup>
        <thead>
          <tr>
            {columns.map((c) => <th key={c.key} scope="col">{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td className="data-table__empty" colSpan={columns.length}>{empty}</td></tr>
          ) : (
            rows.map((row, i) => (
              <tr key={`${row.periodo ?? ''}-${row.clave}-${i}`}>
                {columns.map((c) => (
                  <td key={c.key}>{c.render ? c.render(row) : (row[c.key] ?? '—')}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
