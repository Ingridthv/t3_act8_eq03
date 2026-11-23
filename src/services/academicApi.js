// API del administrador para las pantallas de catálogo (EntityPage).
// Todo viene del backend (Spring Boot + PostgreSQL): no hay datos simulados.
import * as adminApi from './adminApi.js';
import * as carrerasApi from './carrerasApi.js';

// opciones de los selects: [{ value, label }]
export const getOptions = (kind) => adminApi.options(kind);

// lista una página (la paginación, la búsqueda y los filtros los hace el servidor)
export function list(key, _ctx, { page = 1, q = '', ...filters }) {
  if (key === 'carreras') return carrerasApi.list({ page, q, ...filters });
  return adminApi.list(key, { page, q, ...filters });
}

export function create(key, _ctx, payload) {
  if (key === 'carreras') return carrerasApi.create(payload);
  return adminApi.create(key, payload);
}

export function update(key, _ctx, id, payload) {
  if (key === 'carreras') return carrerasApi.update(id, payload);
  return adminApi.update(key, id, payload);
}

export function remove(key, _ctx, id) {
  if (key === 'carreras') return carrerasApi.remove(id);
  return adminApi.remove(key, id);
}
