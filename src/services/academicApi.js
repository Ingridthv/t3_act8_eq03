// API académica.
// Las carreras se conectan al backend Spring Boot.
// Los demás catálogos siguen funcionando con datos simulados.

import {
  buildCalificaciones,
  buildInscripciones,
  buildUsuarios,
  PAGE_SIZE,
  PERIODO_ACTUAL,
  PERIODOS,
  periodoNombre,
  seedCarreras,
  seedDocentes,
  seedMaterias,
  seedPeriodos,
  statusFromFinal,
} from '../utils/academico.js';

import { ENTITIES } from '../utils/entities.js';
import * as carrerasApi from './carrerasApi.js';

const LATENCY_MS = 250;
const wait = (ms = LATENCY_MS) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Error personalizado para las operaciones académicas
export class AcademicError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'AcademicError';
    this.status = status;
  }
}

/* ---------- Base de datos en memoria ---------- */

const S = {};
let known = null;

// Inicializar los datos de los catálogos
function ensure(users) {
  if (!S.docentes) {
    S.docentes = seedDocentes();
    S.materias = seedMaterias(S.docentes);
    S.carreras = seedCarreras(S.docentes);
    S.periodos = seedPeriodos();
  }

  if (!known) {
    S.calificaciones = buildCalificaciones(users, S.materias);
    S.inscripciones = buildInscripciones(users);
    S.usuarios = buildUsuarios(users, S.docentes);

    known = new Set(users.map((u) => u.id));

    return S;
  }

  // Agregar alumnos nuevos a los catálogos
  users.filter((u) => !known.has(u.id)).forEach((u) => {
    S.usuarios.unshift({
      id: nextId(S.usuarios),
      nombre: `${u.firstName} ${u.lastName}`.trim(),
      correo: `${u.enrollment}@escuela.edu.mx`,
      rol: 'Estudiante',
      acceso: 'Nunca',
      estatus: 'Activo',
      alumnoId: u.id,
    });

    known.add(u.id);
  });

  // Quitar los datos relacionados con alumnos eliminados
  const current = new Set(users.map((u) => u.id));

  [...known]
    .filter((id) => !current.has(id))
    .forEach((id) => {
      S.calificaciones = S.calificaciones.filter(
        (c) => c.alumnoId !== id
      );

      S.inscripciones = S.inscripciones.filter(
        (i) => i.alumnoId !== id
      );

      S.usuarios = S.usuarios.filter(
        (x) => x.alumnoId !== id
      );

      known.delete(id);
    });

  return S;
}

// Funciones auxiliares
const norm = (s) => String(s ?? '').toLowerCase();

const nextId = (rows) =>
  rows.reduce(
    (max, r) => Math.max(max, Number(r.id) || 0),
    0
  ) + 1;

// Obtener los datos adicionales de cada catálogo
function decorate(key, users) {
  if (key === 'carreras') {
    return S.carreras.map((c) => ({
      ...c,
      alumnos: users.filter((u) => u.career === c.nombre).length,
    }));
  }

  if (key === 'docentes') {
    return S.docentes.map((d) => ({
      ...d,
      materias: S.materias.filter(
        (m) => m.docente === d.nombre
      ).length,
    }));
  }

  if (key === 'periodos') {
    return S.periodos.map((p) => {
      const n = S.inscripciones.filter(
        (i) => i.periodo === p.id && i.estatus === 'Inscrito'
      ).length;

      return {
        ...p,
        alumnos: n || p.base || 0,
      };
    });
  }

  return S[key];
}

/* ---------- Opciones para los selects ---------- */

export async function getOptions(kind, { users }) {
  ensure(users);

  if (kind === 'materias') {
    return S.materias.map((m) => ({
      value: String(m.id),
      label: `${m.nombre} (${m.clave})`,
    }));
  }

  if (kind === 'docentes') {
    return S.docentes.map((d) => ({
      value: d.nombre,
      label: d.nombre,
    }));
  }

  if (kind === 'alumnos') {
    return users.map((u) => ({
      value: String(u.id),
      label: `${u.firstName} ${u.lastName} (${u.enrollment})`,
    }));
  }

  if (kind === 'periodos') {
    return S.periodos.map((p) => ({
      value: p.id,
      label: p.nombre,
    }));
  }

  return [];
}

/* ---------- CRUD genérico ---------- */

// Obtener los registros de cada catálogo
export async function list(
  key,
  { users },
  { page = 1, q = '', ...filters }
) {
  // Las carreras se consultan directamente al backend
  if (key === 'carreras') {
    return carrerasApi.list({ page, q, ...filters });
  }

  await wait();
  ensure(users);

  const cfg = ENTITIES[key];
  const term = norm(q).trim();

  const rows = decorate(key, users).filter(
    (row) =>
      (!term ||
        cfg.search.some((f) => norm(row[f]).includes(term))) &&
      cfg.filters.every((f) => {
        const v = filters[f.name];

        if (!v) return true;

        return f.match
          ? f.match(row, v)
          : String(row[f.field ?? f.name]) === String(v);
      })
  );

  return paginate(rows, page);
}

// Dividir los registros en páginas
function paginate(rows, page, limit = PAGE_SIZE) {
  const totalPages = Math.max(
    1,
    Math.ceil(rows.length / limit)
  );

  const current = Math.min(
    Math.max(1, Number(page) || 1),
    totalPages
  );

  return {
    items: rows.slice(
      (current - 1) * limit,
      current * limit
    ),
    total: rows.length,
    page: current,
    totalPages,
  };
}

// Normalizar los datos antes de guardarlos
function normalize(key, payload, users) {
  if (key === 'inscripciones') {
    const u = users.find(
      (x) => x.id === payload.alumnoId
    );

    if (!u) {
      throw new AcademicError(
        'El alumno seleccionado ya no existe.',
        404
      );
    }

    return {
      ...payload,
      matricula: u.enrollment,
      alumno: `${u.firstName} ${u.lastName}`.trim(),
      carrera: u.career,
    };
  }

  if (key === 'periodos') {
    return {
      ...payload,
      anio: Number(payload.inicio.slice(0, 4)),
    };
  }

  return payload;
}

// Comprobar que no existan registros duplicados
function checkUnique(key, data, ignoreId) {
  (ENTITIES[key].unique ?? []).forEach(
    ([field, message]) => {
      if (
        S[key].some(
          (r) =>
            r.id !== ignoreId &&
            norm(r[field]) === norm(data[field])
        )
      ) {
        throw new AcademicError(message, 409);
      }
    }
  );

  if (
    key === 'inscripciones' &&
    S.inscripciones.some(
      (r) =>
        r.id !== ignoreId &&
        r.alumnoId === data.alumnoId &&
        r.periodo === data.periodo
    )
  ) {
    throw new AcademicError(
      'El alumno ya está inscrito en ese periodo.',
      409
    );
  }
}

// Guardar una calificación
function saveCalificacion(
  users,
  id,
  { alumnoId, materiaId, tipo, calificacion }
) {
  const materia = S.materias.find(
    (m) => m.id === materiaId
  );

  const u = users.find(
    (x) => x.id === alumnoId
  );

  if (!materia || !u) {
    throw new AcademicError(
      'El alumno o la materia ya no existen.',
      404
    );
  }

  let row = id
    ? S.calificaciones.find((c) => c.id === id)
    : S.calificaciones.find(
        (c) =>
          c.alumnoId === alumnoId &&
          c.materiaId === materiaId &&
          c.periodo === PERIODO_ACTUAL
      );

  if (id && !row) {
    throw new AcademicError(
      'La calificación ya no existe.',
      404
    );
  }

  if (!row) {
    row = {
      id: nextId(S.calificaciones),
      alumnoId,
      matricula: u.enrollment,
      alumno: `${u.firstName} ${u.lastName}`.trim(),
      carrera: u.career,
      materiaId,
      materia: materia.nombre,
      clave: materia.clave,
      periodo: PERIODO_ACTUAL,
      parcial: null,
      final: null,
      estatus: 'Pendiente',
    };

    S.calificaciones.unshift(row);
  }

  if (tipo === 'Final') {
    row.final = calificacion;
  } else {
    row.parcial = calificacion;
  }

  row.estatus = statusFromFinal(row.final);

  return row;
}

/* ---------- Crear registros ---------- */

export async function create(key, { users }, payload) {
  // Crear carreras en el backend real
  if (key === 'carreras') {
    return carrerasApi.create(payload);
  }

  await wait();
  ensure(users);

  if (key === 'calificaciones') {
    return saveCalificacion(users, null, payload);
  }

  const data = normalize(key, payload, users);

  checkUnique(key, data, null);

  const row = {
    ...data,
    id:
      key === 'periodos'
        ? `P-${Date.now()}`
        : nextId(S[key]),
  };

  if (key === 'materias') {
    Object.assign(row, {
      estatus: 'Activa',
      semestre: 1,
    });
  }

  if (key === 'periodos') {
    Object.assign(row, {
      estatus: 'Cerrado',
      base: 0,
    });
  }

  if (key === 'usuarios') {
    row.acceso = 'Nunca';
  }

  S[key].unshift(row);

  return row;
}

/* ---------- Actualizar registros ---------- */

export async function update(key, { users }, id, payload) {
  // Actualizar carreras en el backend real
  if (key === 'carreras') {
    return carrerasApi.update(id, payload);
  }

  await wait();
  ensure(users);

  if (key === 'calificaciones') {
    return saveCalificacion(users, id, payload);
  }

  const index = S[key].findIndex(
    (r) => r.id === id
  );

  if (index < 0) {
    throw new AcademicError(
      'El registro ya no existe.',
      404
    );
  }

  const data = normalize(key, payload, users);

  checkUnique(key, data, id);

  const before = S[key][index];

  S[key][index] = {
    ...before,
    ...data,
  };

  if (key === 'materias') {
    S.calificaciones.forEach((c) => {
      if (c.materiaId === id) {
        Object.assign(c, {
          materia: data.nombre,
          clave: data.clave,
        });
      }
    });
  }

  return S[key][index];
}

/* ---------- Reglas para eliminar ---------- */

const DELETE_RULES = {
  materias: (row) =>
    S.calificaciones.some(
      (c) => c.materiaId === row.id
    )
      ? 'No se puede eliminar: la materia tiene calificaciones registradas.'
      : '',

  carreras: (row, users) =>
    users.some((u) => u.career === row.nombre) ||
    S.materias.some((m) => m.carrera === row.nombre)
      ? 'No se puede eliminar: la carrera tiene alumnos o materias asociadas.'
      : '',

  docentes: (row) =>
    S.materias.some(
      (m) => m.docente === row.nombre
    )
      ? 'No se puede eliminar: el docente tiene materias asignadas.'
      : '',

  periodos: (row) =>
    row.estatus === 'Actual'
      ? 'No se puede eliminar el periodo actual.'
      : S.inscripciones.some(
          (i) => i.periodo === row.id
        )
        ? 'No se puede eliminar: el periodo tiene inscripciones.'
        : '',

  usuarios: (row) =>
    row.rol === 'Administrador' &&
    S.usuarios.filter(
      (u) => u.rol === 'Administrador'
    ).length <= 1
      ? 'Debe existir al menos un administrador.'
      : '',
};

/* ---------- Eliminar registros ---------- */

export async function remove(key, { users }, id) {
  // Eliminar carreras en el backend real
  if (key === 'carreras') {
    return carrerasApi.remove(id);
  }

  await wait();
  ensure(users);

  const index = S[key].findIndex(
    (r) => r.id === id
  );

  if (index < 0) {
    throw new AcademicError(
      'El registro ya no existe.',
      404
    );
  }

  const message = DELETE_RULES[key]?.(
    S[key][index],
    users
  );

  if (message) {
    throw new AcademicError(message, 409);
  }

  S[key].splice(index, 1);
}

/* ---------- Reportes ---------- */

// Obtener reportes de alumnos
// tipo: 'todos' | 'actuales'
// periodo: id opcional
export async function getReporte(
  { users },
  { tipo = 'todos', periodo = '' }
) {
  await wait();
  ensure(users);

  const inscritoEn = (p) =>
    new Set(
      S.inscripciones
        .filter(
          (i) =>
            i.periodo === p &&
            i.estatus === 'Inscrito'
        )
        .map((i) => i.alumnoId)
    );

  let ids = new Set(users.map((u) => u.id));

  if (tipo === 'actuales') {
    ids = inscritoEn(PERIODO_ACTUAL);
  }

  if (periodo) {
    const enPeriodo = inscritoEn(periodo);

    ids = new Set(
      [...ids].filter((id) => enPeriodo.has(id))
    );
  }

  const alumnos = users.filter(
    (u) => ids.has(u.id)
  );

  const finales = S.calificaciones.filter(
    (c) =>
      ids.has(c.alumnoId) &&
      c.final !== null &&
      (!periodo || c.periodo === periodo)
  );

  const avg = (list) =>
    list.length
      ? list.reduce((a, c) => a + c, 0) / list.length
      : null;

  const porCarrera =
    ENTITIES.carreras &&
    [...new Set(users.map((u) => u.career))]
      .map((nombre) => ({
        label: nombre,
        value: alumnos.filter(
          (u) => u.career === nombre
        ).length,
      }))
      .sort((a, b) => b.value - a.value);

  const porSemestre = Array.from(
    { length: 9 },
    (_, i) => {
      const sem = i + 1;

      const del = finales
        .filter(
          (c) =>
            users.find((u) => u.id === c.alumnoId)
              ?.semester === sem
        )
        .map((c) => c.final);

      return {
        label: `S${sem}`,
        value: avg(del),
      };
    }
  );

  return {
    promedio: avg(finales.map((c) => c.final)),

    tasa: finales.length
      ? finales.filter((c) => c.final >= 6).length /
        finales.length
      : null,

    total: alumnos.length,
    porCarrera,
    porSemestre,

    periodoLabel: periodo
      ? periodoNombre(periodo)
      : tipo === 'actuales'
        ? periodoNombre(PERIODO_ACTUAL)
        : 'Todos los periodos',
  };
}

// Exportar los periodos disponibles
export { PERIODOS };
