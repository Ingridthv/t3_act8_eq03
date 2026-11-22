import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  CheckSquare,
  BarChart2,
  User,
  LogOut,
  Bell,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { docentePerfilRequest, docenteGruposRequest } from '../../services/api.js';
import '../../pages/docente/DocenteLayout.css';

const enlaces = [
  { to: '/docente/inicio', label: 'Inicio', icon: Home },
  { to: '/docente/grupos', label: 'Mis grupos', icon: Users },
  { to: '/docente/calificaciones', label: 'Calificaciones', icon: CheckSquare },
  { to: '/docente/reportes', label: 'Reportes', icon: BarChart2 },
  { to: '/docente/perfil', label: 'Mi perfil', icon: User }
];

export default function DocenteLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // cargo una sola vez el perfil y los grupos; las pÃ¡ginas los reciben por contexto
  const [perfil, setPerfil] = useState(null);
  const [grupos, setGrupos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [datosPerfil, datosGrupos] = await Promise.all([
          docentePerfilRequest(user.token),
          docenteGruposRequest(user.token)
        ]);
        setPerfil(datosPerfil);
        setGrupos(datosGrupos);
      } catch (err) {
        setError(err.message || 'No se pudo cargar la informaciÃ³n.');
      } finally {
        setCargando(false);
      }
    }
    cargarDatos();
  }, [user.token]);

  // nombre y apellido para la barra superior (ej. "Samuel Ortiz")
  const primerApellido = perfil?.apellidos?.split(' ')[0] || '';
  const nombreCorto = perfil ? `${perfil.nombre} ${primerApellido}`.trim() : 'Docente';
  const iniciales = perfil
    ? `${perfil.nombre?.[0] || ''}${primerApellido[0] || ''}`.toUpperCase()
    : 'Â·';

  // tÃ­tulo de la barra superior segÃºn la pÃ¡gina
  const actual = enlaces.find((e) => location.pathname.startsWith(e.to));
  // cuando se abre un grupo, el título cambia como en el Figma
  const enGrupo = /^\/docente\/(grupos|calificaciones|reportes)\/[^/]+/.exec(location.pathname);
  const TITULOS_GRUPO = {
    grupos: 'Alumnos del grupo',
    calificaciones: 'Capturar calificaciones',
    reportes: 'Reporte del grupo'
  };
  const titulo = enGrupo ? TITULOS_GRUPO[enGrupo[1]] : actual ? actual.label : 'Inicio';

  function salir() {
    logout();
    navigate('/login');
  }

  return (
    <div className="dl">
      <aside className="dl__sidebar">
        <div className="dl__brand">
          <div className="dl__brand-logo">
            <GraduationCap size={22} />
          </div>
          <span>Control Alumnos</span>
        </div>

        <nav className="dl__menu">
          {enlaces.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                'dl__item' + (isActive ? ' dl__item--active' : '')
              }
            >
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>

        <button className="dl__item dl__logout" onClick={salir}>
          <LogOut size={18} /> Cerrar sesión
        </button>
      </aside>

      <div className="dl__main">
        <header className="dl__topbar">
          <h1>{titulo}</h1>
          <div className="dl__topbar-right">
            <button className="dl__icon-btn" aria-label="Notificaciones">
              <Bell size={18} />
            </button>
            <div className="dl__avatar">{iniciales}</div>
            <div className="dl__user">
              <strong>{nombreCorto}</strong>
              <small>Docente</small>
            </div>
          </div>
        </header>

        <div className="dl__content">
          {cargando ? (
            <div className="state">
              <div className="spinner"></div>
              <p>Cargando informaciónn del docente...</p>
            </div>
          ) : error ? (
            <div className="page">
              <div className="alert alert--error">
                <p className="alert__text">{error}</p>
              </div>
              <button className="btn btn--primary" onClick={salir}>
                Cerrar sesión
              </button>
            </div>
          ) : (
            <Outlet context={{ perfil, grupos }} />
          )}
        </div>
      </div>
    </div>
  );
}
