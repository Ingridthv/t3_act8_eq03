import { useEffect, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

// Barra de filtros genérica: búsqueda con retraso (debounce) + selectores.
export default function ListFilters({ search, placeholder, selects = [], onSearch, onSelect, onClear }) {
  const [text, setText] = useState(search);

  useEffect(() => setText(search), [search]);
  useEffect(() => {
    if (text === search) return undefined;
    const timer = setTimeout(() => onSearch(text), 350);
    return () => clearTimeout(timer);
  }, [text, search, onSearch]);

  const hasFilters = Boolean(search || selects.some((s) => (s.value ?? '') !== (s.defaultValue ?? '')));

  return (
    <div className="filters">
      <label className="filters__search field__control">
        <Search size={20} className="field__icon" aria-hidden="true" />
        <input
          type="search"
          className="field__input"
          placeholder={placeholder}
          aria-label={placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>
      {selects.map((s) => (
        <div key={s.name} className={`filters__select field__control${s.wide ? ' filters__select--career' : ''}`}>
          <select
            className={`field__input field__select${s.value ? '' : ' field__select--empty'}`}
            aria-label={`Filtrar por ${s.label.toLowerCase()}`}
            value={s.value}
            onChange={(e) => onSelect(s.name, e.target.value)}
          >
            <option value="">{s.label}</option>
            {s.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown size={20} className="field__icon field__icon--end" aria-hidden="true" />
        </div>
      ))}
      <button type="button" className="btn btn--secondary btn--sm" onClick={onClear} disabled={!hasFilters}>
        Limpiar
      </button>
    </div>
  );
}
