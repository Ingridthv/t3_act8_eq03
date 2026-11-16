// Configuración de cada catálogo del administrador (columnas, filtros y formulario).
// Una sola pantalla genérica (EntityPage) los dibuja todos, igual que en Figma.
import { CAREERS, SEMESTERS } from './users.js';
import { formatDate, PERIODO_ACTUAL, periodoCorto } from './academico.js';

const strings = (arr) => arr.map((v) => ({ value: String(v), label: String(v) }));

export const tagTone = (value) => {
  if (['Activo', 'Activa', 'Actual', 'Inscrito', 'Aprobado'].includes(value)) return 'activo';
  if (['Baja', 'Inactiva', 'Inactivo', 'Reprobado'].includes(value)) return 'baja';
  if (value === 'Pendiente') return 'pendiente';
  if (['Cerrado', 'Licencia'].includes(value)) return 'neutro';
  return 'rol';
};

export const formatCell = (col, row) => {
  const v = row[col.key];
  if (col.format === 'date') return formatDate(v);
  if (col.format === 'periodo') return periodoCorto(v);
  if (col.format === 'grade') return v === null || v === undefined ? '—' : Number(v).toFixed(1);
  return v ?? '—';
};

/* ---------- Validación genérica (mensaje bajo cada campo) ---------- */

export function validateField(field, values) {
  const v = String(values[field.name] ?? '').trim();
  const r = field.rules ?? {};
  if (!v) {
    if (!r.required) return '';
    return field.requiredMsg ?? (field.type === 'select' ? 'Selecciona una opción.' : 'Este campo es obligatorio.');
  }
  if (r.minLen && v.length < r.minLen) return `Debe tener al menos ${r.minLen} caracteres.`;
  if (r.maxLen && v.length > r.maxLen) return `Debe tener máximo ${r.maxLen} caracteres.`;
  if (r.pattern && !r.pattern.test(v)) return r.patternMsg ?? 'El formato no es válido.';
  if (r.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Escribe un correo válido, por ejemplo nombre@correo.com.';
  if (field.type === 'number' || r.min !== undefined || r.max !== undefined) {
    const n = Number(v);
    if (Number.isNaN(n)) return 'Escribe un número válido.';
    if (r.integer && !Number.isInteger(n)) return 'Debe ser un número entero.';
    if (r.min !== undefined && n < r.min) return r.rangeMsg ?? `El valor mínimo es ${r.min}.`;
    if (r.max !== undefined && n > r.max) return r.rangeMsg ?? `El valor máximo es ${r.max}.`;
    if (r.decimals !== undefined && !new RegExp(`^\\d+(\\.\\d{1,${r.decimals}})?$`).test(v)) {
      return `Usa máximo ${r.decimals} decimal${r.decimals === 1 ? '' : 'es'}, por ejemplo 8.5.`;
    }
  }
  return r.custom ? r.custom(v, values) : '';
}

export const validateFields = (fields, values) => {
  const errors = {};
  fields.forEach((f) => {
    const msg = validateField(f, values);
    if (msg) errors[f.name] = msg;
  });
  return errors;
};

export const defaultToForm = (cfg, row) =>
  Object.fromEntries(cfg.fields.map((f) => [f.name, String(row[f.name] ?? f.default ?? '')]));

export const defaultToPayload = (cfg, values) =>
  Object.fromEntries(
    cfg.fields.map((f) => {
      const raw = String(values[f.name] ?? '').trim();
      if (f.type === 'number') return [f.name, Number(raw)];
      return [f.name, f.upper ? raw.toUpperCase() : raw];
    })
  );

const ESTATUS_REGISTRO = (list) => strings(list);

/* ---------- Catálogos ---------- */

export const ENTITIES = {
  materias: {
    singular: 'materia',
    title: 'Lista de materias',
    noun: 'materias',
    newLabel: '+ Nueva materia',
    createTitle: ['Nueva materia', 'Captura los datos de la materia para darla de alta'],
    editTitle: ['Editar materia', 'Modifica los datos de la materia'],
    saveLabel: 'Guardar materia',
    searchPlaceholder: 'Buscar por clave o materia',
    search: ['clave', 'nombre'],
    rowLabel: (r) => r.nombre,
    unique: [['clave', 'Ya existe una materia con esa clave.']],
    columns: [
      { key: 'clave', label: 'Clave' },
      { key: 'nombre', label: 'Materia', avatar: true, strong: true },
      { key: 'docente', label: 'Docente' },
      { key: 'creditos', label: 'Créditos' },
      { key: 'grupo', label: 'Grupo' },
      { key: 'estatus', label: 'Estatus', tag: true },
    ],
    filters: [
      { name: 'carrera', label: 'Carrera', wide: true, options: strings(CAREERS) },
      { name: 'semestre', label: 'Semestre', options: SEMESTERS.map((s) => ({ value: String(s), label: `Semestre ${s}` })) },
      { name: 'estatus', label: 'Estatus', options: ESTATUS_REGISTRO(['Activa', 'Inactiva']) },
    ],
    fields: [
      { name: 'clave', label: 'Clave', half: true, placeholder: 'Ej. SIS-101', upper: true, rules: { required: true, pattern: /^[A-Za-z]{3}-\d{3}$/, patternMsg: 'Usa el formato ABC-123 (3 letras, guion y 3 números).' }, requiredMsg: 'Escribe la clave.' },
      { name: 'creditos', label: 'Créditos', type: 'number', half: true, placeholder: 'Ej. 8', rules: { required: true, integer: true, min: 1, max: 12, rangeMsg: 'Los créditos deben estar entre 1 y 12.' }, requiredMsg: 'Escribe los créditos.' },
      { name: 'nombre', label: 'Nombre de la materia', placeholder: 'Ej. Programación Web', rules: { required: true, minLen: 3, maxLen: 60 }, requiredMsg: 'Escribe el nombre de la materia.' },
      { name: 'docente', label: 'Docente', type: 'select', options: 'docentes', placeholder: 'Selecciona un docente', rules: { required: true }, requiredMsg: 'Selecciona un docente.' },
      { name: 'carrera', label: 'Carrera', type: 'select', half: true, options: strings(CAREERS), placeholder: 'Selecciona una carrera', rules: { required: true }, requiredMsg: 'Selecciona una carrera.' },
      { name: 'grupo', label: 'Grupo', type: 'select', half: true, options: strings(['A', 'B', 'C', 'D']), placeholder: 'Selecciona', rules: { required: true }, requiredMsg: 'Selecciona el grupo.' },
    ],
  },

  calificaciones: {
    singular: 'calificación',
    title: 'Calificaciones del periodo',
    noun: 'calificaciones',
    newLabel: '+ Capturar calificación',
    createTitle: ['Capturar calificación', 'Registra la calificación de un alumno en una materia'],
    editTitle: ['Editar calificación', 'Modifica la calificación registrada'],
    saveLabel: 'Guardar calificación',
    searchPlaceholder: 'Buscar por alumno o matrícula',
    search: ['alumno', 'matricula'],
    rowLabel: (r) => `${r.alumno} en ${r.materia}`,
    defaults: { periodo: PERIODO_ACTUAL },
    columns: [
      { key: 'matricula', label: 'Matrícula' },
      { key: 'alumno', label: 'Alumno', avatar: true, strong: true },
      { key: 'materia', label: 'Materia' },
      { key: 'periodo', label: 'Periodo', format: 'periodo' },
      { key: 'parcial', label: 'Parcial', format: 'grade' },
      { key: 'final', label: 'Final', format: 'grade', strong: true },
      { key: 'estatus', label: 'Estatus', tag: true },
    ],
    filters: [
      { name: 'materia', label: 'Materia', wide: true, options: 'materias', field: 'materiaId' },
      {
        name: 'parcial', label: 'Parcial',
        options: [{ value: 'aprobatorio', label: 'Aprobatorio (6 o más)' }, { value: 'reprobatorio', label: 'Reprobatorio (menos de 6)' }],
        match: (row, v) => row.parcial !== null && (v === 'aprobatorio' ? row.parcial >= 6 : row.parcial < 6),
      },
      { name: 'periodo', label: 'Periodo', wide: true, options: 'periodos' },
      { name: 'estatus', label: 'Estatus', options: ESTATUS_REGISTRO(['Aprobado', 'Reprobado', 'Pendiente']) },
    ],
    fields: [
      { name: 'alumnoId', label: 'Alumno', type: 'select', options: 'alumnos', placeholder: 'Selecciona un alumno', lockOnEdit: true, rules: { required: true }, requiredMsg: 'Selecciona un alumno.' },
      { name: 'materiaId', label: 'Materia', type: 'select', options: 'materias', placeholder: 'Selecciona una materia', lockOnEdit: true, rules: { required: true }, requiredMsg: 'Selecciona una materia.' },
      { name: 'tipo', label: 'Parcial', type: 'select', half: true, options: strings(['Parcial 1', 'Final']), placeholder: 'Selecciona', rules: { required: true }, requiredMsg: 'Selecciona qué calificación capturas.' },
      { name: 'calificacion', label: 'Calificación', type: 'number', half: true, placeholder: 'Ej. 9.0', rules: { required: true, min: 0, max: 10, decimals: 1, rangeMsg: 'La calificación debe estar entre 0 y 10.' }, requiredMsg: 'Escribe la calificación.' },
    ],
    toForm: (row) => ({ alumnoId: String(row.alumnoId), materiaId: String(row.materiaId), tipo: 'Parcial 1', calificacion: row.parcial === null ? '' : String(row.parcial) }),
    toPayload: (v) => ({ alumnoId: Number(v.alumnoId), materiaId: Number(v.materiaId), tipo: v.tipo, calificacion: Number(v.calificacion) }),
  },

  inscripciones: {
    singular: 'inscripción',
    title: 'Inscripciones del periodo',
    noun: 'inscripciones',
    newLabel: '+ Inscribir alumno',
    createTitle: ['Inscribir alumno', 'Da de alta al alumno e inscríbelo a un periodo'],
    editTitle: ['Editar inscripción', 'Modifica los datos de la inscripción'],
    saveLabel: 'Guardar inscripción',
    searchPlaceholder: 'Buscar por alumno o matrícula',
    search: ['alumno', 'matricula'],
    rowLabel: (r) => r.alumno,
    defaults: { periodo: PERIODO_ACTUAL },
    columns: [
      { key: 'matricula', label: 'Matrícula' },
      { key: 'alumno', label: 'Alumno', avatar: true, strong: true },
      { key: 'carrera', label: 'Carrera' },
      { key: 'periodo', label: 'Periodo', format: 'periodo' },
      { key: 'fecha', label: 'Inscripción', format: 'date' },
      { key: 'estatus', label: 'Estatus', tag: true },
    ],
    filters: [
      { name: 'carrera', label: 'Carrera', wide: true, options: strings(CAREERS) },
      { name: 'periodo', label: 'Periodo', wide: true, options: 'periodos' },
      { name: 'estatus', label: 'Estatus', options: ESTATUS_REGISTRO(['Inscrito', 'Baja']) },
    ],
    fields: [
      { name: 'alumnoId', label: 'Alumno', type: 'select', options: 'alumnos', placeholder: 'Selecciona un alumno', lockOnEdit: true, rules: { required: true }, requiredMsg: 'Selecciona un alumno.' },
      { name: 'periodo', label: 'Periodo', type: 'select', options: 'periodos', placeholder: 'Selecciona un periodo', rules: { required: true }, requiredMsg: 'Selecciona un periodo.' },
      { name: 'fecha', label: 'Fecha de inscripción', type: 'date', half: true, rules: { required: true }, requiredMsg: 'Selecciona la fecha.' },
      { name: 'estatus', label: 'Estatus', type: 'select', half: true, options: ESTATUS_REGISTRO(['Inscrito', 'Baja']), placeholder: 'Selecciona', default: 'Inscrito', rules: { required: true } },
    ],
    toPayload: (v) => ({ alumnoId: Number(v.alumnoId), periodo: v.periodo, fecha: v.fecha, estatus: v.estatus }),
  },

  periodos: {
    singular: 'periodo',
    title: 'Periodos escolares',
    noun: 'periodos',
    newLabel: '+ Nuevo periodo',
    createTitle: ['Nuevo periodo', 'Captura los datos del periodo escolar'],
    editTitle: ['Editar periodo', 'Modifica los datos del periodo'],
    saveLabel: 'Guardar periodo',
    searchPlaceholder: 'Buscar por periodo',
    search: ['nombre'],
    rowLabel: (r) => r.nombre,
    unique: [['nombre', 'Ya existe un periodo con ese nombre.']],
    columns: [
      { key: 'nombre', label: 'Periodo', strong: true },
      { key: 'inicio', label: 'Fecha de inicio', format: 'date' },
      { key: 'fin', label: 'Fecha de fin', format: 'date' },
      { key: 'alumnos', label: 'Alumnos inscritos' },
      { key: 'estatus', label: 'Estatus', tag: true },
    ],
    filters: [
      { name: 'anio', label: 'Año', options: strings([2025, 2026]) },
      { name: 'estatus', label: 'Estatus', options: ESTATUS_REGISTRO(['Actual', 'Cerrado']) },
    ],
    fields: [
      { name: 'nombre', label: 'Nombre del periodo', placeholder: 'Ej. Enero-Julio 2027', rules: { required: true, minLen: 5, maxLen: 40 }, requiredMsg: 'Escribe el nombre del periodo.' },
      { name: 'inicio', label: 'Fecha de inicio', type: 'date', half: true, rules: { required: true }, requiredMsg: 'Selecciona la fecha de inicio.' },
      {
        name: 'fin', label: 'Fecha de fin', type: 'date', half: true,
        rules: { required: true, custom: (v, values) => (values.inicio && v <= values.inicio ? 'La fecha de fin debe ser posterior al inicio.' : '') },
        requiredMsg: 'Selecciona la fecha de fin.',
      },
    ],
  },

  carreras: {
    singular: 'carrera',
    title: 'Catálogo de carreras',
    noun: 'carreras',
    newLabel: '+ Nueva carrera',
    createTitle: ['Nueva carrera', 'Captura los datos de la carrera'],
    editTitle: ['Editar carrera', 'Modifica los datos de la carrera'],
    saveLabel: 'Guardar carrera',
    searchPlaceholder: 'Buscar por carrera o clave',
    search: ['clave', 'nombre'],
    rowLabel: (r) => r.nombre,
    unique: [['clave', 'Ya existe una carrera con esa clave.'], ['nombre', 'Ya existe una carrera con ese nombre.']],
    columns: [
      { key: 'clave', label: 'Clave' },
      { key: 'nombre', label: 'Carrera', strong: true },
      { key: 'duracion', label: 'Duración' },
      { key: 'alumnos', label: 'Alumnos' },
      { key: 'coordinador', label: 'Coordinador' },
    ],
    filters: [{ name: 'duracion', label: 'Duración', options: strings(['8 semestres', '9 semestres', '10 semestres']) }],
    fields: [
      { name: 'clave', label: 'Clave', half: true, upper: true, placeholder: 'Ej. ISC', rules: { required: true, pattern: /^[A-Za-z]{2,4}$/, patternMsg: 'Usa de 2 a 4 letras.' }, requiredMsg: 'Escribe la clave.' },
      { name: 'duracion', label: 'Duración', type: 'select', half: true, options: strings(['8 semestres', '9 semestres', '10 semestres']), placeholder: 'Selecciona', rules: { required: true }, requiredMsg: 'Selecciona la duración.' },
      { name: 'nombre', label: 'Nombre de la carrera', placeholder: 'Ej. Ing. en Sistemas', rules: { required: true, minLen: 5, maxLen: 60 }, requiredMsg: 'Escribe el nombre de la carrera.' },
      { name: 'coordinador', label: 'Coordinador', type: 'select', options: 'docentes', placeholder: 'Selecciona un docente', rules: { required: true }, requiredMsg: 'Selecciona un coordinador.' },
    ],
  },

  docentes: {
    singular: 'docente',
    title: 'Lista de docentes',
    noun: 'docentes',
    newLabel: '+ Nuevo docente',
    createTitle: ['Nuevo docente', 'Captura los datos del docente para darlo de alta'],
    editTitle: ['Editar docente', 'Modifica los datos del docente'],
    saveLabel: 'Guardar docente',
    searchPlaceholder: 'Buscar por nombre o clave',
    search: ['nombre', 'clave'],
    rowLabel: (r) => r.nombre,
    unique: [['clave', 'Ya existe un docente con esa clave.'], ['correo', 'Ya existe un docente con ese correo.']],
    columns: [
      { key: 'clave', label: 'Clave' },
      { key: 'nombre', label: 'Docente', avatar: true, strong: true },
      { key: 'correo', label: 'Correo' },
      { key: 'materias', label: 'Materias' },
      { key: 'estatus', label: 'Estatus', tag: true },
    ],
    filters: [
      { name: 'carrera', label: 'Carrera', wide: true, options: strings(CAREERS) },
      { name: 'estatus', label: 'Estatus', options: ESTATUS_REGISTRO(['Activo', 'Licencia']) },
    ],
    fields: [
      { name: 'clave', label: 'Clave', half: true, upper: true, placeholder: 'Ej. DOC-019', rules: { required: true, pattern: /^[A-Za-z]{3}-\d{3}$/, patternMsg: 'Usa el formato DOC-001.' }, requiredMsg: 'Escribe la clave.' },
      { name: 'estatus', label: 'Estatus', type: 'select', half: true, options: ESTATUS_REGISTRO(['Activo', 'Licencia']), placeholder: 'Selecciona', default: 'Activo', rules: { required: true } },
      { name: 'nombre', label: 'Nombre completo', placeholder: 'Ej. Ricardo Salinas Ortiz', rules: { required: true, minLen: 5, maxLen: 80 }, requiredMsg: 'Escribe el nombre completo.' },
      { name: 'correo', label: 'Correo institucional', type: 'email', placeholder: 'nombre@controlalumnos.edu', rules: { required: true, email: true }, requiredMsg: 'Escribe el correo.' },
      { name: 'carrera', label: 'Carrera', type: 'select', options: strings(CAREERS), placeholder: 'Selecciona una carrera', rules: { required: true }, requiredMsg: 'Selecciona una carrera.' },
    ],
  },

  usuarios: {
    singular: 'usuario',
    title: 'Usuarios del sistema',
    noun: 'usuarios',
    newLabel: '+ Nuevo usuario',
    createTitle: ['Nuevo usuario', 'Captura los datos del usuario para darlo de alta'],
    editTitle: ['Editar usuario', 'Modifica los datos del usuario'],
    saveLabel: 'Guardar usuario',
    searchPlaceholder: 'Buscar por nombre o correo',
    search: ['nombre', 'correo'],
    rowLabel: (r) => r.nombre,
    unique: [['correo', 'Ya existe un usuario con ese correo.']],
    createNote: 'Al guardar, el sistema enviará al correo del usuario su usuario y una contraseña temporal.',
    createdMessage: 'Usuario creado. Se enviarán las credenciales a su correo.',
    columns: [
      { key: 'nombre', label: 'Usuario', avatar: true, strong: true },
      { key: 'correo', label: 'Correo' },
      { key: 'rol', label: 'Rol', tag: true },
      { key: 'acceso', label: 'Último acceso' },
      { key: 'estatus', label: 'Estatus', tag: true },
    ],
    filters: [
      { name: 'rol', label: 'Rol', options: strings(['Administrador', 'Docente', 'Estudiante']) },
      { name: 'estatus', label: 'Estatus', options: ESTATUS_REGISTRO(['Activo', 'Inactivo']) },
    ],
    fields: [
      { name: 'nombre', label: 'Nombre completo', placeholder: 'Ej. Ana Martínez López', rules: { required: true, minLen: 5, maxLen: 80 }, requiredMsg: 'Escribe el nombre completo.' },
      { name: 'correo', label: 'Correo institucional', type: 'email', placeholder: 'nombre@controlalumnos.edu', rules: { required: true, email: true }, requiredMsg: 'Escribe el correo.' },
      { name: 'rol', label: 'Rol', type: 'select', half: true, options: strings(['Administrador', 'Docente', 'Estudiante']), placeholder: 'Selecciona un rol', rules: { required: true }, requiredMsg: 'Selecciona un rol.' },
      { name: 'estatus', label: 'Estatus', type: 'select', half: true, options: ESTATUS_REGISTRO(['Activo', 'Inactivo']), placeholder: 'Selecciona', default: 'Activo', rules: { required: true } },
    ],
  },
};
