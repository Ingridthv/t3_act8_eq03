
import { useCallback, useEffect, useState } from 'react';
import {
  createUserRequest,
  deleteUserRequest,
  fetchAllUsers,
  updateUserRequest,
} from '../services/api.js';
import { enrichUser, formToUserPayload } from '../utils/users.js';

// DummyJSON solo SIMULA las escrituras. Por eso cada acción:
//  1) hace la petición real a la API (para ver su respuesta) y
//  2) refleja el cambio en el estado local para que la tabla se actualice.
// Los alumnos creados localmente no existen en el servidor (daría 404),
// así que para ellos solo se actualiza el estado local.
export function useUsersStore() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsers = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      // Obtener los alumnos desde la API
      const data = await fetchAllUsers(signal);
      // Mostrar solamente los primeros 100 alumnos(limite).
      setUsers(data.slice(0, 100).map(enrichUser));
      
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message || 'No se pudieron cargar los alumnos.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadUsers(controller.signal);
    return () => controller.abort();
  }, [loadUsers]);

  const reload = () => loadUsers();

  const addUser = async (values) => {
    const payload = formToUserPayload(values);
    const apiResponse = await createUserRequest(payload);
    console.log('[POST /users/add] respuesta de la API:', apiResponse);

    setUsers((current) => {
      const nextId = current.reduce(
        (max, user) => Math.max(max, user.id),
        0
      ) + 1;

      const enrollment = `2516${String(nextId).padStart(4, '0')}`;

      return [
        {
          ...payload,
          id: nextId,
          enrollment,
          isLocal: true,
        },
        ...current,
      ];
    });

    return apiResponse;
  };

  const editUser = async (user, values) => {
    const payload = formToUserPayload(values);
    let apiResponse = null;

    if (!user.isLocal) {
      apiResponse = await updateUserRequest(user.id, payload);
      console.log(`[PUT /users/${user.id}] respuesta de la API:`, apiResponse);
    }

    setUsers((current) =>
      current.map((item) =>
        item.id === user.id
          ? { ...item, ...payload }
          : item
      )
    );

    return apiResponse;
  };

  const removeUser = async (user) => {
    let apiResponse = null;

    if (!user.isLocal) {
      apiResponse = await deleteUserRequest(user.id);
      console.log(`[DELETE /users/${user.id}] respuesta de la API:`, apiResponse);
    }

    setUsers((current) =>
      current.filter((item) => item.id !== user.id)
    );

    return apiResponse;
  };

  return { users, loading, error, reload, addUser, editUser, removeUser };
}
