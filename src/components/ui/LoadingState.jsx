export default function LoadingState({ message = 'Cargando...' }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <p className="state__text">{message}</p>
    </div>
  );
}
