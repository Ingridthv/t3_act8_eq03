import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import AuthShell from './AuthShell.jsx';

// Pantalla de inicio de cada rol.
export function homeFor(role) {
  if (role === 'docente') return '/docente/inicio';
  if (role === 'estudiante') return '/estudiante/inicio';
  return '/inicio';
}

// Protege el sistema: sin sesión en el estado, siempre se vuelve al login.
export function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  // Cuentas nuevas: antes de usar el sistema deben cambiar su contraseña temporal.
  if (user.debeCambiarPassword) return <Navigate to="/cambiar-password" replace />;
  return children;
}

// Pantalla "Acceso restringido" (Figma): se muestra cuando un rol abre una ruta de otro rol.
function AccesoRestringido({ role }) {
  return (
    <AuthShell title="Acceso restringido" subtitle={`Tu rol de ${role} no tiene permiso para ver esta página.`}>
      <Link to={homeFor(role)} className="btn btn--primary btn--block">Volver al inicio</Link>
    </AuthShell>
  );
}

// Cada rol solo entra a sus pantallas (el backend también lo valida con 403).
export function RequireRole({ role, children }) {
  const { user } = useAuth();
  return user?.role === role ? children : <AccesoRestringido role={user?.role} />;
}

// Rutas desconocidas: cada quien vuelve a su inicio (o al login si no hay sesión).
export function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? homeFor(user.role) : '/login'} replace />;
}

// Si ya hay sesión, el login no tiene sentido: manda al inicio de su rol.
export function PublicOnly({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to={homeFor(user.role)} replace /> : children;
}
