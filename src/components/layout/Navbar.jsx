import { Bell } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';

// Tu foto de administrador: guarda el archivo en public/admin.png
const ADMIN_PHOTO = `${import.meta.env.BASE_URL}admin.png`;

// Nombre y rol que se muestran en el navbar (cámbialos aquí).
// Si pones '' se usa el nombre que regresa la API.
const ADMIN_NAME = 'Concepción Escarleth';
const ADMIN_ROLE = 'Administradora';

export default function Navbar({ title, user, onLogout }) {
  const fullName =
    ADMIN_NAME || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.username;
  const initials = fullName
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  return (
    <header className="navbar">
      <h1 className="navbar__title">{title}</h1>

      <div className="navbar__user">
        <button type="button" className="icon-circle" aria-label="Notificaciones">
          <Bell size={20} aria-hidden="true" />
        </button>
        <Avatar src={ADMIN_PHOTO} fallbackSrc={user.image} initials={initials} size="md" alt={`Foto de ${fullName}`} />
        <div className="navbar__identity">
          <p className="navbar__name">{fullName}</p>
          <p className="navbar__role">{ADMIN_ROLE || (user.gender === 'female' ? 'Administradora' : 'Administrador')}</p>
        </div>
        <button type="button" className="btn btn--secondary btn--sm" onClick={onLogout}>
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}