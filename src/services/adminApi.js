// llamadas reales al backend del administrador (/api/admin/**).
// aquí se traduce entre lo que usa la pantalla y lo que usa el backend.
// la paginación, la búsqueda y los filtros los hace el servidor.
import { backendRequest } from './api.js';
import { PAGE_SIZE } from '../utils/academico.js';

// misma clave con la que AuthContext guarda la sesión en el navegador
const SESSION_KEY = 'control-alumnos:session';

function getToken() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY))?.token;
  } catch {
    return undefined;
  }
}

const cap = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);
const low = (t) => (t ? String(t).toLowerCase() : '');

// cada catálogo: ruta del backend, filtros que se mandan, cómo se ve la fila y cómo se arma la petición
export const ADAPTERS = {
  docentes: {
    path: 'docentes',
    params: (f) => ({ carrera: f.carrera, estatus: low(f.estatus) }),
    row: (d) => ({
      id: d.id,
      clave: d.clave,
      nombre: d.nombre,
      apellidos: d.apellidos,
      nombreCompleto: `${d.nombre} ${d.apellidos}`.trim(),
      correo: d.correo,
      correoContacto: d.correo_contacto ?? '',
      telefono: d.telefono ?? '',
      materias: d.materias,
      estatus: cap(d.estatus),
    }),
    payload: (v) => ({
      clave: v.clave,
      nombre: v.nombre,
      apellidos: v.apellidos,
      correo: v.correo,
      correoContacto: v.correoContacto,
      telefono: v.telefono,
      estatus: low(v.estatus),
    }),
  },

  materias: {
    path: 'materias',
    params: (f) => ({ carrera: f.carrera, semestre: f.semestre, estatus: low(f.estatus) }),
    row: (m) => ({
      id: m.id,
      clave: m.clave,
      nombre: m.nombre,
      creditos: m.creditos,
      grupos: m.grupos,
      carrera: m.carrera,
      carreraId: String(m.carrera_id),
      semestre: m.semestre,
      estatus: m.activa ? 'Activa' : 'Inactiva',
    }),
    payload: (v) => ({
      clave: v.clave,
      nombre: v.nombre,
      creditos: Number(v.creditos),
      semestre: Number(v.semestre),
      carreraId: Number(v.carreraId),
    }),
  },

  grupos: {
    path: 'grupos',
    params: (f) => ({ carrera: f.carrera, docente: f.docente, periodo: f.periodo }),
    row: (g) => ({
      id: g.id,
      materiaId: g.materia_id,
      clave: g.clave,
      materia: g.materia,
      grupo: g.grupo,
      docenteId: g.docente_id,
      docente: g.docente,
      horario: g.horario ?? '—',
      cupo: g.cupo,
      alumnos: g.alumnos,
      periodo: g.periodo,
    }),
    payload: (v) => ({
      materiaId: v.materiaId,
      docenteId: v.docenteId,
      grupo: v.grupo,
      cupo: Number(v.cupo),
      horario: v.horario?.trim() || null,
    }),
  },

  periodos: {
    path: 'periodos',
    params: (f) => ({ anio: f.anio, estatus: low(f.estatus) }),
    row: (p) => ({
      id: p.id,
      nombre: p.nombre,
      anio: p.anio,
      tipo: p.tipo,
      inicio: p.fecha_inicio,
      fin: p.fecha_fin,
      alumnos: p.alumnos,
      estatus: p.es_actual ? 'Actual' : 'Cerrado',
    }),
    payload: (v) => ({
      tipo: v.tipo,
      anio: Number(v.anio),
      fechaInicio: v.inicio,
      fechaFin: v.fin,
      actual: v.estatus === 'Actual',
    }),
  },
};

ADAPTERS.usuarios = {
  path: 'usuarios',
  params: (f) => ({ rol: low(f.rol), estatus: low(f.estatus) }),
  row: (u) => ({
    id: u.id,
    nombre: u.nombre,
    correo: u.correo,
    correoContacto: u.correo_contacto ?? '',
    rol: cap(u.rol),
    acceso: u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : 'Nunca',
    estatus: u.activo ? 'Activo' : 'Inactivo',
  }),
  payload: (v) => ({
    nombre: v.nombre,
    correo: v.correo,
    correoContacto: v.correoContacto,
    rol: v.rol,
    estatus: v.estatus,
  }),
};

// "María Fernanda Soto Pérez" -> nombre de 2 palabras; "Ana Martínez López" -> nombre de 1 palabra
const separarNombre = (completo) => {
  const palabras = completo.trim().split(/\s+/);
  const corte = palabras.length >= 4 ? 2 : 1;
  return [palabras.slice(0, corte).join(' '), palabras.slice(corte).join(' ')];
};

ADAPTERS.inscripciones = {
  path: 'inscripciones',
  params: (f) => ({ carrera: f.carrera, periodo: f.periodo, estatus: low(f.estatus) }),
  row: (i) => ({
    id: i.id,
    alumnoId: i.alumno_id,
    periodoId: i.periodo_id,
    matricula: i.matricula,
    alumno: i.alumno,
    carrera: i.carrera,
    periodo: i.periodo,
    fecha: i.fecha_inscripcion,
    materias: i.materias,
    estatus: cap(i.estatus),
  }),
  // sirve para el formulario de edición y para el de alta (modo: 'nuevo' | 'existente')
  payload: (v) => {
    const base = { periodoId: Number(v.periodo), fecha: v.fecha, estatus: low(v.estatus || 'inscrito') };
    if (v.modo === 'nuevo') {
      const [nombre, apellidos] = separarNombre(v.nombre);
      return {
        ...base,
        estatus: 'inscrito',
        nuevoAlumno: {
          nombre,
          apellidos,
          correoContacto: v.contactEmail.trim(),
          telefono: (v.phone ?? '').trim(),
          carreraId: Number(v.carrera),
          semestre: Number(v.semestre),
        },
      };
    }
    return { ...base, alumnoId: v.alumnoId };
  },
};

ADAPTERS.calificaciones = {
  path: 'calificaciones',
  params: (f) => ({ materia: f.materia, parcial: f.parcial, periodo: f.periodo, estatus: low(f.estatus) }),
  row: (c) => ({
    id: c.id,
    alumnoId: c.alumno_id,
    materiaId: c.materia_id,
    matricula: c.matricula,
    alumno: c.alumno,
    materia: c.materia,
    periodo: c.periodo,
    parcial: c.parcial == null ? null : Number(c.parcial),
    final: c.final == null ? null : Number(c.final),
    estatus: cap(c.estatus),
  }),
  payload: (v) => ({
    alumnoId: v.alumnoId,
    materiaId: v.materiaId,
    tipo: v.tipo,
    calificacion: Number(v.calificacion),
  }),
};

export const esReal = (key) => key in ADAPTERS;

function pedir(key, page, q, filters) {
  const a = ADAPTERS[key];
  const query = new URLSearchParams({ page: page - 1, size: PAGE_SIZE, q: (q ?? '').trim() });
  Object.entries(a.params(filters)).forEach(([k, v]) => {
    if (v !== '' && v != null) query.set(k, v);
  });
  return backendRequest(`/admin/${a.path}?${query}`, { token: getToken() });
}

// lista una página (la pantalla cuenta desde 1 y Spring desde 0)
export async function list(key, { page = 1, q = '', ...filters }) {
  let res = await pedir(key, page, q, filters);
  // si se borró el último registro de la última página, se pide la última que sí existe
  if (res.items.length === 0 && res.total > 0 && page > 1) {
    res = await pedir(key, res.totalPages, q, filters);
  }
  return {
    items: res.items.map(ADAPTERS[key].row),
    total: res.total,
    page: res.page + 1,
    totalPages: Math.max(1, res.totalPages),
  };
}

export function create(key, values) {
  const a = ADAPTERS[key];
  return backendRequest(`/admin/${a.path}`, {
    method: 'POST',
    token: getToken(),
    body: JSON.stringify(a.payload(values)),
  }).then(a.row);
}

export function update(key, id, values) {
  const a = ADAPTERS[key];
  return backendRequest(`/admin/${a.path}/${id}`, {
    method: 'PUT',
    token: getToken(),
    body: JSON.stringify(a.payload(values)),
  }).then(a.row);
}

export function remove(key, id) {
  return backendRequest(`/admin/${ADAPTERS[key].path}/${id}`, { method: 'DELETE', token: getToken() });
}

// opciones de los selects: [{ value, label }]
export function options(kind) {
  return backendRequest(`/admin/opciones/${kind}`, { token: getToken() });
}

// resumen de Inicio: totales, promedio y alumnos recientes
export const resumen = () => backendRequest('/admin/resumen', { token: getToken() });

// reporte académico (tipo: 'todos' | 'actuales', periodo: id opcional)
export function reporte({ tipo = 'todos', periodo = '' }) {
  const query = new URLSearchParams({ tipo });
  if (periodo) query.set('periodo', periodo);
  return backendRequest(`/admin/reportes?${query}`, { token: getToken() });
}

/* ---------- materias (grupos) de una inscripción: las asigna el administrador ---------- */
export const materiasDeInscripcion = (id) => backendRequest(`/admin/inscripciones/${id}/materias`, { token: getToken() });
export const gruposDisponibles = (id) => backendRequest(`/admin/inscripciones/${id}/grupos-disponibles`, { token: getToken() });
export const asignarMateria = (id, grupoId) =>
  backendRequest(`/admin/inscripciones/${id}/materias`, { method: 'POST', token: getToken(), body: JSON.stringify({ grupoId }) });
export const quitarMateria = (id, cargaId) =>
  backendRequest(`/admin/inscripciones/${id}/materias/${cargaId}`, { method: 'DELETE', token: getToken() });
