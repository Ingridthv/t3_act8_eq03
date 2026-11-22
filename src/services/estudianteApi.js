// llamadas reales al backend del modulo de estudiante (/api/estudiante/**).
// todo viene de la base de datos; el servidor pagina y filtra.
import { backendRequest } from './api.js';
import { PAGE_SIZE } from '../utils/academico.js';

// misma clave con la que AuthContext guarda la sesion en el navegador
const SESSION_KEY = 'control-alumnos:session';

function getToken() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY))?.token;
  } catch {
    return undefined;
  }
}

// GET con query string; los parametros vacios no se mandan
function get(path, params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v != null) query.set(k, v);
  });
  const qs = query.toString();
  return backendRequest(`/estudiante/${path}${qs ? `?${qs}` : ''}`, { token: getToken() });
}

// la pantalla cuenta paginas desde 1 y spring desde 0
const aPagina = (res) => ({
  items: res.items,
  total: res.total,
  page: res.page + 1,
  totalPages: Math.max(1, res.totalPages),
});

export const getResumen = () => get('resumen');
export const getPerfil = () => get('perfil');
export const getPeriodos = () => get('periodos');

export async function listMaterias({ page = 1, q = '', periodo = '', estatus = '' }) {
  return aPagina(await get('materias', { page: page - 1, size: PAGE_SIZE, q: q.trim(), periodo, estatus }));
}

export async function listCalificaciones({ page = 1, q = '', periodo = '', estatus = '', orden = 'desc' }) {
  return aPagina(await get('calificaciones', { page: page - 1, size: PAGE_SIZE, q: q.trim(), periodo, estatus, orden }));
}

// el historial es lo mismo pero del periodo mas antiguo al mas reciente
export const listHistorial = (params) => listCalificaciones({ ...params, orden: 'asc' });
