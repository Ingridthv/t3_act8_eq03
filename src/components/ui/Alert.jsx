import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const ICONS = { error: AlertCircle, success: CheckCircle2, info: Info };

export default function Alert({ type = 'info', children, onClose }) {
  const Icon = ICONS[type];
  return (
    <div className={`alert alert--${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <Icon size={18} aria-hidden="true" />
      <p className="alert__text">{children}</p>
      {onClose && (
        <button type="button" className="alert__close" onClick={onClose} aria-label="Cerrar aviso">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
