import { useId } from 'react';

function FieldMessage({ id, error, hint, hintTone }) {
  if (error) {
    return (
      <p id={id} className="field__message field__message--error" role="alert">
        {error}
      </p>
    );
  }
  if (hint) {
    return (
      <p id={id} className={`field__message field__message--${hintTone}`}>
        {hint}
      </p>
    );
  }
  return null;
}

export function TextField({
  label,
  error,
  hint,
  hintTone = 'info',
  icon: Icon,
  trailing,
  id,
  className = '',
  ...inputProps
}) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const messageId = `${fieldId}-message`;

  return (
    <div className={`field ${className}`}>
      <label className="field__label" htmlFor={fieldId}>
        {label}
      </label>
      <div className={`field__control${error ? ' field__control--error' : ''}`}>
        {Icon && <Icon size={20} className="field__icon" aria-hidden="true" />}
        <input
          id={fieldId}
          className="field__input"
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error || hint ? messageId : undefined}
          {...inputProps}
        />
        {trailing}
      </div>
      <FieldMessage id={messageId} error={error} hint={hint} hintTone={hintTone} />
    </div>
  );
}

export function SelectField({ label, error, id, className = '', children, ...selectProps }) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const messageId = `${fieldId}-message`;

  return (
    <div className={`field ${className}`}>
      <label className="field__label" htmlFor={fieldId}>
        {label}
      </label>
      <div className={`field__control${error ? ' field__control--error' : ''}`}>
        <select
          id={fieldId}
          className="field__input field__select"
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? messageId : undefined}
          {...selectProps}
        >
          {children}
        </select>
      </div>
      <FieldMessage id={messageId} error={error} />
    </div>
  );
}
