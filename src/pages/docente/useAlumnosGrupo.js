import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { docenteAlumnosGrupoRequest } from '../../services/api.js';

// carga una página de alumnos del grupo; la búsqueda, el estatus y la paginación los hace el servidor
export default function useAlumnosGrupo(grupoId, { q = '', estatus = '', page = 1, size = 10 } = {}) {
  const { user } = useAuth();
  const [datos, setDatos] = useState({ items: [], total: 0, totalPages: 1 });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vigente = true;
    // espera un momento al escribir para no consultar en cada letra
    const espera = setTimeout(async () => {
      setCargando(true);
      setError('');
      try {
        const res = await docenteAlumnosGrupoRequest(user.token, grupoId, { q: q.trim(), estatus, page, size });
        if (vigente) setDatos(res);
      } catch (err) {
        if (vigente) {
          setDatos({ items: [], total: 0, totalPages: 1 });
          setError(err.message || 'No se pudieron cargar los alumnos.');
        }
      } finally {
        if (vigente) setCargando(false);
      }
    }, q ? 300 : 0);

    return () => {
      vigente = false;
      clearTimeout(espera);
    };
  }, [grupoId, user.token, q, estatus, page, size, version]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  return { alumnos: datos.items, total: datos.total, cargando, error, recargar };
}
