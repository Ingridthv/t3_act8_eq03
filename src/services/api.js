// Todas las llamadas al backend (Spring Boot) viven aquí.
// Los componentes nunca usan fetch directamente.

// Error personalizado para las peticiones
export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
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

// arma "?a=1&b=2" sin mandar los parámetros vacíos
function queryString(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v != null) query.set(k, v);
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

// la pantalla cuenta las páginas desde 1 y Spring desde 0
function aPagina(res) {
  return { ...res, page: res.page + 1, totalPages: Math.max(1, res.totalPages) };
}

// Mis grupos paginados y filtrados en el servidor
export async function docenteGruposPaginaRequest(token, { q, periodo, carrera, page = 1, size = 10 }) {
  const res = await backendRequest(
    `/docente/grupos/pagina${queryString({ q, periodo, carrera, page: page - 1, size })}`,
    { token }
  );
  return aPagina(res);
}

// Opciones de los filtros de Mis grupos (periodos y carreras)
export function docenteFiltrosRequest(token) {
  return backendRequest('/docente/grupos/filtros', { token });
}

// Alumnos de un grupo del docente (búsqueda, estatus y página en el servidor)
export async function docenteAlumnosGrupoRequest(token, grupoId, { q, estatus, page = 1, size = 10 } = {}) {
  const res = await backendRequest(
    `/docente/grupos/${grupoId}/alumnos${queryString({ q, estatus, page: page - 1, size })}`,
    { token }
  );
  return aPagina(res);
}

// Reporte del grupo: cifras generales + alumnos con promedio menor a 7.0
export async function docenteReporteRequest(token, grupoId, { page = 1, size = 10 } = {}) {
  const res = await backendRequest(
    `/docente/grupos/${grupoId}/reporte${queryString({ page: page - 1, size })}`,
    { token }
  );
  return { ...res, alumnos: aPagina(res.alumnos) };
}

// Guardar parcial y final de un alumno en un grupo (cargaId = carga académica)
export function docenteGuardarCalificacionRequest(token, cargaId, { parcial, final }) {
  return backendRequest(`/docente/calificaciones/${cargaId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify({ parcial, final }),
  });
}
