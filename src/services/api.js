// Todas las llamadas a la API (DummyJSON) viven aquí.
// Los componentes nunca usan fetch directamente.
const BASE_URL = 'https://dummyjson.com';

const USER_FIELDS = 'firstName,lastName,email,age,image,role,username,company,address';

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError(
      'No se pudo conectar con el servidor. Revisa tu conexión a internet e inténtalo de nuevo.'
    );
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new ApiError(
      data?.message || `El servidor respondió con el error ${response.status}.`,
      response.status
    );
  }
  return data;
}

/* ---------- Autenticación (backend Spring Boot + PostgreSQL) ---------- */

// En local: http://localhost:8080/api. En el VPS se define VITE_API_URL al compilar.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

async function backendRequest(path, { token, ...options } = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...options,
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Inténtalo de nuevo en unos minutos.');
  }

  let data = null;
  if (response.status !== 204) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    // El backend responde siempre { status, error, message, errors? }
    const fieldError = data?.errors ? Object.values(data.errors)[0] : null;
    throw new ApiError(
      fieldError || data?.message || `El servidor respondió con el error ${response.status}.`,
      response.status
    );
  }
  return data;
}

export function loginRequest({ correo, password }) {
  return backendRequest('/auth/login', { method: 'POST', body: JSON.stringify({ correo, password }) });
}

export function logoutRequest(token) {
  return backendRequest('/auth/logout', { method: 'POST', token });
}

/* ---------- Alumnos (usuarios de DummyJSON) ---------- */

export async function fetchAllUsers(signal) {
  const data = await request(`/users?limit=0&select=${USER_FIELDS}`, { signal });
  return data.users;
}

export function createUserRequest(payload) {
  return request('/users/add', { method: 'POST', body: JSON.stringify(payload) });
}

export function updateUserRequest(id, payload) {
  return request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export function deleteUserRequest(id) {
  return request(`/users/${id}`, { method: 'DELETE' });
}
