import { useRef, useState } from 'react';
import Alert from '../ui/Alert.jsx';
import { SelectField, TextField } from '../ui/TextField.jsx';
import { lookupPostalCode, validateEmailRemote } from '../../services/validation.js';
import { CAREERS, SEMESTERS, STATUSES, validateUserForm } from '../../utils/users.js';

const NO_HINT = { message: '', tone: 'info' };

export default function UserForm({
  initialValues,
  submitLabel,
  submitting = false,
  serverError = '',
  onSubmit,
  onCancel,
}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [emailHint, setEmailHint] = useState(NO_HINT);
  const [postalHint, setPostalHint] = useState(NO_HINT);
  const [verifying, setVerifying] = useState(false);

  // Recuerda el último correo verificado para no repetir la petición a Disify.
  const emailCache = useRef({
    email: initialValues.email.trim().toLowerCase(),
    result: { checked: true, valid: true },
  });

  const setFieldError = (name, message) =>
    setErrors((current) => {
      const next = { ...current };
      if (message) next[name] = message;
      else delete next[name];
      return next;
    });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setFieldError(name, '');
    if (name === 'email') setEmailHint(NO_HINT);
    if (name === 'postalCode') setPostalHint(NO_HINT);
  };

  // API de Disify: verifica el correo antes de aceptarlo.
  const verifyEmail = async (email) => {
    const key = email.trim().toLowerCase();
    if (emailCache.current.email === key) return emailCache.current.result;

    setVerifying(true);
    setEmailHint({ message: 'Verificando correo...', tone: 'info' });
    const result = await validateEmailRemote(email.trim());
    emailCache.current = { email: key, result };
    setVerifying(false);

    if (result.checked && !result.valid) {
      setEmailHint(NO_HINT);
      setFieldError('email', result.message);
    } else if (result.checked) {
      setEmailHint({ message: 'Correo verificado.', tone: 'success' });
    } else {
      setEmailHint(NO_HINT);
    }
    return result;
  };

  // API de Zippopotam.us: del código postal obtiene el estado.
  const lookupPostal = async (postalCode) => {
    setPostalHint({ message: 'Buscando código postal...', tone: 'info' });
    const result = await lookupPostalCode(postalCode);
    if (!result.checked) {
      setPostalHint(NO_HINT);
    } else if (!result.found) {
      setPostalHint({ message: 'No encontramos ese código postal en México.', tone: 'warning' });
    } else {
      setValues((current) => ({ ...current, state: result.state }));
      setPostalHint({ message: `Zona: ${result.zone}, ${result.state}.`, tone: 'success' });
    }
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;
    const fieldError = validateUserForm(values)[name];
    setFieldError(name, fieldError);

    if (!fieldError && name === 'email' && value.trim()) verifyEmail(value);
    if (!fieldError && name === 'postalCode' && value.trim()) lookupPostal(value.trim());
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = validateUserForm(values);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    const emailResult = await verifyEmail(values.email);
    if (emailResult.checked && !emailResult.valid) return;
    onSubmit(values);
  };

  const busy = submitting || verifying;

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="form__row">
        <TextField label="Nombre" name="firstName" value={values.firstName} error={errors.firstName}
          onChange={handleChange} onBlur={handleBlur} placeholder="Ej. Ana" autoComplete="off" />
        <TextField label="Apellidos" name="lastName" value={values.lastName} error={errors.lastName}
          onChange={handleChange} onBlur={handleBlur} placeholder="Ej. Martínez López" autoComplete="off" />
      </div>

      <TextField label="Correo electrónico" name="email" type="email" value={values.email}
        error={errors.email} hint={emailHint.message} hintTone={emailHint.tone}
        onChange={handleChange} onBlur={handleBlur} placeholder="nombre@correo.com" autoComplete="off" />

      <div className="form__row">
        <SelectField label="Carrera" name="career" value={values.career} onChange={handleChange}>
          {CAREERS.map((name) => (<option key={name} value={name}>{name}</option>))}
        </SelectField>
        <SelectField label="Semestre" name="semester" value={values.semester} onChange={handleChange}>
          {SEMESTERS.map((number) => (<option key={number} value={number}>{number}</option>))}
        </SelectField>
      </div>

      <div className="form__row">
        <TextField label="Promedio" name="average" type="number" min="0" max="10" step="0.1"
          value={values.average} error={errors.average} onChange={handleChange} onBlur={handleBlur}
          placeholder="Ej. 8.5" />
        <SelectField label="Estatus" name="status" value={values.status} onChange={handleChange}>
          {STATUSES.map((name) => (<option key={name} value={name}>{name}</option>))}
        </SelectField>
      </div>

      <div className="form__row">
        <TextField label="Código postal (opcional)" name="postalCode" inputMode="numeric" maxLength={5}
          value={values.postalCode} error={errors.postalCode} hint={postalHint.message} hintTone={postalHint.tone}
          onChange={handleChange} onBlur={handleBlur} placeholder="Ej. 68000" autoComplete="off" />
        <TextField label="Estado" name="state" value={values.state} onChange={handleChange}
          placeholder="Se llena con el código postal" autoComplete="off" />
      </div>

      {serverError && <Alert type="error">{serverError}</Alert>}

      <div className="form__actions">
        <button type="button" className="btn btn--secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </button>
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {submitting ? 'Guardando...' : verifying ? 'Verificando...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
