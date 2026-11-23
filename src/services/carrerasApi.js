// llamadas reales al backend para el crud de carreras (/api/admin/carreras).
// aqui se traduce entre lo que usa la pantalla y lo que usa el backend.
import { backendRequest } from './api.js';
import { PAGE_SIZE } from '../utils/academico.js';

// misma clave con la que AuthContext guarda la sesion en el navegador
const SESSION_KEY = 'control-alumnos:session';

// saca el jwt de la sesion guardada para mandarlo en el encabezado authorization
function getToken() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY))?.token;
  } catch {
    return undefined;
  }
}

// convierte lo que devuelve el backend a la forma que espera la tabla
const aFila = (c) => ({
  id: c.id,
  clave: c.clave,
  nombre: c.nombre,
  duracion: `${c.duracionSemestres} semestres`,
  alumnos: c.alumnos ?? 0,
  activa: c.activa,
});

// convierte los valores del formulario a lo que pide el backend
// (el select de duracion trae texto como "9 semestres", saco el numero)
const aPeticion = (v) => ({
  clave: v.clave,
  nombre: v.nombre,
  duracionSemestres: parseInt(v.duracion, 10),
});

// pide una pagina al servidor. la pantalla cuenta desde 1 y spring desde 0, por eso page - 1
function pedirPagina(page, q, filters) {
  const query = new URLSearchParams({ page: page - 1, size: PAGE_SIZE, q: q.trim() });
  const duracion = parseInt(filters.duracion, 10);
  if (duracion) query.set('duracion', duracion);
  return backendRequest(`/admin/carreras?${query}`, { token: getToken() });
}

// lista una pagina de carreras (la paginacion, la busqueda y los filtros los hace el servidor)
export async function list({ page = 1, q = '', ...filters }) {
  let res = await pedirPagina(page, q, filters);
  // si borre el ultimo registro de la ultima pagina, pido la ultima pagina que si existe
  if (res.items.length === 0 && res.total > 0 && page > 1) {
    res = await pedirPagina(res.totalPages, q, filters);
  }
  return {
    items: res.items.map(aFila),
    total: res.total,
    page: res.page + 1,
    totalPages: Math.max(1, res.totalPages),
  };
}

export function create(values) {
  return backendRequest('/admin/carreras', {
    method: 'POST',
    token: getToken(),
    body: JSON.stringify(aPeticion(values)),
  }).then(aFila);
}

export function update(id, values) {
  return backendRequest(`/admin/carreras/${id}`, {
    method: 'PUT',
    token: getToken(),
    body: JSON.stringify(aPeticion(values)),
  }).then(aFila);
}

export function remove(id) {
  return backendRequest(`/admin/carreras/${id}`, { method: 'DELETE', token: getToken() });
}