import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, Calendar, ChevronLeft, ChevronRight,
  AlertCircle, X, Loader, CheckCircle,
  XCircle, ClipboardList, UserX,
} from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { useAppointments } from '../hooks/useAppointments';
import { getPatients } from '../api/patientsApi';
import { getOffices } from '../api/officesApi';
import { getAppointmentTypes } from '../api/appointmentTypesApi';
import api from '../api/AxiosConfig';
import './AppointmentsPage.css';
import { useAuth } from '../hooks/useAuth';


// ════════════════════════════════════════════════════════════════
// HELPER: traducir mensajes de error del backend al español
// ════════════════════════════════════════════════════════════════
function translateError(message) {
  if (!message) return 'Ocurrió un error inesperado. Intenta de nuevo.';
  const msg = message.toLowerCase();

  if (msg.includes('only scheduled appointments can be confirmed'))
    return 'Solo las citas en estado "Programada" pueden confirmarse.';
  if (msg.includes('only scheduled or confirmed appointments can be cancelled'))
    return 'Solo las citas "Programadas" o "Confirmadas" pueden cancelarse.';
  if (msg.includes('cancel reason is required'))
    return 'El motivo de cancelación es obligatorio.';
  if (msg.includes('only confirmed appointments can be completed'))
    return 'Solo las citas "Confirmadas" pueden marcarse como completadas.';
  if (msg.includes('cannot be completed before its scheduled start time'))
    return 'No puedes completar una cita antes de su hora de inicio programada.';
  if (msg.includes('only confirmed appointments can be marked as no_show'))
    return 'Solo las citas "Confirmadas" pueden marcarse como No Asistió.';
  if (msg.includes('cannot be marked as no_show before its scheduled start time'))
    return 'No puedes registrar inasistencia antes de la hora de inicio de la cita.';
  if (msg.includes('access denied') || msg.includes('forbidden'))
    return 'No tienes permiso para realizar esta acción con tu rol actual.';
  if (msg.includes('conflict'))
    return 'Esta acción no es válida para el estado actual de la cita.';

  return message;
}


// ════════════════════════════════════════════════════════════════
// HELPER: hora mínima en hora local (fix UTC bug)
// ════════════════════════════════════════════════════════════════
function localDateTimeMin() {
  const now = new Date(Date.now() + 60000);

  // Sumar 5 horas
  now.setHours(now.getHours() + 5);

  const pad = (n) => String(n).padStart(2, '0');

  return (
    `${now.getFullYear()}-` +
    `${pad(now.getMonth() + 1)}-` +
    `${pad(now.getDate())}T` +
    `${pad(now.getHours())}:` +
    `${pad(now.getMinutes())}`
  );
}


// ── Badge de estado ───────────────────────────────────────────
function AppointmentStatusBadge({ status }) {
  const MAP = {
    SCHEDULED: { label: 'Programada',  cls: 'badge--blue'   },
    CONFIRMED: { label: 'Confirmada',  cls: 'badge--green'  },
    COMPLETED: { label: 'Completada',  cls: 'badge--teal'   },
    CANCELLED: { label: 'Cancelada',   cls: 'badge--red'    },
    NO_SHOW:   { label: 'No asistió',  cls: 'badge--orange' },
  };
  const { label, cls } = MAP[status] ?? { label: status, cls: 'badge--gray' };
  return <span className={`badge ${cls}`}>{label}</span>;
}


// ── Botones de acción según estado ────────────────────────────
function ActionButtons({ appointment, onConfirm, onCancel, onComplete, onNoShow, loadingId }) {
  const { id, status } = appointment;
  const isLoading = loadingId === id;

  if (status === 'COMPLETED' || status === 'CANCELLED' || status === 'NO_SHOW') {
    return <span className="no-actions">—</span>;
  }

  return (
    <div className="action-buttons">
      {status === 'SCHEDULED' && (
        <button
          className="appt-btn appt-btn--confirm"
          onClick={() => onConfirm(id)}
          disabled={isLoading}
          title="Confirmar cita"
        >
          {isLoading ? <Loader size={13} className="spin" /> : <CheckCircle size={13} />}
          Confirmar
        </button>
      )}

      {status === 'CONFIRMED' && (
        <>
          <button
            className="appt-btn appt-btn--complete"
            onClick={() => onComplete(appointment)}
            disabled={isLoading}
            title="Marcar como completada"
          >
            <ClipboardList size={13} /> Completar
          </button>
          <button
            className="appt-btn appt-btn--noshow"
            onClick={() => onNoShow(id)}
            disabled={isLoading}
            title="Marcar como no asistió"
          >
            {isLoading ? <Loader size={13} className="spin" /> : <UserX size={13} />}
            No asistió
          </button>
        </>
      )}

      {(status === 'SCHEDULED' || status === 'CONFIRMED') && (
        <button
          className="appt-btn appt-btn--cancel"
          onClick={() => onCancel(appointment)}
          disabled={isLoading}
          title="Cancelar cita"
        >
          <XCircle size={13} /> Cancelar
        </button>
      )}
    </div>
  );
}


// ════════════════════════════════════════════════════════════════
// COMPONENTE: SearchableSelect
// ════════════════════════════════════════════════════════════════
//
// Usa su propia clase CSS "searchable-select__input" en lugar de
// "form-select", para evitar heredar el chevron y otros estilos
// propios del <select> nativo.
// El dropdown se posiciona con position:absolute sobre el flujo
// normal; el wrapper tiene position:relative para contenerlo.
function SearchableSelect({ id, items, value, onChange, labelFn, sublabelFn, placeholder, disabled }) {
  const [query, setQuery] = useState('');
  const [open,  setOpen]  = useState(false);

  const selected = items.find((i) => String(i.id) === String(value)) ?? null;

  const filtered = (() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 10);
    return items.filter(
      (i) =>
        labelFn(i).toLowerCase().includes(q) ||
        (i.documentNumber && i.documentNumber.includes(q))
    );
  })();

  const highlight = (text) => {
    const q = query.trim();
    if (!q || !text) return text ?? '';
    const re = new RegExp(
      `(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
      'gi'
    );
    return text.replace(re, '<mark class="ss-highlight">$1</mark>');
  };

  const handleSelect = (item) => {
    onChange(String(item.id));
    setQuery('');
    setOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setQuery('');
  };

  return (
    <div className="searchable-select">
      {/* Trigger / input de búsqueda */}
      <div className="searchable-select__trigger">
        <Search size={14} className="searchable-select__icon" aria-hidden="true" />

        <input
          id={id}
          type="text"
          className={`searchable-select__input${selected ? ' searchable-select__input--selected' : ''}`}
          placeholder={selected ? labelFn(selected) : placeholder}
          value={selected ? '' : query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange('');
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          autoComplete="off"
        />

        {selected && !disabled && (
          <button
            type="button"
            className="searchable-select__clear"
            onClick={handleClear}
            title="Limpiar selección"
            aria-label="Limpiar selección"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Chip de selección activa */}
      {selected && (
        <p className="searchable-select__chip">
          <CheckCircle size={12} className="searchable-select__chip-icon" />
          <span className="searchable-select__chip-name">{labelFn(selected)}</span>
          {selected.documentNumber && (
            <span className="searchable-select__chip-doc">{selected.documentNumber}</span>
          )}
        </p>
      )}

      {/* Dropdown */}
      {open && !selected && (
        <div className="searchable-select__dropdown">
          {filtered.length === 0 ? (
            <div className="searchable-select__empty">
              Sin resultados para "<strong>{query}</strong>"
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="searchable-select__option"
                onMouseEnter={(e) => e.currentTarget.classList.add('searchable-select__option--hover')}
                onMouseLeave={(e) => e.currentTarget.classList.remove('searchable-select__option--hover')}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(item);
                }}
              >
                <span
                  className="searchable-select__option-name"
                  dangerouslySetInnerHTML={{ __html: highlight(labelFn(item)) }}
                />
                {sublabelFn && (
                  <span
                    className="searchable-select__option-sub"
                    dangerouslySetInnerHTML={{ __html: highlight(sublabelFn(item)) }}
                  />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}


// ── Modal: Crear cita ─────────────────────────────────────────
function CreateAppointmentModal({ isOpen, onClose, onSubmit }) {
  const [dropdowns, setDropdowns] = useState({
    patients: [], doctors: [], offices: [], appointmentTypes: [],
    loading: false, error: null,
  });

  const [form, setForm] = useState({
    patientId: '', doctorId: '', officeId: '',
    appointmentTypeId: '', startAt: '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadDropdowns = async () => {
      setDropdowns((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const [patientsData, doctorsData, officesData, typesData] = await Promise.all([
          getPatients(0, 100),
          api.get('/api/doctors', { params: { page: 0, size: 100 } }).then((r) => r.data),
          getOffices(),
          getAppointmentTypes(),
        ]);

        setDropdowns({
          patients:         patientsData.content ?? [],
          doctors:          doctorsData.content  ?? [],
          offices:          (officesData ?? []).filter((o) => o.status === 'AVAILABLE'),
          appointmentTypes: typesData ?? [],
          loading: false, error: null,
        });
      } catch {
        setDropdowns((prev) => ({
          ...prev, loading: false,
          error: 'No se pudieron cargar los datos del formulario.',
        }));
      }
    };

    loadDropdowns();
    setForm({ patientId: '', doctorId: '', officeId: '', appointmentTypeId: '', startAt: '' });
    setError(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patientId)         return setError('Selecciona un paciente.');
    if (!form.doctorId)          return setError('Selecciona un doctor.');
    if (!form.officeId)          return setError('Selecciona un consultorio.');
    if (!form.appointmentTypeId) return setError('Selecciona un tipo de cita.');
    if (!form.startAt)           return setError('Selecciona fecha y hora.');

    if (new Date(form.startAt) <= new Date())
      return setError('La fecha y hora deben ser futuras.');

    setSaving(true);
    const result = await onSubmit({
      patientId:         form.patientId,
      doctorId:          form.doctorId,
      officeId:          form.officeId,
      appointmentTypeId: form.appointmentTypeId,
      // Fix zona horaria: convierte hora local → ISO UTC para que el backend
      // valide correctamente (el backend trabaja en UTC)
      startAt: new Date(form.startAt).toISOString(),
    });

    if (result.success) {
      onClose();
    } else {
      setError(result.error);
      setSaving(false);
    }
  };

  const minDateTime = localDateTimeMin();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--large" onClick={(e) => e.stopPropagation()}>

        <div className="modal__header">
          <h3>Nueva Cita Médica</h3>
          <button type="button" className="modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {dropdowns.error && (
          <div className="modal__error">
            <AlertCircle size={16} /><span>{dropdowns.error}</span>
          </div>
        )}

        {error && (
          <div className="modal__error">
            <AlertCircle size={16} /><span>{error}</span>
          </div>
        )}

        {dropdowns.loading ? (
          <div className="modal__loading">
            <Loader size={28} className="spin" />
            <p>Cargando datos del formulario...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal__form">
            <div className="form-grid">

              {/* ── Paciente ── */}
              <div className="form-group">
                <label htmlFor="a-patient">Paciente *</label>
                <SearchableSelect
                  id="a-patient"
                  items={dropdowns.patients}
                  value={form.patientId}
                  onChange={(v) => { setForm((p) => ({ ...p, patientId: v })); if (error) setError(null); }}
                  labelFn={(p) => p.fullName}
                  sublabelFn={(p) => p.documentNumber ?? ''}
                  placeholder="Buscar por nombre o N.º documento..."
                  disabled={saving}
                />
              </div>

              {/* ── Doctor ── */}
              <div className="form-group">
                <label htmlFor="a-doctor">Doctor *</label>
                <SearchableSelect
                  id="a-doctor"
                  items={dropdowns.doctors}
                  value={form.doctorId}
                  onChange={(v) => { setForm((p) => ({ ...p, doctorId: v })); if (error) setError(null); }}
                  labelFn={(d) => d.fullName}
                  sublabelFn={(d) =>
                    [d.documentNumber, d.specialty?.name].filter(Boolean).join(' · ')
                  }
                  placeholder="Buscar por nombre o N.º documento..."
                  disabled={saving}
                />
              </div>

              {/* ── Consultorio ── */}
              <div className="form-group">
                <label htmlFor="a-office">Consultorio *</label>
                <select
                  id="a-office"
                  name="officeId"
                  value={form.officeId}
                  onChange={handleChange}
                  disabled={saving}
                  className="form-select"
                >
                  <option value="">— Seleccionar consultorio —</option>
                  {dropdowns.offices.map((o) => (
                    <option key={o.id} value={o.id}>
                      Sala {o.roomNumber} · {o.name}
                    </option>
                  ))}
                </select>
                {dropdowns.offices.length === 0 && (
                  <p className="form-hint form-hint--warn">
                    No hay consultorios disponibles.
                  </p>
                )}
              </div>

              {/* ── Tipo de cita ── */}
              <div className="form-group">
                <label htmlFor="a-type">Tipo de Cita *</label>
                <select
                  id="a-type"
                  name="appointmentTypeId"
                  value={form.appointmentTypeId}
                  onChange={handleChange}
                  disabled={saving}
                  className="form-select"
                >
                  <option value="">— Seleccionar tipo —</option>
                  {dropdowns.appointmentTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} · {t.durationMinutes} min
                    </option>
                  ))}
                </select>
              </div>

              {/* ── Fecha y hora ── */}
              <div className="form-group form-group--full">
                <label htmlFor="a-start">Fecha y Hora de Inicio *</label>
                <input
                  id="a-start"
                  name="startAt"
                  type="datetime-local"
                  className="form-select"
                  value={form.startAt}
                  min={minDateTime}
                  onChange={handleChange}
                  disabled={saving}
                />
                <p className="form-hint">
                  La hora de fin se calcula automáticamente según el tipo de cita.
                </p>
              </div>

            </div>

            <div className="modal__footer">
              <button type="button" className="btn btn--ghost" onClick={onClose} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving
                  ? <><Loader size={16} className="spin" /> Creando cita...</>
                  : <><Calendar size={16} /> Crear Cita</>
                }
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}


// ── Modal: Cancelar cita ──────────────────────────────────────
function CancelModal({ isOpen, appointment, onClose, onSubmit }) {
  const [reason,  setReason]  = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (isOpen) { setReason(''); setError(null); }
  }, [isOpen]);

  if (!isOpen || !appointment) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return setError('El motivo de cancelación es obligatorio.');
    setSaving(true);
    const result = await onSubmit(appointment.id, reason.trim());
    if (result.success) {
      onClose();
    } else {
      setError(translateError(result.error));
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--small" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3>Cancelar Cita</h3>
          <button type="button" className="modal__close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal__info">
          <p className="modal__info-text">
            <strong>Paciente:</strong> {appointment.patient?.fullName ?? '—'}<br />
            <strong>Doctor:</strong>   {appointment.doctor?.fullName  ?? '—'}<br />
            <strong>Fecha:</strong>    {formatDate(appointment.startAt)}
          </p>
        </div>

        {error && <div className="modal__error"><AlertCircle size={16} /><span>{error}</span></div>}

        <form onSubmit={handleSubmit} className="modal__form">
          <div className="form-group">
            <label htmlFor="cancel-reason">Motivo de Cancelación *</label>
            <textarea
              id="cancel-reason"
              className="form-textarea"
              rows={3}
              placeholder="Describe el motivo de la cancelación..."
              value={reason}
              onChange={(e) => { setReason(e.target.value); if (error) setError(null); }}
              disabled={saving}
              maxLength={1000}
            />
            <p className="form-hint">{reason.length}/1000 caracteres</p>
          </div>
          <div className="modal__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose} disabled={saving}>
              Volver
            </button>
            <button type="submit" className="btn btn--danger" disabled={saving}>
              {saving
                ? <><Loader size={16} className="spin" /> Cancelando...</>
                : <><XCircle size={16} /> Confirmar Cancelación</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ── Modal: Completar cita ─────────────────────────────────────
function CompleteModal({ isOpen, appointment, onClose, onSubmit }) {
  const [observations, setObservations] = useState('');
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState(null);

  useEffect(() => {
    if (isOpen) { setObservations(''); setError(null); }
  }, [isOpen]);

  if (!isOpen || !appointment) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const result = await onSubmit(appointment.id, observations.trim() || null);
    if (result.success) {
      onClose();
    } else {
      setError(translateError(result.error));
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--small" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3>Completar Cita</h3>
          <button type="button" className="modal__close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal__info">
          <p className="modal__info-text">
            <strong>Paciente:</strong> {appointment.patient?.fullName ?? '—'}<br />
            <strong>Doctor:</strong>   {appointment.doctor?.fullName  ?? '—'}
          </p>
        </div>

        {error && <div className="modal__error"><AlertCircle size={16} /><span>{error}</span></div>}

        <form onSubmit={handleSubmit} className="modal__form">
          <div className="form-group">
            <label htmlFor="obs">
              Observaciones
              <span className="label-optional"> (opcional)</span>
            </label>
            <textarea
              id="obs"
              className="form-textarea"
              rows={3}
              placeholder="Ej: Paciente respondió bien al tratamiento..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              disabled={saving}
              maxLength={1000}
            />
          </div>
          <div className="modal__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving
                ? <><Loader size={16} className="spin" /> Guardando...</>
                : <><CheckCircle size={16} /> Marcar como Completada</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ── ActionErrorToast ──────────────────────────────────────────
function ActionErrorToast({ message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="action-error-toast">
      <AlertCircle size={17} className="action-error-toast__icon" />
      <span className="action-error-toast__text">{message}</span>
      <button type="button" className="action-error-toast__close" onClick={onClose} aria-label="Cerrar">
        <X size={15} />
      </button>
    </div>
  );
}


// ── Helper: formatear fecha ───────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}


// ── Skeleton de carga ─────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="skeleton-table">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="skeleton-row">
          <div className="sk sk--name" />
          <div className="sk sk--md" />
          <div className="sk sk--md" />
          <div className="sk sk--badge" />
          <div style={{
            width: 160, height: 28, borderRadius: 6, flexShrink: 0,
            background: 'linear-gradient(90deg,var(--color-border) 25%,var(--color-bg) 50%,var(--color-border) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s infinite',
          }} />
        </div>
      ))}
    </div>
  );
}


// ════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════════════
function AppointmentsPage() {
  const { user } = useAuth();
  const roles = useMemo(() => {
      if (!user?.roles) return [];
      return Array.isArray(user.roles) ? user.roles : [user.roles];
    }, [user]);
  console.log('user:', user);
  console.log('roles:', roles);
  console.log('isDoctor:', roles.includes('ROLE_DOCTOR'));

  const {
    appointments, loading, error,
    totalPages, totalElements,
    currentPage, setCurrentPage,
    filters, updateFilters,
    doCreate, doConfirm, doCancel, doComplete, doNoShow,isDoctor,
  }  = useAppointments(roles);

  const [createOpen,          setCreateOpen]          = useState(false);
  const [cancelAppointment,   setCancelAppointment]   = useState(null);
  const [completeAppointment, setCompleteAppointment] = useState(null);
  const [loadingId,           setLoadingId]           = useState(null);
  const [actionError,         setActionError]         = useState(null);

  const handleConfirm = async (id) => {
    setLoadingId(id);
    setActionError(null);
    const result = await doConfirm(id);
    if (!result.success) setActionError(translateError(result.error));
    setLoadingId(null);
  };

  const handleNoShow = async (id) => {
    setLoadingId(id);
    setActionError(null);
    const result = await doNoShow(id);
    if (!result.success) setActionError(translateError(result.error));
    setLoadingId(null);
  };

  const handleCancelSubmit = async (id, reason) => {
    const result = await doCancel(id, reason);
    if (result.success) setCancelAppointment(null);
    return result;
  };

  const handleCompleteSubmit = async (id, observations) => {
    const result = await doComplete(id, observations);
    if (result.success) setCompleteAppointment(null);
    return result;
  };

  return (
    <MainLayout pageTitle="Citas">
      <div className="appointments-page">

        <div className="page-header">
          <div>
            <h2 className="page-header__title">Gestión de Citas</h2>
            <p className="page-header__subtitle">
              {loading
                ? 'Cargando...'
                : `${totalElements} cita${totalElements !== 1 ? 's' : ''} encontrada${totalElements !== 1 ? 's' : ''}`}
            </p>
          </div>
          {!isDoctor && (
          <button className="btn btn--primary" onClick={() => setCreateOpen(true)}>
          <Plus size={18} /> Nueva Cita
          </button>
          )}
        </div>

        <div className="filters-bar">
          <select
            className="filter-select"
            value={filters.status}
            onChange={(e) => updateFilters({ ...filters, status: e.target.value })}
          >
            <option value="">Todos los estados</option>
            <option value="SCHEDULED">Programadas</option>
            <option value="CONFIRMED">Confirmadas</option>
            <option value="COMPLETED">Completadas</option>
            <option value="CANCELLED">Canceladas</option>
            <option value="NO_SHOW">No asistieron</option>
          </select>
        </div>

        {error && (
          <div className="alert alert--error">
            <AlertCircle size={18} /><span>{error}</span>
          </div>
        )}

        <ActionErrorToast message={actionError} onClose={() => setActionError(null)} />

        <div className="table-card">
          {loading ? (
            <LoadingSkeleton />
          ) : appointments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon"><Calendar size={40} /></div>
              <h3>No hay citas</h3>
              <p>
                {filters.status
                  ? `No se encontraron citas con estado "${filters.status}".`
                  : 'Comienza creando la primera cita del sistema.'}
              </p>
              {!filters.status && !isDoctor && (
                <button className="btn btn--primary" onClick={() => setCreateOpen(true)}>
                  <Plus size={16} /> Nueva Cita
                </button>
              )}
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Doctor</th>
                    <th>Fecha y Hora</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appt) => (
                    <tr key={appt.id}>
                      <td>
                        <div className="person-cell">
                          <div className="person-cell__avatar person-cell__avatar--patient">
                            {appt.patient?.fullName?.charAt(0).toUpperCase() ?? '?'}
                          </div>
                          <span className="person-cell__name">{appt.patient?.fullName ?? '—'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="person-cell">
                          <div className="person-cell__avatar person-cell__avatar--doctor">
                            {appt.doctor?.fullName?.charAt(0).toUpperCase() ?? '?'}
                          </div>
                          <span className="person-cell__name">{appt.doctor?.fullName ?? '—'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="date-cell">
                          <span className="date-cell__date">
                            {new Date(appt.startAt).toLocaleDateString('es-CO', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })}
                          </span>
                          <span className="date-cell__time">
                            {new Date(appt.startAt).toLocaleTimeString('es-CO', {
                              hour: '2-digit', minute: '2-digit',
                            })}
                            {appt.endAt && ` – ${new Date(appt.endAt).toLocaleTimeString('es-CO', {
                              hour: '2-digit', minute: '2-digit',
                            })}`}
                          </span>
                        </div>
                      </td>
                      <td><AppointmentStatusBadge status={appt.status} /></td>
                      <td>
                        <ActionButtons
                          appointment={appt}
                          loadingId={loadingId}
                          onConfirm={handleConfirm}
                          onNoShow={handleNoShow}
                          onCancel={(a) => setCancelAppointment(a)}
                          onComplete={(a) => setCompleteAppointment(a)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && totalPages > 1 && (
          <div className="pagination">
            <span className="pagination__info">
              Página {currentPage + 1} de {totalPages}
            </span>
            <div className="pagination__controls">
              <button className="pagination__btn"
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 0}>
                <ChevronLeft size={17} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i}
                  className={`pagination__btn ${currentPage === i ? 'pagination__btn--active' : ''}`}
                  onClick={() => setCurrentPage(i)}>
                  {i + 1}
                </button>
              ))}
              <button className="pagination__btn"
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage === totalPages - 1}>
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        )}

        <CreateAppointmentModal
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
          onSubmit={doCreate}
        />
        <CancelModal
          isOpen={cancelAppointment !== null}
          appointment={cancelAppointment}
          onClose={() => setCancelAppointment(null)}
          onSubmit={handleCancelSubmit}
        />
        <CompleteModal
          isOpen={completeAppointment !== null}
          appointment={completeAppointment}
          onClose={() => setCompleteAppointment(null)}
          onSubmit={handleCompleteSubmit}
        />

      </div>
    </MainLayout>
  );
}

export default AppointmentsPage;