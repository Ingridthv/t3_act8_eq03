import { GraduationCap } from 'lucide-react';

// Marco visual de las pantallas públicas (mismo diseño que el login).
export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="login">
      <section className="login__hero" aria-hidden="true">
        <span className="login__circle login__circle--large" />
        <span className="login__circle login__circle--small" />
        <div className="login__brand">
          <span className="logo-mark"><GraduationCap size={24} /></span>
          <span className="login__brand-name">Control Alumnos</span>
        </div>
        <h2 className="login__headline">Gestiona la información de los estudiantes</h2>
      </section>
      <section className="login__panel">
        <div className="login__card">
          <header className="login__header">
            <h1 className="login__title">{title}</h1>
            {subtitle && <p className="login__subtitle">{subtitle}</p>}
          </header>
          {children}
        </div>
      </section>
    </div>
  );
}
