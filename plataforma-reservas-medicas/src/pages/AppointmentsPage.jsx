import { useState, useEffect } from 'react';
import {
  Plus, Search, Calendar, ChevronLeft, ChevronRight,
  AlertCircle, X, Save, Loader, CheckCircle,
  XCircle, ClipboardList, UserX,
} from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { useAppointments } from '../hooks/useAppointments';
import { getPatients } from '../api/patientsApi';
import { getOffices } from '../api/officesApi';
import { getAppointmentTypes } from '../api/appointmentTypesApi';
import api from '../api/AxiosConfig';
import './AppointmentsPage.css';


// ── Badge de estado de la cita ────────────────────────────────
function AppointmentStatusBadge({ status }) {
  const MAP = {
    SCHEDULED:  { label: 'Programada',  cls: 'badge--blue'   },
    CONFIRMED:  { label: 'Confirmada',  cls: 'badge--green'  },
    COMPLETED:  { label: 'Completada',  cls: 'badge--teal'   },
    CANCELLED:  { label: 'Cancelada',   cls: 'badge--red'    },
    NO_SHOW:    { label: 'No asistió',  cls: 'badge--orange' },
  };
  const { label, cls } = MAP[status] ?? { label: status, cls: 'badge--gray' };
  return <span className={`badge ${cls}`}>{label}</span>;
}


// ── Botones de acción según estado ────────────────────────────
// Encapsula la lógica de "qué botones mostrar según el estado"
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


// ── Modal: Crear cita ─────────────────────────────────────────
// Este es el modal más complejo: necesita cargar 4 listas del backend
// para los dropdowns (pacientes, doctores, consultorios, tipos de cita)
function CreateAppointmentModal({ isOpen, onClose, onSubmit }) {

  // Datos de los dropdowns
  const [dropdowns, setDropdowns] = useState({
    patients: [], doctors: [], offices: [], appointmentTypes: [],
    loading: false, error: null,
  });

  // Datos del formulario
  const [form, setForm] = useState({
    patientId: '', doctorId: '', officeId: '',
    appointmentTypeId: '', startAt: '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);

  // Cargar los datos de los dropdowns al abrir el modal
  useEffect(() => {
    if (!isOpen) return;

    const loadDropdowns = async () => {
      setDropdowns(prev => ({ ...prev, loading: true, error: null }));
      try {
        // Promise.all carga todas las listas en paralelo
        const [patientsData, doctorsData, officesData, typesData] = await Promise.all([
          getPatients(0, 100),           // Primeros 100 pacientes
          api.get('/api/doctors', { params: { page: 0, size: 100 } }).then(r => r.data),
          getOffices(),                  // Todos los consultorios
          getAppointmentTypes(),         // Todos los tipos de cita
        ]);

        setDropdowns({
          patients:         patientsData.content ?? [],
          doctors:          doctorsData.content  ?? [],
          // Solo mostramos consultorios AVAILABLE para crear citas
          offices:          (officesData ?? []).filter(o => o.status === 'AVAILABLE'),
          appointmentTypes: typesData ?? [],
          loading: false, error: null,
        });
      } catch (err) {
        setDropdowns(prev => ({
          ...prev, loading: false,
          error: 'No se pudieron cargar los datos del formulario.',
        }));
      }
    };

    loadDropdowns();
    // Limpiar form al abrir
    setForm({ patientId: '', doctorId: '', officeId: '', appointmentTypeId: '', startAt: '' });
    setError(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patientId)         return setError('Selecciona un paciente.');
    if (!form.doctorId)          return setError('Selecciona un doctor.');
    if (!form.officeId)          return setError('Selecciona un consultorio.');
    if (!form.appointmentTypeId) return setError('Selecciona un tipo de cita.');
    if (!form.startAt)           return setError('Selecciona fecha y hora.');

    // Validar que la fecha sea futura
    if (new Date(form.startAt) <= new Date())
      return setError('La fecha y hora deben ser futuras.');

    setSaving(true);
    const result = await onSubmit({
      patientId:         form.patientId,
      doctorId:          form.doctorId,
      officeId:          form.officeId,
      appointmentTypeId: form.appointmentTypeId,
      // El input datetime-local da formato "2026-05-22T10:00"
      // que es exactamente lo que Spring Boot espera
      startAt: form.startAt,
    });

    if (result.success) {
      onClose();
    } else {
      setError(result.error);
      setSaving(false);
    }
  };

  // Fecha mínima para el datetime-local: ahora mismo
  const minDateTime = new Date(Date.now() + 60000)
    .toISOString().slice(0, 16);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--large" onClick={e => e.stopPropagation()}>

        <div className="modal__header">
          <h3>Nueva Cita Médica</h3>
          <button type="button" className="modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Error de carga de dropdowns */}
        {dropdowns.error && (
          <div className="modal__error">
            <AlertCircle size={16} /><span>{dropdowns.error}</span>
          </div>
        )}

        {/* Error de validación */}
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

              {/* Paciente */}
              <div className="form-group">
                <label htmlFor="a-patient">Paciente *</label>
                <select id="a-patient" name="patientId"
                  value={form.patientId} onChange={handleChange}
                  disabled={saving} className="form-select">
                  <option value="">— Seleccionar paciente —</option>
                  {dropdowns.patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} · {p.documentNumber}
                    </option>
                  ))}
                </select>
              </div>

              {/* Doctor */}
              <div className="form-group">
                <label htmlFor="a-doctor">Doctor *</label>
                <select id="a-doctor" name="doctorId"
                  value={form.doctorId} onChange={handleChange}
                  disabled={saving} className="form-select">
                  <option value="">— Seleccionar doctor —</option>
                  {dropdowns.doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.fullName}
                      {d.specialty ? ` · ${d.specialty.name}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Consultorio */}
              <div className="form-group">
                <label htmlFor="a-office">Consultorio *</label>
                <select id="a-office" name="officeId"
                  value={form.officeId} onChange={handleChange}
                  disabled={saving} className="form-select">
                  <option value="">— Seleccionar consultorio —</option>
                  {dropdowns.offices.map(o => (
                    <option key={o.id} value={o.id}>
                      Sala {o.roomNumber} · {o.name}
                    </option>
                  ))}
                </select>
                {dropdowns.offices.length === 0 && (
                  <p className="form-hint form-hint--warn">
                    No hay consultorios disponibles en este momento.
                  </p>
                )}
              </div>

              {/* Tipo de cita */}
              <div className="form-group">
                <label htmlFor="a-type">Tipo de Cita *</label>
                <select id="a-type" name="appointmentTypeId"
                  value={form.appointmentTypeId} onChange={handleChange}
                  disabled={saving} className="form-select">
                  <option value="">— Seleccionar tipo —</option>
                  {dropdowns.appointmentTypes.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} · {t.durationMinutes} min
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha y hora */}
              <div className="form-group form-group--full">
                <label htmlFor="a-start">Fecha y Hora de Inicio *</label>
                <input
                  id="a-start"
                  name="startAt"
                  type="datetime-local"
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
              <button type="button" className="btn btn--ghost"
                onClick={onClose} disabled={saving}>Cancelar</button>
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
// Solo requiere una razón (campo obligatorio)
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
      setError(result.error);
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--small" onClick={e => e.stopPropagation()}>
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
              onChange={e => { setReason(e.target.value); if (error) setError(null); }}
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
// Observaciones son opcionales
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
      setError(result.error);
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--small" onClick={e => e.stopPropagation()}>
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
              <span className="label-optional">(opcional)</span>
            </label>
            <textarea
              id="obs"
              className="form-textarea"
              rows={3}
              placeholder="Ej: Paciente respondió bien al tratamiento..."
              value={observations}
              onChange={e => setObservations(e.target.value)}
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
          <div style={{ width: 160, height: 28, borderRadius: 6, flexShrink: 0, background: 'linear-gradient(90deg,var(--color-border) 25%,var(--color-bg) 50%,var(--color-border) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
        </div>
      ))}
    </div>
  );
}


// ── Página principal ──────────────────────────────────────────
function AppointmentsPage() {

  const {
    appointments, loading, error,
    totalPages, totalElements,
    currentPage, setCurrentPage,
    filters, updateFilters,
    doCreate, doConfirm, doCancel, doComplete, doNoShow,
  } = useAppointments();

  // Estado de los modales
  const [createOpen,          setCreateOpen]          = useState(false);
  const [cancelAppointment,   setCancelAppointment]   = useState(null);
  const [completeAppointment, setCompleteAppointment] = useState(null);

  // loadingId: UUID de la cita que está en progreso de acción
  // Permite mostrar spinner solo en el botón de esa fila
  const [loadingId, setLoadingId] = useState(null);

  // ── Handlers de acciones ────────────────────────────────
  const handleConfirm = async (id) => {
    setLoadingId(id);
    await doConfirm(id);
    setLoadingId(null);
  };

  const handleNoShow = async (id) => {
    setLoadingId(id);
    await doNoShow(id);
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

        {/* ── Encabezado ─────────────────────────────────── */}
        <div className="page-header">
          <div>
            <h2 className="page-header__title">Gestión de Citas</h2>
            <p className="page-header__subtitle">
              {loading ? 'Cargando...' : `${totalElements} cita${totalElements !== 1 ? 's' : ''} encontrada${totalElements !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button className="btn btn--primary" onClick={() => setCreateOpen(true)}>
            <Plus size={18} /> Nueva Cita
          </button>
        </div>

        {/* ── Filtros ─────────────────────────────────────── */}
        <div className="filters-bar">
          <select
            className="filter-select"
            value={filters.status}
            onChange={e => updateFilters({ ...filters, status: e.target.value })}
          >
            <option value="">Todos los estados</option>
            <option value="SCHEDULED">Programadas</option>
            <option value="CONFIRMED">Confirmadas</option>
            <option value="COMPLETED">Completadas</option>
            <option value="CANCELLED">Canceladas</option>
            <option value="NO_SHOW">No asistieron</option>
          </select>
        </div>

        {/* ── Error ───────────────────────────────────────── */}
        {error && (
          <div className="alert alert--error">
            <AlertCircle size={18} /><span>{error}</span>
          </div>
        )}

        {/* ── Tabla ───────────────────────────────────────── */}
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
              {!filters.status && (
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
                  {appointments.map(appt => (
                    <tr key={appt.id}>

                      <td>
                        <div className="person-cell">
                          <div className="person-cell__avatar person-cell__avatar--patient">
                            {appt.patient?.fullName?.charAt(0).toUpperCase() ?? '?'}
                          </div>
                          <span className="person-cell__name">
                            {appt.patient?.fullName ?? '—'}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="person-cell">
                          <div className="person-cell__avatar person-cell__avatar--doctor">
                            {appt.doctor?.fullName?.charAt(0).toUpperCase() ?? '?'}
                          </div>
                          <span className="person-cell__name">
                            {appt.doctor?.fullName ?? '—'}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="date-cell">
                          <span className="date-cell__date">
                            {new Date(appt.startAt).toLocaleDateString('es-CO', {
                              day: '2-digit', month: 'short', year: 'numeric'
                            })}
                          </span>
                          <span className="date-cell__time">
                            {new Date(appt.startAt).toLocaleTimeString('es-CO', {
                              hour: '2-digit', minute: '2-digit'
                            })}
                            {appt.endAt && ` – ${new Date(appt.endAt).toLocaleTimeString('es-CO', {
                              hour: '2-digit', minute: '2-digit'
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

        {/* ── Paginación ─────────────────────────────────── */}
        {!loading && totalPages > 1 && (
          <div className="pagination">
            <span className="pagination__info">
              Página {currentPage + 1} de {totalPages}
            </span>
            <div className="pagination__controls">
              <button className="pagination__btn"
                onClick={() => setCurrentPage(p => p - 1)}
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
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage === totalPages - 1}>
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        )}

        {/* ── Modales ────────────────────────────────────── */}
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