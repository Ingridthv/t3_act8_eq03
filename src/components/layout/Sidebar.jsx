import { NavLink } from 'react-router-dom';
import {
  Award, BarChart3, BookOpen, CalendarDays, ClipboardList, GraduationCap, Home, Layers, LogOut, Settings, ShieldCheck, UserCheck, Users,
} from 'lucide-react';

// Mismo orden que el menú del diseño de Figma (administrador).
export const NAV_ITEMS = [
  { to: '/inicio', label: 'Inicio', icon: Home },
  { to: '/alumnos', label: 'Alumnos', icon: Users },
  { to: '/inscripciones', label: 'Inscripciones', icon: ClipboardList },
  { to: '/materias', label: 'Materias', icon: BookOpen },
  { to: '/calificaciones', label: 'Calificaciones', icon: Award },
  { to: '/periodos', label: 'Periodos', icon: CalendarDays },
  { to: '/reportes', label: 'Reportes', icon: BarChart3 },
  { to: '/carreras', label: 'Carreras', icon: Layers },
  { to: '/docentes', label: 'Docentes', icon: UserCheck },
  { to: '/usuarios', label: 'Usuarios y roles', icon: ShieldCheck },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
];

export default function Sidebar({ onLogout, items = NAV_ITEMS }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="logo-mark">
          <GraduationCap size={24} aria-hidden="true" />
        </span>
        <span className="sidebar__brand-name">Control Alumnos</span>
      </div>

      <nav className="sidebar__nav" aria-label="Menú principal">
        {items.map(({ to, label, icon: Icon }) => (
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
