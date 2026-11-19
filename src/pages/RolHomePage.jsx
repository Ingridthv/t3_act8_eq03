import { GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const TEXTOS = {
  docente: 'Módulo de docente',
  estudiante: 'Módulo de estudiante',
};

// Pantalla temporal de cada rol mientras se construyen sus módulos.
export default function RolHomePage({ rol }) {
  const { user, logout } = useAuth();
  return (
    <main className="app-shell__main">
      <section className="card state">
        <GraduationCap size={32} aria-hidden="true" />
        <h2 className="state__title">Bienvenido, {user.firstName}</h2>
        <p className="state__text">
          {TEXTOS[rol]} en construcción. Iniciaste sesión como {rol} ({user.email}).
        </p>
        <button type="button" className="btn btn--primary" onClick={logout}>
          Cerrar sesión
        </button>
      </section>
    </main>
  );
}
