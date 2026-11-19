import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

// Pantalla de inicio de cada rol.
export function homeFor(role) {
  if (role === 'docente') return '/docente/inicio';
  if (role === 'estudiante') return '/estudiante/inicio';
  return '/inicio';
}

// Protege el sistema: sin sesión en el estado, siempre se vuelve al login.
export function RequireAuth({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

// Cada rol solo entra a sus pantallas (el backend también lo valida con 403).
export function RequireRole({ role, children }) {
  const { user } = useAuth();
  return user?.role === role ? children : <Navigate to={homeFor(user?.role)} replace />;
}

// Si ya hay sesión, el login no tiene sentido: manda al inicio de su rol.
export function PublicOnly({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to={homeFor(user.role)} replace /> : children;
}
