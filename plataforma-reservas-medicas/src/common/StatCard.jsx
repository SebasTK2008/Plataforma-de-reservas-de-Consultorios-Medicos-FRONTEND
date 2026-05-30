function StatCard({ title, value, icon: Icon, variant = 'blue', loading, subtitle }) {
  return (
    <div className={`stats-card stats-card--${variant}`}>
      <div className="stats-card__icon">
        <Icon size={24} />
      </div>
      <div className="stats-card__content">
        <p className="stats-card__title">{title}</p>
        {loading ? (
          <div className="stats-card__skeleton" />
        ) : (
          <p className="stats-card__value">{value ?? '—'}</p>
        )}
        {subtitle && <p className="stats-card__subtitle">{subtitle}</p>}
      </div>
    </div>
  );
}

export default StatCard;
