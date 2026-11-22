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

// Aprobado / Reprobado / Pendiente según la calificación final (igual que la base de datos)
export function estadoNota(parcial, final) {
  if (aNumero(final) === null) return 'Pendiente';
  return aNumero(final) >= APROBATORIA ? 'Aprobado' : 'Reprobado';
}

// texto de un estatus que viene de la base de datos ("aprobado" -> "Aprobado")
export function capitalizar(texto) {
  const t = String(texto || '');
  return t.charAt(0).toUpperCase() + t.slice(1);
}
