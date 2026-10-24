import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { LIMIT_OPTIONS } from '../../utils/users.js';

const MAX_VISIBLE_PAGES = 5;

function getVisiblePages(page, totalPages) {
  const count = Math.min(MAX_VISIBLE_PAGES, totalPages);
  const start = Math.max(1, Math.min(page - Math.floor(count / 2), totalPages - count + 1));
  return Array.from({ length: count }, (_, index) => start + index);
}

export default function Pagination({
  page,
  totalPages,
  limit,
  totalItems,
  onPageChange,
  onLimitChange,
}) {
  const firstItem = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const lastItem = Math.min(page * limit, totalItems);

  return (
    <div className="pagination">
      <div className="pagination__info">
        <label className="pagination__limit">
          <span>Mostrar</span>
          <span className="field__control pagination__select">
            <select
              className="field__input field__select"
              value={limit}
              onChange={(event) => onLimitChange(Number(event.target.value))}
              aria-label="Registros por página"
            >
              {LIMIT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="field__icon field__icon--end" aria-hidden="true" />
          </span>
          <span>registros</span>
        </label>
        <span className="pagination__summary">
          ·&nbsp; Mostrando {firstItem}–{lastItem} de {totalItems}
        </span>
      </div>

      <nav className="pagination__pages" aria-label="Paginación">
        <button
          type="button"
          className="page-button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft size={18} />
        </button>
        {getVisiblePages(page, totalPages).map((number) => (
          <button
            key={number}
            type="button"
            className={`page-button${number === page ? ' page-button--active' : ''}`}
            onClick={() => onPageChange(number)}
            aria-current={number === page ? 'page' : undefined}
            aria-label={`Página ${number}`}
          >
            {number}
          </button>
        ))}
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
