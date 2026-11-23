// Constantes y utilidades académicas (sin datos de demostración: todo viene de la base de datos).

export const PAGE_SIZE = 10;
export const MIN_APROBATORIA = 6;

// Los periodos llegan del backend con su nombre completo ("Agosto-Diciembre 2021").
export const periodoNombre = (nombre) => String(nombre ?? '');
export const periodoCorto = (nombre) =>
  periodoNombre(nombre).replace('Enero-Julio', 'Ene-Jul').replace('Agosto-Diciembre', 'Ago-Dic');

export const statusFromFinal = (final) =>
  final === null || final === '' || final === undefined
    ? 'Pendiente'
    : Number(final) >= MIN_APROBATORIA
      ? 'Aprobado'
      : 'Reprobado';

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
