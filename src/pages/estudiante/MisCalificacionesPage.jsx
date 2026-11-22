import { listCalificaciones } from '../../services/estudianteApi.js';
import CalificacionesLista from './CalificacionesLista.jsx';

export default function MisCalificacionesPage() {
  return (
    <div className="page">
      <section className="card">
        <CalificacionesLista
          titulo="Mis calificaciones"
          fetcher={listCalificaciones}
          conDocente
          filtroEstatus
          noun="calificaciones"
          vacio="No se encontraron calificaciones. Cambia la búsqueda o limpia los filtros."
        />
      </section>
    </div>
  );
}
