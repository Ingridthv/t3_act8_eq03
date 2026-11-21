import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock } from 'lucide-react';
import Alert from '../components/ui/Alert.jsx';
import AuthShell from '../components/layout/AuthShell.jsx';
import { TextField } from '../components/ui/TextField.jsx';
import { resetPasswordRequest } from '../services/api.js';
import { validatePassword } from './ConfiguracionPage.jsx';

// Llega desde el enlace del correo: /#/restablecer?token=...
export default function RestablecerPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [values, setValues] = useState({ nueva: '', confirmar: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((c) => ({ ...c, [name]: '' }));
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = {};
    const nuevaError = validatePassword(values.nueva);
    if (nuevaError) found.nueva = nuevaError;
    if (!values.confirmar) found.confirmar = 'Confirma la nueva contraseña.';
    else if (values.confirmar !== values.nueva) found.confirmar = 'Las contraseñas no coinciden.';
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      await resetPasswordRequest({ token, nueva: values.nueva });
      setDone(true);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <AuthShell title="Enlace no válido">
        <div className="form">
          <Alert type="error">Falta el código de recuperación. Solicita un enlace nuevo.</Alert>
          <Link to="/recuperar" className="btn btn--primary btn--block">Solicitar enlace</Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Nueva contraseña" subtitle="Elige una contraseña segura">
      {done ? (
        <div className="form">
          <Alert type="success">Tu contraseña se actualizó. Ya puedes iniciar sesión.</Alert>
          <Link to="/login" className="btn btn--primary btn--block">Ir a iniciar sesión</Link>
        </div>
      ) : (
        <form className="form" onSubmit={handleSubmit} noValidate>
          {formError && <Alert type="error">{formError}</Alert>}
          <TextField
            label="Nueva contraseña" name="nueva" type={show ? 'text' : 'password'} icon={Lock}
            value={values.nueva} error={errors.nueva} onChange={handleChange} autoComplete="new-password"
            hint="Mínimo 8 caracteres, una mayúscula, un número y un carácter especial."
            trailing={
              <button type="button" className="field__toggle" onClick={() => setShow((s) => !s)}
                aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                {show ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            }
          />
          <TextField
            label="Confirmar contraseña" name="confirmar" type={show ? 'text' : 'password'} icon={Lock}
            value={values.confirmar} error={errors.confirmar} onChange={handleChange} autoComplete="new-password"
          />
          <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
            {busy ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
