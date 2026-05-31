function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-state__icon">
          <Icon size={32} />
        </div>
      )}
      {title && <h3 className="empty-state__title">{title}</h3>}
      {description && <p>{description}</p>}
    </div>
  );
}

export default EmptyState;
