// llamadas reales al backend del módulo de alumnos del administrador (/api/admin/alumnos).
// la paginación, la búsqueda y los filtros los hace el servidor.
import { backendRequest } from './api.js';
import { PAGE_SIZE } from '../utils/academico.js';

const SESSION_KEY = 'control-alumnos:session';

function getToken() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY))?.token;
  } catch {
    return undefined;
  }
}

// número estable (2 a 199) a partir del id, para elegir la foto ilustrativa de randomuser.me
const semilla = (id) => ([...String(id)].reduce((s, c) => s + c.charCodeAt(0), 0) % 198) + 2;

// convierte lo que devuelve el backend a la forma que usan la tabla y el formulario
export const aFila = (a) => {
  const seed = semilla(a.id);
  return {
    id: a.id,
    enrollment: a.matricula,
    firstName: a.nombre,
    lastName: a.apellidos,
    email: a.correo,
    contactEmail: a.correo_contacto ?? '',
    phone: a.telefono ?? '',
    career: a.carrera,
    careerId: String(a.carrera_id),
    semester: a.semestre,
    average: a.promedio == null ? '—' : Number(a.promedio).toFixed(1),
    status: a.estatus === 'baja' ? 'Baja' : a.estatus === 'egresado' ? 'Egresado' : 'Activo',
    postalCode: a.codigo_postal ?? '',
    state: a.estado ?? '',
    ingreso: a.anio_ingreso,
    photoSeed: seed,
    demoGender: seed % 2 === 0 ? 'female' : 'male',
  };
};

// convierte los valores del formulario a lo que pide el backend
const aPeticion = (v) => ({
  nombre: v.firstName.trim(),
  apellidos: v.lastName.trim(),
  correo: v.email.trim(),
  correoContacto: v.contactEmail.trim(),
  telefono: v.phone.trim(),
  carreraId: Number(v.career),
  semestre: Number(v.semester),
  estatus: String(v.status).toLowerCase(),
  codigoPostal: v.postalCode.trim(),
  estado: v.state.trim(),
});

function pedir({ page, q, career, semester, status, ingreso }) {
  const query = new URLSearchParams({ page: page - 1, size: PAGE_SIZE, q: (q ?? '').trim() });
  if (career) query.set('carrera', career);
  if (semester) query.set('semestre', semester);
  if (status) query.set('estatus', status.toLowerCase());
  if (ingreso) query.set('ingreso', ingreso);
  return backendRequest(`/admin/alumnos?${query}`, { token: getToken() });
}

export async function list(params) {
  let res = await pedir(params);
  // si se borró el último registro de la última página, se pide la última que sí existe
  if (res.items.length === 0 && res.total > 0 && params.page > 1) {
    res = await pedir({ ...params, page: res.totalPages });
  }
  return {
    items: res.items.map(aFila),
    total: res.total,
    page: res.page + 1,
    totalPages: Math.max(1, res.totalPages),
  };
}

export const get = (id) => backendRequest(`/admin/alumnos/${id}`, { token: getToken() }).then(aFila);

export const create = (values) =>
  backendRequest('/admin/alumnos', { method: 'POST', token: getToken(), body: JSON.stringify(aPeticion(values)) }).then(aFila);

export const update = (id, values) =>
  backendRequest(`/admin/alumnos/${id}`, { method: 'PUT', token: getToken(), body: JSON.stringify(aPeticion(values)) }).then(aFila);

export const remove = (id) => backendRequest(`/admin/alumnos/${id}`, { method: 'DELETE', token: getToken() });
