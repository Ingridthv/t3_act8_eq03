
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

export const getFullName = (user) =>
  `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();

export const getInitials = (user) =>
  `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();

// Nombres mexicanos para los alumnos de demostracion.
// Se asignan de manera estable utilizando el ID de cada alumno.
const FEMALE_NAMES = [
  'María Fernanda',
  'Sofía',
  'Valeria',
  'Ximena',
  'Daniela',
  'Regina',
  'Camila',
  'Mariana',
  'Alejandra',
  'Guadalupe',
  'Fernanda',
  'Natalia',
  'Andrea',
  'Paola',
  'Renata',
  'Lucía',
  'Montserrat',
  'Jimena',
  'Carolina',
  'Gabriela',
];

const MALE_NAMES = [
  'José Antonio',
  'Juan Carlos',
  'Luis Fernando',
  'Diego Alejandro',
  'Miguel Ángel',
  'Carlos Eduardo',
  'Santiago',
  'Emiliano',
  'Sebastián',
  'Fernando',
  'Ricardo',
  'Jorge Alberto',
  'Daniel',
  'Ángel',
  'Eduardo',
  'Francisco Javier',
  'Andrés',
  'Mateo',
  'Roberto',
  'Alejandro',
];

const PATERNAL_SURNAMES = [
  'Hernández',
  'García',
  'Martínez',
  'López',
  'González',
  'Pérez',
  'Rodríguez',
  'Sánchez',
  'Ramírez',
  'Cruz',
  'Flores',
  'Torres',
  'Jiménez',
  'Morales',
  'Vargas',
  'Castillo',
  'Reyes',
  'Mendoza',
  'Ortiz',
  'Ruiz',
  'Aquino',
  'Bautista',
  'Santiago',
];

const MATERNAL_SURNAMES = [
  'Guzmán',
  'Morales',
  'Sánchez',
  'Ramírez',
  'Hernández',
  'Flores',
  'Castillo',
  'Pérez',
  'García',
  'Martínez',
  'Reyes',
  'López',
  'Torres',
  'Mendoza',
  'Cruz',
  'Vargas',
  'Jiménez',
  'Rodríguez',
  'Ortiz',
  'Ruiz',
  'Santiago',
  'Bautista',
  'Aquino',
];

// Genera nombres mexicanos para los datos de demostracion.
// La misma ID siempre recibe el mismo nombre.
function getMexicanName(id) {
  const isFemale = id % 2 === 0;
  const names = isFemale ? FEMALE_NAMES : MALE_NAMES;

  const firstName = names[
    Math.floor(id / 2) % names.length
  ];

  const paternal = PATERNAL_SURNAMES[
    (id * 7) % PATERNAL_SURNAMES.length
  ];

  const maternal = MATERNAL_SURNAMES[
    (id * 11 + 3) % MATERNAL_SURNAMES.length
  ];

  return {
    firstName,
    lastName: `${paternal} ${maternal}`,
    demoGender: isFemale ? 'female' : 'male',
  };
}

// DummyJSON no tiene datos academicos. Los derivamos del ID del usuario,
// siempre igual, para que cada alumno tenga matricula, carrera,
// semestre, promedio y estatus estables.
// Tambien asignamos nombres mexicanos a los alumnos de demostracion.
export function enrichUser(user) {
  const id = Number(user.id);
  const mexicanName = getMexicanName(id);

  return {
    ...user,
    ...mexicanName,
    enrollment: `${20 + (id % 4)}16${String(id).padStart(4, '0')}`, // 8 digitos, como en el diseño
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

// Convierte lo que escribe el usuario en el formulario
// al formato que guardamos y enviamos a la API.
export function formToUserPayload(values) {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim(),
    career: values.career,
    semester: Number(values.semester),
    average: Number(values.average).toFixed(1),
    status: values.status,
    address: {
      state: values.state.trim(),
      postalCode: values.postalCode.trim(),
    },
  };
}

// Valida los datos antes de guardar un alumno.
export function validateUserForm(values) {
  const errors = {};

  if (!values.firstName.trim()) {
    errors.firstName = 'Escribe el nombre.';
  }

  if (!values.lastName.trim()) {
    errors.lastName = 'Escribe los apellidos.';
  }

  if (!values.email.trim()) {
    errors.email = 'Escribe el correo.';
  } else if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())
  ) {
    errors.email =
      'Escribe un correo válido, por ejemplo nombre@correo.com.';
  }

  const average = Number(values.average);

  if (values.average === '') {
    errors.average = 'Escribe el promedio.';
  } else if (
    Number.isNaN(average) ||
    average < 0 ||
    average > 10
  ) {
    errors.average =
      'El promedio debe ser un número entre 0 y 10.';
  }

  if (
    values.postalCode.trim() &&
    !/^\d{5}$/.test(values.postalCode.trim())
  ) {
    errors.postalCode =
      'El código postal debe tener 5 dígitos.';
  }

  return errors;
}
