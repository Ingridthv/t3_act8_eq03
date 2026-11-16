import { useState } from 'react';
import Alert from '../ui/Alert.jsx';
import { SelectField, TextField } from '../ui/TextField.jsx';
import { validateField, validateFields } from '../../utils/entities.js';

// Formulario genérico: se arma con la lista de campos de cada catálogo.
// Los errores aparecen debajo de cada campo (sin alert del navegador).
export default function EntityForm({ fields, mode, initialValues, options, note, submitLabel, submitting, serverError, onSubmit, onCancel }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((cur) => ({ ...cur, [name]: '' }));
  };
  const handleBlur = (e) => {
    const field = fields.find((f) => f.name === e.target.name);
    if (field) setErrors((cur) => ({ ...cur, [field.name]: validateField(field, values) }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    const found = validateFields(fields, values);
    setErrors(found);
    if (Object.keys(found).length === 0) onSubmit(values);
  };

  const renderField = (f) => {
    const common = { name: f.name, label: f.label, value: values[f.name], error: errors[f.name], onChange: handleChange, onBlur: handleBlur };
    if (f.type === 'select') {
      const list = typeof f.options === 'string' ? (options[f.options] ?? []) : f.options;
      return (
        <SelectField key={f.name} {...common} disabled={mode === 'edit' && f.lockOnEdit}>
          <option value="">{f.placeholder ?? 'Selecciona'}</option>
          {list.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </SelectField>
      );
    }
    return (
      <TextField key={f.name} {...common} type={f.type ?? 'text'} placeholder={f.placeholder} autoComplete="off"
        {...(f.type === 'number' ? { step: '0.1', min: f.rules?.min, max: f.rules?.max } : {})} />
    );
  };

  // Los campos marcados con half se acomodan de dos en dos.
  const blocks = [];
  for (let i = 0; i < fields.length; i += 1) {
    if (fields[i].half && fields[i + 1]?.half) {
      blocks.push(<div className="form__row" key={fields[i].name}>{renderField(fields[i])}{renderField(fields[i + 1])}</div>);
      i += 1;
    } else blocks.push(renderField(fields[i]));
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      {blocks}
      {note && mode === 'create' && <Alert type="info">{note}</Alert>}
      {serverError && <Alert type="error">{serverError}</Alert>}
      <div className="form__actions">
        <button type="button" className="btn btn--secondary" onClick={onCancel} disabled={submitting}>Cancelar</button>
        <button type="submit" className="btn btn--primary" disabled={submitting}>{submitting ? 'Guardando...' : submitLabel}</button>
      </div>
    </form>
  );
}
