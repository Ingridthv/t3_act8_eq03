// Etiqueta de estatus academico (colores del diseño de Figma).
const TONOS = {
  'En curso': 'pendiente', // ambar
  Aprobado: 'activo', // verde
  Reprobado: 'baja', // rojo
  Pendiente: 'neutro', // gris
  Activo: 'activo',
  Baja: 'baja',
  Egresado: 'neutro',
};

export default function EstatusTag({ value }) {
  return <span className={`tag tag--${TONOS[value] ?? 'rol'}`}>{value}</span>;
}
