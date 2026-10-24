import { useRef, useState } from 'react';
import { Eye, EyeOff, GraduationCap, Lock, Mail } from 'lucide-react';
import Alert from '../components/ui/Alert.jsx';
import { TextField } from '../components/ui/TextField.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { findUsernameByEmail } from '../services/api.js';
import { checkPasswordBreach } from '../services/validation.js';

const DEMO_CREDENTIALS = { username: 'emilys', password: 'emilyspass' };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateLogin({ username, password }) {
  const errors = {};
  const identifier = username.trim();
  if (!identifier) errors.username = 'Ingresa tu usuario o correo.';
  else if (identifier.includes('@') && !EMAIL_PATTERN.test(identifier)) errors.username = 'Escribe un correo válido, por ejemplo nombre@dominio.com.';
  else if (identifier.length < 3) errors.username = 'Debe tener al menos 3 caracteres.';

  if (!password) errors.password = 'Ingresa tu contraseña.';
  else if (password.length < 4) errors.password = 'La contraseña debe tener al menos 4 caracteres.';
  return errors;
}

export default function LoginPage() {
  const { login } = useAuth();
  const [values, setValues] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [passwordWarning, setPasswordWarning] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const breachCheckId = useRef(0);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setFormError('');
    if (name === 'password') setPasswordWarning('');
  };

  // API de Have I Been Pwned: avisa (sin bloquear) si la contraseña aparece en filtraciones.
  const checkPassword = async (password) => {
    const checkId = ++breachCheckId.current;
    const result = await checkPasswordBreach(password);
    if (checkId !== breachCheckId.current) return;
    if (result.checked && result.breached) {
      setPasswordWarning(
        `Esta contraseña apareció ${result.count.toLocaleString('es-MX')} veces en filtraciones públicas. No bloquea el acceso, pero evita reutilizarla.`
      );
    }
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    const fieldError = validateLogin(values)[name];
    setErrors((current) => ({ ...current, [name]: fieldError }));
    if (name === 'password' && !fieldError) checkPassword(values.password);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = validateLogin(values);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      const identifier = values.username.trim();
      // DummyJSON inicia sesión con username: si escribieron un correo, se busca su username.
      const username = identifier.includes('@') ? await findUsernameByEmail(identifier) : identifier;
      if (!username) {
        setFormError('Usuario o contraseña incorrectos.');
        setSubmitting(false);
        return;
      }
      await login({ username, password: values.password });
      // Al guardar el usuario en el estado, PublicOnly redirige al sistema.
    } catch (error) {
      setFormError(error.message);
      setSubmitting(false);
    }
  };

  const useDemoCredentials = () => {
    setValues(DEMO_CREDENTIALS);
    setErrors({});
    setFormError('');
    setPasswordWarning('');
  };

  return (
    <div className="login">
      <section className="login__hero" aria-hidden="true">
        <span className="login__circle login__circle--large" />
        <span className="login__circle login__circle--small" />
        <div className="login__brand">
          <span className="logo-mark">
            <GraduationCap size={24} />
          </span>
          <span className="login__brand-name">Control Alumnos</span>
        </div>
        <h2 className="login__headline">Gestiona la información de los estudiantes</h2>
      </section>

      <section className="login__panel">
        <div className="login__card">
          <header className="login__header">
            <h1 className="login__title">Bienvenido</h1>
            <p className="login__subtitle">Inicia sesión para continuar</p>
          </header>

          <form className="form" onSubmit={handleSubmit} noValidate>
            {formError && <Alert type="error">{formError}</Alert>}

            <TextField
              label="Correo institucional o usuario"
              name="username"
              type="text"
              icon={Mail}
              value={values.username}
              error={errors.username}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="23160845@itoaxaca.edu.mx"
              autoComplete="username"
              autoFocus
            />

            <TextField
              label="Contraseña"
              name="password"
              type={showPassword ? 'text' : 'password'}
              icon={Lock}
              value={values.password}
              error={errors.password}
              hint={passwordWarning}
              hintTone="warning"
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="••••••••••"
              autoComplete="current-password"
              trailing={
                <button
                  type="button"
                  className="field__toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              }
            />

            <div className="login__link-row">
              <button type="button" className="login__link">
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
              {submitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="login__demo">
            Prueba con usuario emilys / emilyspass.{' '}
            <button type="button" className="link-button" onClick={useDemoCredentials}>
              llenar datos
            </button>
          </p>
        </div>
      </section>
    </div>
  );
}
