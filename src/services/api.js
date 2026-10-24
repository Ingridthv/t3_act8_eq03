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

/* ---------- Autenticación ---------- */

export async function loginRequest({ username, password }) {
  try {
    return await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, expiresInMins: 30 }),
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 400) {
      throw new ApiError('Usuario o contraseña incorrectos.', 400);
    }
    throw error;
  }
}

// El diseño pide "Correo institucional", pero DummyJSON inicia sesión con username.
// Si el usuario escribe un correo, se busca su username en la API y luego se hace el login.
export async function findUsernameByEmail(email) {
  const data = await request(`/users/filter?key=email&value=${encodeURIComponent(email)}&select=username`);
  return data.users?.[0]?.username ?? null;
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
