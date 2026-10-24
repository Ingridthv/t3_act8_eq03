import { createContext, useContext, useState } from 'react';
import { loginRequest } from '../services/api.js';

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
  // sessionStorage solo evita perder la sesión al recargar la pestaña.
  const [user, setUser] = useState(readStoredUser);

  const login = async ({ username, password }) => {
    const data = await loginRequest({ username, password });
    const sessionUser = {
      id: data.id,
      username: data.username,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      image: data.image,
      gender: data.gender,
    };
    setUser(sessionUser);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem(SESSION_KEY);
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  return context;
}
