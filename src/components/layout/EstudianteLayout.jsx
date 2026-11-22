import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Navbar from './Navbar.jsx';
import { NAV_ESTUDIANTE } from './navEstudiante.js';
import Sidebar from './Sidebar.jsx';

// Marco del modulo de estudiante: mismo sidebar/navbar que el administrador, con su propio menu.
export default function EstudianteLayout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const current = NAV_ESTUDIANTE.find((item) => pathname.startsWith(item.to));

  return (
    <div className="app-shell">
      <Sidebar items={NAV_ESTUDIANTE} onLogout={logout} />
      <div className="app-shell__content">
        <Navbar title={current?.label ?? 'Control Alumnos'} user={user} onLogout={logout} />
        <main className="app-shell__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
