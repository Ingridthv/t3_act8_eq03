import { Construction } from 'lucide-react';

export default function PlaceholderPage({ title }) {
  return (
    <section className="card state">
      <Construction size={32} aria-hidden="true" />
      <h2 className="state__title">{title}</h2>
      <p className="state__text">Esta sección está en construcción. Su diseño ya existe en Figma.</p>
    </section>
  );
}
