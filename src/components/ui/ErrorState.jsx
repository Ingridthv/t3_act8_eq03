import { AlertCircle } from 'lucide-react';

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="state state--error" role="alert">
      <AlertCircle size={32} aria-hidden="true" />
      <p className="state__title">No pudimos cargar los datos</p>
      <p className="state__text">{message}</p>
      {onRetry && (
        <button type="button" className="btn btn--secondary btn--sm" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}
