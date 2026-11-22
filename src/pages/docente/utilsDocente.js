// periodo que se muestra por defecto (como en el Figma)
export const PERIODO_ACTUAL = 'Agosto-Diciembre 2021';

// calificación mínima para aprobar y límite para considerar "en riesgo"
export const APROBATORIA = 6;
export const RIESGO = 7;

export function nombreCompleto(a) {
  return [a.nombre, a.apellido_paterno, a.apellido_materno].filter(Boolean).join(' ');
}

// iniciales del alumno: primera letra del nombre + primera del apellido paterno
export function iniciales(a) {
  return `${a.nombre?.[0] || ''}${a.apellido_paterno?.[0] || ''}`.toUpperCase();
}

export function aNumero(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  const n = Number(valor);
  return Number.isNaN(n) ? null : n;
}

// promedio de las calificaciones capturadas (parcial y final)
export function promedio(parcial, final) {
  const valores = [aNumero(parcial), aNumero(final)].filter((v) => v !== null);
  if (valores.length === 0) return null;
  return valores.reduce((suma, v) => suma + v, 0) / valores.length;
}

export function formato(n) {
  return n === null || n === undefined ? '—' : Number(n).toFixed(1);
}

// Aprobado / Reprobado / Pendiente (pendiente si todavía no hay calificación final)
export function estadoNota(parcial, final) {
  if (aNumero(final) === null) return 'Pendiente';
  return promedio(parcial, final) >= APROBATORIA ? 'Aprobado' : 'Reprobado';
}
