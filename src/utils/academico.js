// Constantes y datos de demostración académicos (periodos, docentes, materias, etc.).
// Todo es determinista: el mismo alumno siempre recibe los mismos datos.
import { CAREERS, getIngreso } from './users.js';

export const PAGE_SIZE = 10;
export const MIN_APROBATORIA = 6;
export const INGRESOS = [2020, 2021, 2022, 2023, 2024, 2025];

export const PERIODOS = [
  { id: '2025-1', nombre: 'Enero-Julio 2025', inicio: '2025-01-13', fin: '2025-07-03', anio: 2025, estatus: 'Cerrado', base: 398 },
  { id: '2025-2', nombre: 'Agosto-Diciembre 2025', inicio: '2025-08-11', fin: '2025-12-19', anio: 2025, estatus: 'Cerrado', base: 431 },
  { id: '2026-1', nombre: 'Enero-Julio 2026', inicio: '2026-01-12', fin: '2026-07-02', anio: 2026, estatus: 'Cerrado', base: 455 },
  { id: '2026-2', nombre: 'Agosto-Diciembre 2026', inicio: '2026-08-10', fin: '2026-12-18', anio: 2026, estatus: 'Actual', base: 482 },
];
export const PERIODO_ACTUAL = '2026-2';

export const periodoNombre = (id) => PERIODOS.find((p) => p.id === id)?.nombre ?? String(id);
export const periodoCorto = (id) =>
  periodoNombre(id).replace('Enero-Julio', 'Ene-Jul').replace('Agosto-Diciembre', 'Ago-Dic');

export const statusFromFinal = (final) =>
  final === null || final === '' || final === undefined
    ? 'Pendiente'
    : Number(final) >= MIN_APROBATORIA
      ? 'Aprobado'
      : 'Reprobado';

export const slug = (text) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z\s]/g, '').trim().split(/\s+/);

export const initials = (text) =>
  String(text ?? '')
    .split(/\s+/)
    .filter((w) => w && !/^(de|del|la|las|los|y)$/i.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

export const formatDate = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = String(iso).split('-');
  return `${d}/${m}/${y}`;
};

const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/* ---------- Datos iniciales ---------- */

const DOCENTES = [
  'Ricardo Salinas Ortiz', 'Laura Gómez Prado', 'Héctor Vidal Mena', 'Elena Rojas Lara', 'Sergio Cano Duarte',
  'Paola Núñez Ibarra', 'Samuel Ortiz Barrera', 'Karla Mendoza Ríos', 'Marco Villa Cruz', 'Lucía Arce Montes',
  'Javier Beltrán Solís', 'Mariana Herrera Luna', 'Óscar Peña Castro', 'Daniela Robles Vega', 'Iván Aguilar Soto',
  'Teresa Navarro Gil', 'Raúl Domínguez Paz', 'Gabriela Ibáñez Rey',
];

export function seedDocentes() {
  return DOCENTES.map((nombre, i) => {
    const [first, ...rest] = slug(nombre);
    return {
      id: i + 1,
      clave: `DOC-${String(i + 1).padStart(3, '0')}`,
      nombre,
      correo: `${first}.${rest[0]}@controlalumnos.edu`,
      carrera: CAREERS[i % CAREERS.length],
      estatus: i % 6 === 3 ? 'Licencia' : 'Activo',
    };
  });
}

const MATERIAS_POR_CARRERA = {
  'Ing. en Sistemas': ['Programación Web', 'Bases de Datos', 'Redes de Computadoras'],
  'Lic. en Educación Primaria': ['Didáctica General', 'Psicología del Aprendizaje', 'Planeación Educativa'],
  'Lic. en Educación Física': ['Anatomía Aplicada', 'Teoría del Entrenamiento', 'Pedagogía del Deporte'],
  'Lic. Administración': ['Contabilidad General', 'Mercadotecnia', 'Administración Financiera'],
  'Ing. Industrial': ['Procesos de Manufactura', 'Control de Calidad', 'Ingeniería de Métodos'],
  'Lic. Arquitectura': ['Dibujo Arquitectónico', 'Historia de la Arquitectura', 'Diseño Estructural'],
  'Lic. Psicología': ['Psicología del Desarrollo', 'Psicometría', 'Psicología Clínica'],
  'Lic. Derecho': ['Derecho Civil', 'Derecho Constitucional', 'Derecho Penal'],
};
const PREFIJOS = ['SIS', 'EPR', 'EFI', 'ADM', 'IND', 'ARQ', 'PSI', 'DER'];

export function seedMaterias(docentes) {
  const rows = [];
  let id = 1;
  CAREERS.forEach((carrera, ci) => {
    const docs = docentes.filter((d) => d.carrera === carrera);
    (MATERIAS_POR_CARRERA[carrera] ?? []).forEach((nombre, mi) => {
      rows.push({
        id,
        clave: `${PREFIJOS[ci]}-${101 + mi * 100 + ci}`,
        nombre,
        docente: docs[mi % docs.length]?.nombre ?? '',
        carrera,
        semestre: mi * 2 + 2,
        creditos: 6 + ((ci + mi) % 3) * 2,
        grupo: 'ABCD'[(ci + mi) % 4],
        estatus: id % 7 === 0 ? 'Inactiva' : 'Activa',
      });
      id += 1;
    });
  });
  return rows;
}

const CLAVES_CARRERA = ['ISC', 'LEP', 'LEF', 'LAO', 'IIN', 'LAR', 'LPS', 'LDE'];
export function seedCarreras(docentes) {
  return CAREERS.map((nombre, i) => ({
    id: i + 1,
    clave: CLAVES_CARRERA[i],
    nombre,
    duracion: '9 semestres',
    coordinador: docentes.find((d) => d.carrera === nombre)?.nombre ?? '',
  }));
}

export const seedPeriodos = () => PERIODOS.map((p) => ({ ...p }));

export function buildCalificaciones(users, materias) {
  const rows = [];
  let id = 1;
  users.forEach((u) => {
    const mats = materias.filter((m) => m.carrera === u.career);
    [['2026-1', true], ['2026-2', u.status === 'Activo']].forEach(([periodo, enrolled], pi) => {
      if (!enrolled) return;
      mats.forEach((m) => {
        const seed = u.id * 31 + m.id * 17 + pi * 13;
        const parcial = Math.round((5.5 + (seed % 45) / 10) * 10) / 10;
        const final = pi === 0 ? Math.min(10, Math.round((parcial + ((seed % 7) - 3) / 10) * 10) / 10) : null;
        rows.push({
          id: id++,
          alumnoId: u.id,
          matricula: u.enrollment,
          alumno: `${u.firstName} ${u.lastName}`.trim(),
          carrera: u.career,
          materiaId: m.id,
          materia: m.nombre,
          clave: m.clave,
          periodo,
          parcial,
          final,
          estatus: statusFromFinal(final),
        });
      });
    });
  });
  return rows;
}

export function buildInscripciones(users) {
  const rows = [];
  let id = 1;
  users.forEach((u) => {
    [['2026-1', u.status === 'Baja' ? 'Baja' : 'Inscrito'], ['2026-2', u.status === 'Activo' ? 'Inscrito' : null]].forEach(
      ([periodo, estatus]) => {
        if (!estatus) return;
        const p = PERIODOS.find((x) => x.id === periodo);
        rows.push({
          id: id++,
          alumnoId: u.id,
          matricula: u.enrollment,
          alumno: `${u.firstName} ${u.lastName}`.trim(),
          carrera: u.career,
          periodo,
          fecha: addDays(p.inicio, u.id % 5),
          estatus,
        });
      }
    );
  });
  return rows;
}

const ACCESOS = ['Hoy 09:12', 'Hoy 08:47', 'Ayer 18:40', '12/11/2026', '10/11/2026', '05/11/2026'];
export function buildUsuarios(users, docentes) {
  const rows = [
    { nombre: 'Concepción Escarleth', correo: 'concepcion@controlalumnos.edu', rol: 'Administrador', acceso: 'Hoy 09:12', estatus: 'Activo' },
    { nombre: 'Ingrid Arcadio', correo: 'ingrid.arcadio@controlalumnos.edu', rol: 'Administrador', acceso: 'Hoy 09:30', estatus: 'Activo' },
    ...docentes.map((d, i) => ({ nombre: d.nombre, correo: d.correo, rol: 'Docente', acceso: ACCESOS[i % ACCESOS.length], estatus: d.estatus === 'Activo' ? 'Activo' : 'Inactivo' })),
    ...users.map((u, i) => ({
      nombre: `${u.firstName} ${u.lastName}`.trim(),
      correo: `${u.enrollment}@escuela.edu.mx`, // el correo del alumno inicia con su número de control
      rol: 'Estudiante',
      acceso: ACCESOS[i % ACCESOS.length],
      estatus: u.status === 'Baja' ? 'Inactivo' : 'Activo',
      alumnoId: u.id,
    })),
  ];
  return rows.map((r, i) => ({ ...r, id: i + 1 }));
}

export { getIngreso };
