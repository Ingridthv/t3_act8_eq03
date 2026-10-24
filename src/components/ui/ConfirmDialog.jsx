import { Pencil, Trash2 } from 'lucide-react';
import Alert from './Alert.jsx';
import Modal from './Modal.jsx';

export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  tone = 'primary',
  loading = false,
  error = '',
  onConfirm,
  onCancel,
}) {
  const Icon = tone === 'danger' ? Trash2 : Pencil;

  return (
    <Modal title={title} onClose={onCancel} width={440} stacked closeDisabled={loading}>
      <div className="confirm">
        <span className={`confirm__icon confirm__icon--${tone}`}>
          <Icon size={26} aria-hidden="true" />
        </span>
        <p className="confirm__message">{message}</p>
        {error && <Alert type="error">{error}</Alert>}
        <div className="confirm__actions">
          <button type="button" className="btn btn--secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
          <button type="button" className="btn btn--primary" onClick={onConfirm} disabled={loading}>
            {loading ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
