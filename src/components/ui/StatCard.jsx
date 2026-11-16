export default function StatCard({ icon: Icon, label, value }) {
  return (
    <article className="stat-card">
      <span className="stat-card__icon">
        <Icon size={24} aria-hidden="true" />
      </span>
      <div className="stat-card__body">
        <p className="stat-card__label">{label}</p>
        <p className="stat-card__value">{value}</p>
      </div>
    </article>
  );
}
