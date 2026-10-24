import { createContext, useContext } from 'react';
import { useUsersStore } from '../hooks/useUsers.js';

const UsersContext = createContext(null);

// Una sola lista de alumnos para Inicio y Alumnos: lo que agregas, editas o eliminas
// se mantiene al cambiar de pantalla.
export function UsersProvider({ children }) {
  const store = useUsersStore();
  return <UsersContext.Provider value={store}>{children}</UsersContext.Provider>;
}

export function useUsers() {
  const context = useContext(UsersContext);
  if (!context) throw new Error('useUsers debe usarse dentro de <UsersProvider>.');
  return context;
}
