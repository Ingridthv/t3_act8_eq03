import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import Alert from '../components/ui/Alert.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import { TextField } from '../components/ui/TextField.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { changePasswordRequest } from '../services/api.js';

const ADMIN_PHOTO = `${import.meta.env.BASE_URL}admin.png`;
const EMPTY = { actual: '', nueva: '', confirmar: '' };

// Mismas reglas del proyecto final: 8+ caracteres, 1 mayúscula, 1 número y 1 carácter especial.
export function validatePassword(value) {
  if (!value) return 'Escribe la nueva contraseña.';
  if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (!/[A-Z]/.test(value)) return 'Debe incluir al menos una letra mayúscula.';
  if (!/\d/.test(value)) return 'Debe incluir al menos un número.';
  if (!/[^A-Za-z0-9]/.test(value)) return 'Debe incluir al menos un carácter especial (por ejemplo ! # $ %).';
  return '';
}

function validate(values) {
  const errors = {};
  if (!values.actual) errors.actual = 'Escribe tu contraseña actual.';
  const nuevaError = validatePassword(values.nueva);
  if (nuevaError) errors.nueva = nuevaError;
  else if (values.nueva === values.actual) errors.nueva = 'La nueva contraseña debe ser diferente a la actual.';
  if (!values.confirmar) errors.confirmar = 'Confirma la nueva contraseña.';
  else if (values.confirmar !== values.nueva) errors.confirmar = 'Las contraseñas no coinciden.';
  return errors;
}

export function PasswordField({ label, name, value, error, hint, show, onToggle, onChange, onBlur }) {
  return (
    <TextField
      label={label} name={name} type={show ? 'text' : 'password'} value={value} error={error} hint={hint}
      onChange={onChange} onBlur={onBlur} icon={Lock} autoComplete="off" placeholder="••••••••"
      trailing={
        <button type="button" className="field__toggle" onClick={onToggle} aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
          {show ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
        </button>
      }
    />
  );
}

export default function ConfiguracionPage() {
  const { user, updateUser } = useAuth();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [visible, setVisible] = useState({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  const fullName = 'Concepción Escarleth';
  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((cur) => ({ ...cur, [name]: '' }));
    setNotice(null);
  };
  const handleBlur = (e) => {
    const { name } = e.target;
    setErrors((cur) => ({ ...cur, [name]: validate(values)[name] ?? '' }));
  };
  const toggle = (name) => setVisible((v) => ({ ...v, [name]: !v[name] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    setNotice(null);
    try {
      // El backend verifica la contraseña actual, aplica las reglas y guarda el hash BCrypt.
      await changePasswordRequest(user.token, { actual: values.actual, nueva: values.nueva });
      updateUser({ debeCambiarPassword: false });
      setValues(EMPTY);
      setNotice({ type: 'success', text: 'Contraseña actualizada correctamente.' });
    } catch (err) {
      if (err.status === 400 && /actual no es correcta/.test(err.message)) setErrors({ actual: err.message });
      else setNotice({ type: 'error', text: err.message || 'No se pudo actualizar la contraseña.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="page" onSubmit={handleSubmit} noValidate>
      {notice && <Alert type={notice.type} onClose={() => setNotice(null)}>{notice.text}</Alert>}

      <div className="settings-grid">
        <section className="card">
          <h2 className="card__title">Perfil</h2>
          <div className="profile">
            <Avatar src={ADMIN_PHOTO} fallbackSrc={user.image} initials="CE" size="md" alt={`Foto de ${fullName}`} />
            <div>
              <p className="profile__name">{fullName}</p>
              <p className="navbar__role">Administradora</p>
            </div>
          </div>
          <div className="field">
            <span className="field__label">Correo institucional</span>
            <div className="field__control">
              <Mail size={20} className="field__icon" aria-hidden="true" />
              <input className="field__input" value={user.email ?? ''} readOnly aria-label="Correo institucional" />
            </div>
          </div>
        </section>

        <section className="card">
          <h2 className="card__title">Cambiar contraseña</h2>
          <PasswordField label="Contraseña actual" name="actual" value={values.actual} error={errors.actual}
            show={visible.actual} onToggle={() => toggle('actual')} onChange={handleChange} onBlur={handleBlur} />
          <PasswordField label="Nueva contraseña" name="nueva" value={values.nueva} error={errors.nueva}
            hint="Mínimo 8 caracteres, una mayúscula, un número y un carácter especial."
            show={visible.nueva} onToggle={() => toggle('nueva')} onChange={handleChange} onBlur={handleBlur} />
          <PasswordField label="Confirmar nueva contraseña" name="confirmar" value={values.confirmar} error={errors.confirmar}
            show={visible.confirmar} onToggle={() => toggle('confirmar')} onChange={handleChange} onBlur={handleBlur} />
        </section>
      </div>

      <div>
        <button type="submit" className="btn btn--primary" disabled={busy}>{busy ? 'Guardando...' : 'Guardar cambios'}</button>
      </div>
    </form>
  );
}
