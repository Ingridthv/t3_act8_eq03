// Todas las llamadas a la API (DummyJSON) viven aquí.
// Los componentes nunca usan fetch directamente.

const BASE_URL = 'https://dummyjson.com';

const USER_FIELDS = 'firstName,lastName,email,age,image,role,username,company,address';

// Error personalizado para las peticiones
export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Peticiones a DummyJSON
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

/* =========================================================
   AUTENTICACIÓN (Backend Spring Boot + PostgreSQL)
   ========================================================= */

// En local: http://localhost:8080/api
// En el VPS se define VITE_API_URL al compilar.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8089/api';

// Peticiones al backend
export async function backendRequest(path, { token, ...options } = {}) {
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
    throw new ApiError(
      'No se pudo conectar con el servidor. Inténtalo de nuevo en unos minutos.'
    );
  }

  let data = null;

  // Si el servidor responde 204, no hay contenido que leer
  if (response.status !== 204) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  // Revisar si la petición tuvo algún error
  if (!response.ok) {
    const fieldError = data?.errors
      ? Object.values(data.errors)[0]
      : null;

    throw new ApiError(
      fieldError ||
        data?.message ||
        `El servidor respondió con el error ${response.status}.`,
      response.status
    );
  }

  return data;
}

// Iniciar sesión
export function loginRequest({ correo, password }) {
  return backendRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ correo, password }),
  });
}

// Cerrar sesión
export function logoutRequest(token) {
  return backendRequest('/auth/logout', {
    method: 'POST',
    token,
  });
}

// Cambiar contraseña
export function changePasswordRequest(token, { actual, nueva }) {
  return backendRequest('/auth/cambiar-password', {
    method: 'POST',
    token,
    body: JSON.stringify({ actual, nueva }),
  });
}

// Recuperar contraseña
export function recoverPasswordRequest(correo) {
  return backendRequest('/auth/recuperar', {
    method: 'POST',
    body: JSON.stringify({ correo }),
  });
}

// Restablecer contraseña
export function resetPasswordRequest({ token, nueva }) {
  return backendRequest('/auth/restablecer', {
    method: 'POST',
    body: JSON.stringify({ token, nueva }),
  });
}

/* =========================================================
   ALUMNOS (Usuarios de DummyJSON)
   ========================================================= */

// Obtener todos los usuarios
export async function fetchAllUsers(signal) {
  const data = await request(
    `/users?limit=0&select=${USER_FIELDS}`,
    { signal }
  );

  return data.users;
}

// Crear usuario
export function createUserRequest(payload) {
  return request('/users/add', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Actualizar usuario
export function updateUserRequest(id, payload) {
  return request(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}


// Eliminar usuario
export function deleteUserRequest(id) {
  return request(`/users/${id}`, {
    method: 'DELETE',
  });
}

/* =========================================================
   DOCENTE (Backend Spring Boot)
   ========================================================= */

// Consulta los datos del docente que inició sesión
export function docentePerfilRequest(token) {
  return backendRequest('/docente/perfil', { token });
}

// Consulta los grupos asignados al docente
export function docenteGruposRequest(token) {
  return backendRequest('/docente/grupos', { token });
}

// Alumnos inscritos en un grupo del docente (requiere endpoint en el backend)
export function docenteAlumnosGrupoRequest(token, grupoId) {
  return backendRequest(`/docente/grupos/${grupoId}/alumnos`, { token });
}

// Guardar parcial y final de un alumno en un grupo (cargaId = carga académica)
export function docenteGuardarCalificacionRequest(token, cargaId, { parcial, final }) {
  return backendRequest(`/docente/calificaciones/${cargaId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify({ parcial, final }),
  });
}
