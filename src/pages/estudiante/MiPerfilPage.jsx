import { useState } from 'react';
import { Check } from 'lucide-react';
import EstatusTag from '../../components/estudiante/EstatusTag.jsx';
import Alert from '../../components/ui/Alert.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import LoadingState from '../../components/ui/LoadingState.jsx';
import { TextField } from '../../components/ui/TextField.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useServerList } from '../../hooks/useServerList.js';
import { changePasswordRequest } from '../../services/api.js';
import { getPerfil } from '../../services/estudianteApi.js';
import { initials } from '../../utils/academico.js';
import { PasswordField, validatePassword } from '../ConfiguracionPage.jsx';

const PARAMS = {};
const EMPTY = { actual: '', nueva: '', confirmar: '' };

// Mismas reglas que valida el backend (8+ caracteres, mayuscula, numero y caracter especial)
const REGLAS = [
  { texto: 'Mínimo 8 caracteres', ok: (v) => v.length >= 8 },
  { texto: 'Una mayúscula', ok: (v) => /[A-Z]/.test(v) },
  { texto: 'Un número', ok: (v) => /\d/.test(v) },
  { texto: 'Un carácter especial', ok: (v) => /[^A-Za-z0-9]/.test(v) },
];

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

export default function MiPerfilPage() {
  const { user, updateUser } = useAuth();
  const { data: perfil, loading, error, reload } = useServerList(getPerfil, PARAMS);

  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [visible, setVisible] = useState({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  if (loading && !perfil) return <LoadingState message="Cargando tu perfil..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

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
      // el backend verifica la contraseña actual, aplica las reglas, guarda el hash BCrypt y avisa por SMS
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

  const datos = [
    ['Nombre completo', perfil.nombreCompleto],
    ['Correo electrónico', perfil.correo],
    ['Matrícula', perfil.matricula],
    ['Carrera', perfil.carrera],
    ['Semestre actual', `${perfil.semestreActual}°`],
    ['Año de ingreso', perfil.anioIngreso],
  ];

  return (
    <div className="page">
      {notice && <Alert type={notice.type} onClose={() => setNotice(null)}>{notice.text}</Alert>}

      <section className="card">
        <h2 className="card__title">Mi perfil</h2>

        <div className="profile">
          <span className="avatar avatar--lg avatar--initials" aria-hidden="true">{initials(perfil.nombreCompleto)}</span>
          <div>
            <p className="profile__name">{perfil.nombreCompleto}</p>
            <p className="navbar__role">Matrícula {perfil.matricula} · {perfil.carrera}</p>
            <EstatusTag value={perfil.estatus} />
          </div>
        </div>

        <h3 className="card__subtitle">Datos personales</h3>
        <div className="form__row">
          {datos.map(([label, value]) => (
            <TextField key={label} label={label} value={String(value)} readOnly />
          ))}
        </div>

        <form className="form" onSubmit={handleSubmit} noValidate>
          <h3 className="card__subtitle">Cambiar contraseña</h3>
          <div className="form__row form__row--3">
            <PasswordField label="Contraseña actual" name="actual" value={values.actual} error={errors.actual}
              show={visible.actual} onToggle={() => toggle('actual')} onChange={handleChange} onBlur={handleBlur} />
            <PasswordField label="Nueva contraseña" name="nueva" value={values.nueva} error={errors.nueva}
              show={visible.nueva} onToggle={() => toggle('nueva')} onChange={handleChange} onBlur={handleBlur} />
            <PasswordField label="Confirmar nueva contraseña" name="confirmar" value={values.confirmar} error={errors.confirmar}
              show={visible.confirmar} onToggle={() => toggle('confirmar')} onChange={handleChange} onBlur={handleBlur} />
          </div>

          <ul className="pw-rules" aria-label="Reglas de la contraseña">
            {REGLAS.map((r) => (
              <li key={r.texto} className={`pw-rules__item${r.ok(values.nueva) ? ' pw-rules__item--ok' : ''}`}>
                <span className="pw-rules__dot" aria-hidden="true">{r.ok(values.nueva) && <Check size={10} />}</span>
                {r.texto}
              </li>
            ))}
          </ul>

          <div>
            <button type="submit" className="btn btn--primary" disabled={busy}>
              {busy ? 'Guardando...' : 'Actualizar contraseña'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
