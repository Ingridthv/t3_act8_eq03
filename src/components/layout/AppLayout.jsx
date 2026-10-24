import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { UsersProvider } from '../../context/UsersContext.jsx';
import Navbar from './Navbar.jsx';
import Sidebar, { NAV_ITEMS } from './Sidebar.jsx';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const currentItem = NAV_ITEMS.find((item) => pathname.startsWith(item.to));

  return (
    <UsersProvider>
    <div className="app-shell">
      <Sidebar onLogout={logout} />
      <div className="app-shell__content">
        <Navbar title={currentItem?.label ?? 'Control Alumnos'} user={user} onLogout={logout} />
        <main className="app-shell__main">
          <Outlet />
        </main>
      </div>
    </div>
    </UsersProvider>
  );
}
