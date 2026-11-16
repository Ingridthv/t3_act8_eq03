import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

// Pide al "servidor" una página de datos cada vez que cambian los parámetros.
// Ignora respuestas viejas si el usuario cambió de filtro mientras cargaba.
export function useServerList(fetcher, params) {
  const key = JSON.stringify(params);
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: '' }));
    fetcher(JSON.parse(key))
      .then((data) => !cancelled && setState({ data, loading: false, error: '' }))
      .catch((err) => !cancelled && setState((s) => ({ ...s, loading: false, error: err.message || 'No se pudieron cargar los datos.' })));
    return () => {
      cancelled = true;
    };
  }, [key, tick, fetcher]);

  return { ...state, reload: () => setTick((t) => t + 1) };
}

// Filtros y página guardados en la URL (se conservan al recargar o compartir el enlace).
export function useListParams(keys, defaults = {}) {
  const [sp, setSp] = useSearchParams();
  const params = { page: Math.max(1, Number.parseInt(sp.get('page'), 10) || 1) };
  keys.forEach((k) => {
    params[k] = sp.has(k) ? sp.get(k) : (defaults[k] ?? '');
  });

  const set = (patch) => {
    const next = new URLSearchParams(sp);
    Object.entries(patch).forEach(([k, v]) => {
      // Un valor vacío se guarda como "" cuando el default no es vacío, para distinguirlo.
      if (v === '' && defaults[k]) next.set(k, '');
      else if (v === '' || v == null) next.delete(k);
      else next.set(k, String(v));
    });
    if (!('page' in patch)) next.delete('page');
    setSp(next, { replace: true });
  };
  return [params, set];
}
