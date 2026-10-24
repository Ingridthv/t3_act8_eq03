import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

// Protege el sistema: sin sesión en el estado, siempre se vuelve al login.
export function RequireAuth({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

// Si ya hay sesión, el login no tiene sentido: manda al sistema.
export function PublicOnly({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/inicio" replace /> : children;
}
