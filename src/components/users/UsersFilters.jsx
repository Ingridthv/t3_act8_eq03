import { ChevronDown, Search } from 'lucide-react';
import { CAREERS, SEMESTERS, STATUSES } from '../../utils/users.js';

function FilterSelect({ label, name, value, options, onChange }) {
  return (
    <div className={`filters__select filters__select--${name} field__control`}>
      <select
        className={`field__input field__select${value ? '' : ' field__select--empty'}`}
        aria-label={`Filtrar por ${label.toLowerCase()}`}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
      >
        <option value="">{label}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {name === 'semester' ? `Semestre ${option}` : option}
          </option>
        ))}
      </select>
      <ChevronDown size={20} className="field__icon field__icon--end" aria-hidden="true" />
    </div>
  );
}

export default function UsersFilters({
  search,
  career,
  semester,
  status,
  onSearchChange,
  onFilterChange,
  onClear,
}) {
  const hasFilters = Boolean(search || career || semester || status);

  return (
    <div className="filters">
      <label className="filters__search field__control">
        <Search size={20} className="field__icon" aria-hidden="true" />
        <input
          type="search"
          className="field__input"
          placeholder="Buscar por nombre o matrícula"
          aria-label="Buscar por nombre o matrícula"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>
      <FilterSelect label="Carrera" name="career" value={career} options={CAREERS} onChange={onFilterChange} />
      <FilterSelect label="Semestre" name="semester" value={semester} options={SEMESTERS} onChange={onFilterChange} />
      <FilterSelect label="Estatus" name="status" value={status} options={STATUSES} onChange={onFilterChange} />
      <button type="button" className="btn btn--secondary btn--sm" onClick={onClear} disabled={!hasFilters}>
        Limpiar
      </button>
    </div>
  );
}
