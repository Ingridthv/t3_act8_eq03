export const LIMIT_OPTIONS = [10, 20, 40, 50];

export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
export const STATUSES = ['Activo', 'Baja'];

// Año de ingreso: los 2 primeros dígitos de la matrícula (20 -> 2020).
export const getIngreso = (user) => 2000 + Number(String(user.enrollment).slice(0, 2));

export const getFullName = (user) =>
  `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();

export const getInitials = (user) =>
  `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();

export const EMPTY_USER_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  contactEmail: '',
  phone: '',
  career: '',
  semester: '1',
  status: 'Activo',
  postalCode: '',
  state: '',
};

export function userToForm(user) {
  return {
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    email: user.email ?? '',
    contactEmail: user.contactEmail ?? '',
    phone: user.phone ?? '',
    career: String(user.careerId ?? ''),
    semester: String(user.semester ?? 1),
    status: user.status === 'Baja' ? 'Baja' : 'Activo',
    postalCode: user.postalCode ?? '',
    state: user.state ?? '',
  };
}

// Valida los datos antes de guardar un alumno.
export function validateUserForm(values) {
  const errors = {};
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  if (!values.firstName.trim()) errors.firstName = 'Escribe el nombre.';
  if (!values.lastName.trim()) errors.lastName = 'Escribe los apellidos.';

  if (!values.email.trim()) errors.email = 'Escribe el correo institucional.';
  else if (!emailOk(values.email)) errors.email = 'Escribe un correo válido, por ejemplo nombre@correo.com.';

  if (!values.contactEmail.trim()) errors.contactEmail = 'Escribe el correo de contacto: ahí se envían las credenciales.';
  else if (!emailOk(values.contactEmail)) errors.contactEmail = 'Escribe un correo válido, por ejemplo nombre@correo.com.';

  if (values.phone.trim() && !/^\+?\d{10,14}$/.test(values.phone.trim())) {
    errors.phone = 'Escribe de 10 a 14 dígitos, por ejemplo +525512345678.';
  }

  if (!values.career) errors.career = 'Selecciona una carrera.';

  if (values.postalCode.trim() && !/^\d{5}$/.test(values.postalCode.trim())) {
    errors.postalCode = 'El código postal debe tener 5 dígitos.';
  }

  return errors;
}
