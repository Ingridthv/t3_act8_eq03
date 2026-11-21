import { createContext, useContext, useState } from 'react';
import { loginRequest, logoutRequest } from '../services/api.js';

const SESSION_KEY = 'control-alumnos:session';
const AuthContext = createContext(null);

function readStoredUser() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  // El usuario autenticado vive en el estado de la app (useState).
  // sessionStorage solo evita perder la sesión al recargar la pestaña (se borra al cerrarla).
  const [user, setUser] = useState(readStoredUser);

  const login = async ({ correo, password }) => {
    const data = await loginRequest({ correo, password });
    const sessionUser = {
      id: data.id,
      username: data.correo,
      email: data.correo,
      firstName: data.nombre,
      lastName: '',
      image: '',
      role: data.rol, // administrador | docente | estudiante
      token: data.token, // JWT: se manda en el encabezado Authorization
      debeCambiarPassword: data.debeCambiarPassword,
    };
    setUser(sessionUser);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  };

  const logout = () => {
    // El backend guarda el token en tokens_invalidados para que ya no sirva.
    if (user?.token) logoutRequest(user.token).catch(() => {});
    setUser(null);
    sessionStorage.removeItem(SESSION_KEY);
  };

  // Actualiza datos de la sesión (p. ej. debeCambiarPassword tras cambiar la contraseña)
  const updateUser = (changes) => {
    setUser((current) => {
      const next = { ...current, ...changes };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
      return next;
    });
  };

  return <AuthContext.Provider value={{ user, login, logout, updateUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  return context;
}
