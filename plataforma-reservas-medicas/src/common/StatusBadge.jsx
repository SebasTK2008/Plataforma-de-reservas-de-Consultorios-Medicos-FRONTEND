function StatusBadge({ status }) {
  const statusMap = {
    SCHEDULED: { label: 'Programada', className: 'badge--blue' },
    CONFIRMED: { label: 'Confirmada', className: 'badge--green' },
    COMPLETED: { label: 'Completada', className: 'badge--gray' },
    CANCELLED: { label: 'Cancelada', className: 'badge--red' },
    NO_SHOW: { label: 'No asistió', className: 'badge--orange' },
  };

  const config = statusMap[status] ?? { label: status || '—', className: 'badge--gray' };

  return <span className={`badge ${config.className}`}>{config.label}</span>;
}

export default StatusBadge;
