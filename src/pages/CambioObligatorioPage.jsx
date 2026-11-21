import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import Alert from '../components/ui/Alert.jsx';
import AuthShell from '../components/layout/AuthShell.jsx';
import { homeFor } from '../components/layout/RouteGuards.jsx';
import { TextField } from '../components/ui/TextField.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { changePasswordRequest } from '../services/api.js';
import { validatePassword } from './ConfiguracionPage.jsx';

// Primer ingreso: la contraseña temporal debe cambiarse antes de entrar al sistema.
export default function CambioObligatorioPage() {
  const { user, updateUser, logout } = useAuth();
  const [values, setValues] = useState({ actual: '', nueva: '', confirmar: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!user) return <Navigate to="/login" replace />;
  if (!user.debeCambiarPassword) return <Navigate to={homeFor(user.role)} replace />;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((c) => ({ ...c, [name]: '' }));
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!values.actual) found.actual = 'Escribe tu contraseña temporal.';
    const nuevaError = validatePassword(values.nueva);
    if (nuevaError) found.nueva = nuevaError;
    else if (values.nueva === values.actual) found.nueva = 'La nueva contraseña debe ser diferente a la temporal.';
    if (!values.confirmar) found.confirmar = 'Confirma la nueva contraseña.';
    else if (values.confirmar !== values.nueva) found.confirmar = 'Las contraseñas no coinciden.';
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      await changePasswordRequest(user.token, { actual: values.actual, nueva: values.nueva });
      updateUser({ debeCambiarPassword: false });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Cambia tu contraseña" subtitle="Por seguridad, reemplaza tu contraseña temporal">
      <form className="form" onSubmit={handleSubmit} noValidate>
        {formError && <Alert type="error">{formError}</Alert>}
        <TextField label="Contraseña temporal" name="actual" type="password" icon={Lock}
          value={values.actual} error={errors.actual} onChange={handleChange} autoComplete="current-password" />
        <TextField label="Nueva contraseña" name="nueva" type="password" icon={Lock}
          value={values.nueva} error={errors.nueva} onChange={handleChange} autoComplete="new-password"
          hint="Mínimo 8 caracteres, una mayúscula, un número y un carácter especial." />
        <TextField label="Confirmar contraseña" name="confirmar" type="password" icon={Lock}
          value={values.confirmar} error={errors.confirmar} onChange={handleChange} autoComplete="new-password" />
        <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
          {busy ? 'Guardando...' : 'Guardar y continuar'}
        </button>
        <div className="login__link-row">
          <button type="button" className="login__link" onClick={logout}>Cerrar sesión</button>
        </div>
      </form>
    </AuthShell>
  );
}
