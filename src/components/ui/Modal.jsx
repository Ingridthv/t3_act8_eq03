import { useEffect, useId } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  title,
  subtitle,
  onClose,
  children,
  width = 560,
  stacked = false,
  closeDisabled = false,
}) {
  const titleId = useId();

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !closeDisabled) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, closeDisabled]);

  const handleOverlayMouseDown = (event) => {
    if (event.target === event.currentTarget && !closeDisabled) onClose();
  };

  return (
    <div
      className={`modal-overlay${stacked ? ' modal-overlay--stacked' : ''}`}
      onMouseDown={handleOverlayMouseDown}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{ maxWidth: width }}
      >
        <header className="modal__header">
          <div>
            <h2 id={titleId} className="modal__title">
              {title}
            </h2>
            {subtitle && <p className="modal__subtitle">{subtitle}</p>}
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            disabled={closeDisabled}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
