export const LIMIT_OPTIONS = [10, 20, 40, 50];

export const CAREERS = [
  'Ing. en Sistemas',
  'Lic. en Educación Primaria',
  'Lic. en Educación Física',
  'Lic. Administración',
  'Ing. Industrial',
  'Lic. Arquitectura',
  'Lic. Psicología',
  'Lic. Derecho',
];
export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
export const STATUSES = ['Activo', 'Baja'];

export const getFullName = (user) => `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();

export const getInitials = (user) =>
  `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();

// DiceBear genera una foto con las iniciales para los alumnos que se crean desde la app.
export const getAvatarUrl = (fullName) =>
  `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(fullName)}&backgroundColor=f1e8df&textColor=3b2a20`;

// DummyJSON no tiene datos académicos. Los derivamos del id del usuario, siempre igual,
// para que cada alumno tenga matrícula, carrera, semestre, promedio y estatus estables.
export function enrichUser(user) {
  const id = user.id;
  return {
    ...user,
    enrollment: `${20 + (id % 4)}16${String(id).padStart(4, '0')}`, // 8 dígitos, como en el diseño
    career: CAREERS[(id * 5) % CAREERS.length],
    semester: (id * 7) % 9 + 1,
    average: (7 + ((id * 37) % 30) / 10).toFixed(1),
    status: id % 9 === 0 ? 'Baja' : 'Activo',
  };
}

export const EMPTY_USER_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  career: CAREERS[0],
  semester: '1',
  average: '',
  status: 'Activo',
  postalCode: '',
  state: '',
};

export function userToForm(user) {
  return {
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    email: user.email ?? '',
    career: user.career ?? CAREERS[0],
    semester: String(user.semester ?? 1),
    average: String(user.average ?? ''),
    status: user.status ?? 'Activo',
    postalCode: user.address?.postalCode ?? '',
    state: user.address?.state ?? '',
  };
}

// Convierte lo que escribe el usuario en el formulario al formato que guardamos y enviamos a la API.
export function formToUserPayload(values) {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim(),
    career: values.career,
    semester: Number(values.semester),
    average: Number(values.average).toFixed(1),
    status: values.status,
    address: { state: values.state.trim(), postalCode: values.postalCode.trim() },
  };
}

export function validateUserForm(values) {
  const errors = {};
  if (!values.firstName.trim()) errors.firstName = 'Escribe el nombre.';
  if (!values.lastName.trim()) errors.lastName = 'Escribe los apellidos.';

  if (!values.email.trim()) {
    errors.email = 'Escribe el correo.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Escribe un correo válido, por ejemplo nombre@correo.com.';
  }

  const average = Number(values.average);
  if (values.average === '') {
    errors.average = 'Escribe el promedio.';
  } else if (Number.isNaN(average) || average < 0 || average > 10) {
    errors.average = 'El promedio debe ser un número entre 0 y 10.';
  }

  if (values.postalCode.trim() && !/^\d{5}$/.test(values.postalCode.trim())) {
    errors.postalCode = 'El código postal debe tener 5 dígitos.';
  }
  return errors;
}
