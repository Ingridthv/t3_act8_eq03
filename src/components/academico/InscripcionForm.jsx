import { useEffect, useState } from 'react';
import Alert from '../ui/Alert.jsx';
import { SelectField, TextField } from '../ui/TextField.jsx';
import { validateField } from '../../utils/entities.js';
import { SEMESTERS } from '../../utils/users.js';

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Alta de alumno + inscripción en un solo paso (o inscripción de un alumno ya registrado).
export default function InscripcionForm({ options, submitting, serverError, onSubmit, onCancel }) {
  const [modo, setModo] = useState('nuevo');
  const [values, setValues] = useState({
    nombre: '', contactEmail: '', phone: '', carrera: '', semestre: '1', alumnoId: '',
    // el periodo actual viene marcado desde la base de datos
    periodo: (options.periodos ?? []).find((o) => o.actual)?.value ?? '', fecha: today(),
  });
  const [errors, setErrors] = useState({});

  // si las opciones llegan después de abrir el formulario, se preselecciona el periodo actual
  useEffect(() => {
    const actual = (options.periodos ?? []).find((o) => o.actual)?.value;
    if (actual) setValues((v) => (v.periodo ? v : { ...v, periodo: actual }));
  }, [options.periodos]);

  const fields = {
    nombre: {
      name: 'nombre', label: 'Nombre completo',
      rules: { required: true, minLen: 5, maxLen: 80, custom: (v) => (v.split(/\s+/).length < 2 ? 'Escribe el nombre y los apellidos.' : '') },
      requiredMsg: 'Escribe el nombre completo.',
    },
    contactEmail: { name: 'contactEmail', label: 'Correo de contacto (recibe las credenciales)', rules: { required: true, email: true }, requiredMsg: 'Escribe el correo de contacto.' },
    phone: { name: 'phone', label: 'Celular (opcional, para SMS y WhatsApp)', rules: { pattern: /^\+?\d{10,14}$/, patternMsg: 'Escribe de 10 a 14 dígitos, por ejemplo +525512345678.' } },
    carrera: { name: 'carrera', label: 'Carrera', type: 'select', rules: { required: true }, requiredMsg: 'Selecciona una carrera.' },
    semestre: { name: 'semestre', label: 'Semestre', type: 'select', rules: { required: true }, requiredMsg: 'Selecciona el semestre.' },
    alumnoId: { name: 'alumnoId', label: 'Alumno', type: 'select', rules: { required: true }, requiredMsg: 'Selecciona un alumno.' },
    periodo: { name: 'periodo', label: 'Periodo', type: 'select', rules: { required: true }, requiredMsg: 'Selecciona un periodo.' },
    fecha: { name: 'fecha', label: 'Fecha de inscripción', type: 'date', rules: { required: true }, requiredMsg: 'Selecciona la fecha.' },
  };
  const active = (modo === 'nuevo'
    ? ['nombre', 'contactEmail', 'phone', 'carrera', 'semestre', 'periodo', 'fecha']
    : ['alumnoId', 'periodo', 'fecha']).map((n) => fields[n]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
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
          <TextField {...common('nombre')} placeholder="Ej. Ana Martínez López" autoComplete="off" />
          <TextField {...common('contactEmail')} type="email" placeholder="correo.personal@gmail.com" autoComplete="off" />
          <TextField {...common('phone')} placeholder="Ej. +525512345678" autoComplete="off" />
          <div className="form__row">
            <SelectField {...common('carrera')}>
              <option value="">Selecciona una carrera</option>
              {(options.carreras ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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
        <Alert type="info">Al guardar, el sistema le asigna su matrícula, crea su cuenta (usuario: matrícula@itoaxaca.edu.mx) y envía su usuario y contraseña temporal al correo de contacto. Después de inscribirlo, asígnale sus materias con el botón de materias (libro) de su fila.</Alert>
      )}
      {serverError && <Alert type="error">{serverError}</Alert>}

      <div className="form__actions">
        <button type="button" className="btn btn--secondary" onClick={onCancel} disabled={submitting}>Cancelar</button>
        <button type="submit" className="btn btn--primary" disabled={submitting}>{submitting ? 'Guardando...' : 'Guardar inscripción'}</button>
      </div>
    </form>
  );
}
