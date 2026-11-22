import { ChevronLeft, ChevronRight } from 'lucide-react';

// "Mostrar [10] registros · Mostrando 1–8 de 28" + botones de página
export default function Paginacion({ total, pagina, porPagina, onPagina, onPorPagina }) {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  const desde = total === 0 ? 0 : (pagina - 1) * porPagina + 1;
  const hasta = Math.min(total, pagina * porPagina);

  // ventana de hasta 5 páginas
  const inicio = Math.max(1, Math.min(pagina - 2, paginas - 4));
  const fin = Math.min(paginas, inicio + 4);
  const numeros = [];
  for (let i = inicio; i <= fin; i++) numeros.push(i);

  return (
    <div className="dc-pie">
      <div className="dc-pie__info">
        <span>Mostrar</span>
        <select
          className="dg-select dc-pie__select"
          value={porPagina}
          onChange={(e) => onPorPagina(Number(e.target.value))}
        >
          {[10, 20, 40, 50].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <span>registros</span>
        <span className="dc-pie__dato">· Mostrando {desde}–{hasta} de {total}</span>
      </div>

      <div className="dc-pag">
        <button
          type="button"
          className="dc-pag__btn"
          disabled={pagina === 1}
          onClick={() => onPagina(pagina - 1)}
          aria-label="Anterior"
        >
          <ChevronLeft size={16} />
        </button>

        {numeros.map((n) => (
          <button
            key={n}
            type="button"
            className={'dc-pag__btn' + (n === pagina ? ' dc-pag__btn--activo' : '')}
            onClick={() => onPagina(n)}
          >
            {n}
          </button>
        ))}

        <button
          type="button"
          className="dc-pag__btn"
          disabled={pagina === paginas}
          onClick={() => onPagina(pagina + 1)}
          aria-label="Siguiente"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
