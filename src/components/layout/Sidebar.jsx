import { NavLink } from 'react-router-dom';
import { Award, BarChart3, BookOpen, GraduationCap, Home, LogOut, Settings, Users } from 'lucide-react';

export const NAV_ITEMS = [
  { to: '/inicio', label: 'Inicio', icon: Home },
  { to: '/alumnos', label: 'Alumnos', icon: Users },
  { to: '/materias', label: 'Materias', icon: BookOpen },
  { to: '/calificaciones', label: 'Calificaciones', icon: Award },
  { to: '/reportes', label: 'Reportes', icon: BarChart3 },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
];

export default function Sidebar({ onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="logo-mark">
          <GraduationCap size={24} aria-hidden="true" />
        </span>
        <span className="sidebar__brand-name">Control Alumnos</span>
      </div>

      <nav className="sidebar__nav" aria-label="Menú principal">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
            }
          >
            <Icon size={20} aria-hidden="true" />
            <span className="sidebar__label">{label}</span>
          </NavLink>
        ))}
      </nav>

      <button type="button" className="sidebar__link sidebar__logout" onClick={onLogout}>
        <LogOut size={20} aria-hidden="true" />
        <span className="sidebar__label">Cerrar sesión</span>
      </button>
    </aside>
  );
}
