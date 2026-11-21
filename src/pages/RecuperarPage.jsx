import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import Alert from '../components/ui/Alert.jsx';
import AuthShell from '../components/layout/AuthShell.jsx';
import { TextField } from '../components/ui/TextField.jsx';
import { recoverPasswordRequest } from '../services/api.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RecuperarPage() {
  const [correo, setCorreo] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = correo.trim();
    if (!email) return setError('Ingresa tu correo institucional.');
    if (!EMAIL_PATTERN.test(email)) return setError('Escribe un correo válido, por ejemplo 20168978@escuela.edu.mx.');
    setBusy(true);
    setFormError('');
    try {
      await recoverPasswordRequest(email);
      setSent(true);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Recuperar contraseña" subtitle="Te enviaremos un enlace a tu correo">
      {sent ? (
        <div className="form">
          <Alert type="success">
            Si el correo está registrado, recibirás un enlace para restablecer tu contraseña. Vence en 30 minutos.
          </Alert>
          <Link to="/login" className="btn btn--primary btn--block">Volver a iniciar sesión</Link>
        </div>
      ) : (
        <form className="form" onSubmit={handleSubmit} noValidate>
          {formError && <Alert type="error">{formError}</Alert>}
          <TextField
            label="Correo institucional" name="correo" type="email" icon={Mail} value={correo} error={error}
            onChange={(e) => { setCorreo(e.target.value); setError(''); setFormError(''); }}
            placeholder="20168978@escuela.edu.mx" autoComplete="username" autoFocus
          />
          <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
            {busy ? 'Enviando...' : 'Enviar enlace'}
          </button>
          <div className="login__link-row"><Link to="/login" className="login__link">Volver a iniciar sesión</Link></div>
        </form>
      )}
    </AuthShell>
  );
}
