
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Cantidad maxima de botones de paginas visibles
const MAX_VISIBLE_PAGES = 5;

// Obtener las paginas que se mostraran
function getVisiblePages(page, totalPages) {
  const count = Math.min(MAX_VISIBLE_PAGES, totalPages);

  const start = Math.max(
    1,
    Math.min(
      page - Math.floor(count / 2),
      totalPages - count + 1
    )
  );

  return Array.from(
    { length: count },
    (_, index) => start + index
  );
}

export default function Pagination({
  page,
  totalPages,
  totalItems,
  onPageChange,
}) {
  // Mostrar siempre 10 alumnos por pagina
  const limit = 10;

  const firstItem =
    totalItems === 0 ? 0 : (page - 1) * limit + 1;

  const lastItem = Math.min(
    page * limit,
    totalItems
  );

  return (
    <div className="pagination">

      {/* Informacion de los registros */}
      <div className="pagination__info">
        <span className="pagination__summary">
          Mostrando {firstItem}–{lastItem} de {totalItems} alumnos
        </span>
      </div>

      {/* Botones de paginacion */}
      <nav
        className="pagination__pages"
        aria-label="Paginación de alumnos"
      >

        {/* Pagina anterior */}
        <button
          type="button"
          className="page-button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Numeros de paginas */}
        {getVisiblePages(page, totalPages).map((number) => (
          <button
            key={number}
            type="button"
            className={`page-button${
              number === page ? ' page-button--active' : ''
            }`}
            onClick={() => onPageChange(number)}
            aria-current={
              number === page ? 'page' : undefined
            }
            aria-label={`Página ${number}`}
          >
            {number}
          </button>
        ))}

        {/* Pagina siguiente */}
        <button
          type="button"
          className="page-button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Página siguiente"
        >
          <ChevronRight size={18} />
        </button>

      </nav>
    </div>
  );
}
