import { useState } from 'react';
import { Mail } from 'lucide-react';
import Alert from '../ui/Alert.jsx';
import { SelectField, TextField } from '../ui/TextField.jsx';
import { PERIODO_ACTUAL } from '../../utils/academico.js';
import { validateField } from '../../utils/entities.js';
import { CAREERS, SEMESTERS } from '../../utils/users.js';

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Alta de alumno + inscripción en un solo paso (o inscripción de un alumno ya registrado).
export default function InscripcionForm({ options, users, submitting, serverError, onSubmit, onCancel }) {
  const [modo, setModo] = useState('nuevo');
  const [values, setValues] = useState({
    matricula: '', nombre: '', carrera: '', semestre: '1', alumnoId: '', periodo: PERIODO_ACTUAL, fecha: today(),
  });
  const [errors, setErrors] = useState({});

  const fields = {
    matricula: {
      name: 'matricula', label: 'Matrícula',
      rules: {
        required: true, pattern: /^\d{8}$/, patternMsg: 'La matrícula debe tener 8 dígitos.',
        custom: (v) => (users.some((u) => String(u.enrollment) === v) ? 'Ya existe un alumno con esa matrícula.' : ''),
      },
      requiredMsg: 'Escribe la matrícula.',
    },
    nombre: {
      name: 'nombre', label: 'Nombre completo',
      rules: { required: true, minLen: 5, maxLen: 80, custom: (v) => (v.split(/\s+/).length < 2 ? 'Escribe el nombre y los apellidos.' : '') },
      requiredMsg: 'Escribe el nombre completo.',
    },
    carrera: { name: 'carrera', label: 'Carrera', type: 'select', rules: { required: true }, requiredMsg: 'Selecciona una carrera.' },
    semestre: { name: 'semestre', label: 'Semestre', type: 'select', rules: { required: true }, requiredMsg: 'Selecciona el semestre.' },
    alumnoId: { name: 'alumnoId', label: 'Alumno', type: 'select', rules: { required: true }, requiredMsg: 'Selecciona un alumno.' },
    periodo: { name: 'periodo', label: 'Periodo', type: 'select', rules: { required: true }, requiredMsg: 'Selecciona un periodo.' },
    fecha: { name: 'fecha', label: 'Fecha de inscripción', type: 'date', rules: { required: true }, requiredMsg: 'Selecciona la fecha.' },
  };
  const active = (modo === 'nuevo'
    ? ['matricula', 'nombre', 'carrera', 'semestre', 'periodo', 'fecha']
    : ['alumnoId', 'periodo', 'fecha']).map((n) => fields[n]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: name === 'matricula' ? value.replace(/\D/g, '').slice(0, 8) : value }));
    setErrors((cur) => ({ ...cur, [name]: '' }));
  };
  const handleBlur = (e) => {
    const f = fields[e.target.name];
    if (f) setErrors((cur) => ({ ...cur, [f.name]: validateField(f, values) }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    const found = {};
    active.forEach((f) => {
      const msg = validateField(f, values);
      if (msg) found[f.name] = msg;
    });
    setErrors(found);
    if (Object.keys(found).length === 0) onSubmit({ modo, ...values });
  };

  const common = (name) => ({ name, label: fields[name].label, value: values[name], error: errors[name], onChange: handleChange, onBlur: handleBlur });
  const periodSelect = (
    <SelectField {...common('periodo')}>
      <option value="">Selecciona un periodo</option>
      {(options.periodos ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </SelectField>
  );

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="segmented" role="tablist" aria-label="Tipo de alumno">
        {[['nuevo', 'Alumno nuevo'], ['existente', 'Alumno ya registrado']].map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={modo === id}
            className={`segmented__item${modo === id ? ' segmented__item--active' : ''}`}
            onClick={() => { setModo(id); setErrors({}); }} disabled={submitting}>
            {label}
          </button>
        ))}
      </div>

      {modo === 'nuevo' ? (
        <>
          <TextField {...common('matricula')} placeholder="Ej. 25160001" inputMode="numeric" autoComplete="off" />
          <TextField {...common('nombre')} placeholder="Ej. Ana Martínez López" autoComplete="off" />
          <TextField label="Correo institucional" icon={Mail} readOnly value={`${values.matricula || '________'}@itoaxaca.edu.mx`}
            hint="Se genera con la matrícula y es el usuario con el que entra al sistema." />
          <div className="form__row">
            <SelectField {...common('carrera')}>
              <option value="">Selecciona una carrera</option>
              {CAREERS.map((c) => <option key={c} value={c}>{c}</option>)}
            </SelectField>
            <SelectField {...common('semestre')}>
              {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
            </SelectField>
          </div>
        </>
      ) : (
        <SelectField {...common('alumnoId')}>
          <option value="">Selecciona un alumno</option>
          {(options.alumnos ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </SelectField>
      )}

      <div className="form__row">
        {periodSelect}
        <TextField {...common('fecha')} type="date" />
      </div>

      {modo === 'nuevo' && (
        <Alert type="info">Al guardar, el sistema crea la cuenta del alumno y le envía su usuario y una contraseña temporal por correo.</Alert>
      )}
      {serverError && <Alert type="error">{serverError}</Alert>}

      <div className="form__actions">
        <button type="button" className="btn btn--secondary" onClick={onCancel} disabled={submitting}>Cancelar</button>
        <button type="submit" className="btn btn--primary" disabled={submitting}>{submitting ? 'Guardando...' : 'Guardar inscripción'}</button>
      </div>
    </form>
  );
}
