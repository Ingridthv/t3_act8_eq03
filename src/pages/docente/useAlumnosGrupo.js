import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { docenteAlumnosGrupoRequest } from '../../services/api.js';

// carga los alumnos de un grupo (con parcial y final)
export default function useAlumnosGrupo(grupoId) {
  const { user } = useAuth();
  const [alumnos, setAlumnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      setError('');
      try {
        setAlumnos(await docenteAlumnosGrupoRequest(user.token, grupoId));
      } catch (err) {
        setAlumnos([]);
        setError(err.message || 'No se pudieron cargar los alumnos.');
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [grupoId, user.token]);

  return { alumnos, cargando, error };
}
