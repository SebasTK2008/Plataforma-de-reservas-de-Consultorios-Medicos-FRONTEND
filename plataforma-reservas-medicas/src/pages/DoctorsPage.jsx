// DoctorsPage.jsx
//
// CAMBIOS REALIZADOS:
//
// 1. MODAL DE DISPONIBILIDAD
//    Se añade un botón "Ver disponibilidad" en cada fila de la tabla.
//    Al hacer clic abre un modal con un date picker. El usuario elige una fecha
//    y el sistema consulta GET /api/availability/doctors/{id}?date=YYYY-MM-DD.
//    El backend devuelve los slots disponibles del día, que se muestran
//    en una cuadrícula de chips de horarios.
//
//    ¿Por qué un modal separado y no en el mismo modal de edición?
//    Porque la disponibilidad es información de consulta, no de edición.
//    Mezclarla con el formulario de edición haría el modal demasiado grande
//    y confuso. Dos responsabilidades → dos modales.
//
// 2. SCHEDULES INTEGRADO EN DOCTORES
//    La página SchedulesPage.jsx queda como "Under Construction" o puede
//    simplemente redirigir aquí. La creación de horarios ya estaba
//    integrada en el modal de CREAR doctor (sección inferior del form).
//    No hay duplicación: al editar un doctor no se muestran horarios
//    porque no hay endpoint de edición de horarios individuales aún.
//
// 3. ESTRUCTURA DE ARCHIVOS
//    Este archivo importa availabilityApi para la disponibilidad.
//    Todo lo demás permanece igual que antes.

import { useState, useEffect } from 'react';
import {
  Plus, Search, Edit2, UserRound,
  ChevronLeft, ChevronRight,
  AlertCircle, X, Save, Loader,
  Stethoscope, Clock, PlusCircle, Trash2,
  CalendarDays, ChevronDown,
} from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { useDoctors } from '../hooks/useDoctors';
import { useSpecialties } from '../hooks/useSpecialties';
import { getAvailableSlots } from '../api/availabilityApi';
import api from '../api/AxiosConfig';
import './DoctorsPage.css';


// ── Constantes ─────────────────────────────────────────────────
const DAYS_OF_WEEK = [
  { value: 'MONDAY',    label: 'Lunes'     },
  { value: 'TUESDAY',   label: 'Martes'    },
  { value: 'WEDNESDAY', label: 'Miércoles' },
  { value: 'THURSDAY',  label: 'Jueves'    },
  { value: 'FRIDAY',    label: 'Viernes'   },
  { value: 'SATURDAY',  label: 'Sábado'    },
  { value: 'SUNDAY',    label: 'Domingo'   },
];

const EMPTY_SCHEDULE = { dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '17:00' };


// ════════════════════════════════════════════════════════════════
// COMPONENTE: DoctorStatusBadge
// ════════════════════════════════════════════════════════════════
function DoctorStatusBadge({ status }) {
  const MAP = {
    ACTIVE:   { label: 'Activo',   cls: 'badge--green' },
    INACTIVE: { label: 'Inactivo', cls: 'badge--gray'  },
  };
  const { label, cls } = MAP[status] ?? { label: status, cls: 'badge--gray' };
  return <span className={`badge ${cls}`}>{label}</span>;
}


// ════════════════════════════════════════════════════════════════
// COMPONENTE: AvailabilityModal
// ════════════════════════════════════════════════════════════════
// Muestra los slots de disponibilidad de un doctor en una fecha dada.
//
// Flujo:
//   1. El usuario elige una fecha con el date picker
//   2. Se llama a GET /api/availability/doctors/{id}?date=YYYY-MM-DD
//   3. El backend devuelve los slots disponibles (huecos libres en el horario)
//   4. Los mostramos en chips de hora
//
// ¿Qué es un "slot"?
//   Un intervalo de tiempo disponible. Por ejemplo, si el doctor tiene
//   horario de 8:00 a 12:00 y ya tiene una cita de 9:00 a 9:30,
//   los slots disponibles serían: 8:00-9:00 y 9:30-12:00.
//   El backend hace ese cálculo automáticamente.
//
// ¿Por qué fecha de hoy como mínimo?
//   No tiene sentido consultar disponibilidad en el pasado.
function AvailabilityModal({ isOpen, onClose, doctor }) {

  // Fecha seleccionada — inicializamos con hoy en formato YYYY-MM-DD
  // que es lo que espera el input type="date"
  function toLocalDateStr(date) {
  const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
  const todayStr = toLocalDateStr(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Estado de la carga de slots
  const [slots,    setSlots]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  // ¿Ya se hizo al menos una consulta? Para distinguir "no buscado" de "sin resultados"
  const [searched, setSearched] = useState(false);


  // Limpiar al cerrar el modal para que la próxima vez empiece limpio
  useEffect(() => {
    if (!isOpen) {
      setSlots([]);
      setError(null);
      setSearched(false);
      setSelectedDate(new Date().toISOString().slice(0, 10));
    }
  }, [isOpen]);

  if (!isOpen || !doctor) return null;

  // Consultar disponibilidad cuando el usuario hace clic en "Consultar"
  const handleSearch = async () => {
    if (!selectedDate) return;
    setLoading(true);
    setError(null);
    setSearched(false);

    try {
      const data = await getAvailableSlots(doctor.id, selectedDate);
      // getAvailableSlots devuelve List<AvailabilitySlotResponse>
      // Cada item tiene: { date, slotStart, slotEnd }
      setSlots(data ?? []);
      setSearched(true);
    } catch (err) {
      // El backend puede devolver 404 si el doctor no tiene horarios configurados
      if (err.response?.status === 404) {
        setError('Este doctor no tiene horarios de atención configurados para ese día.');
      } else {
        setError(
          err.response?.data?.message ??
          'Error al consultar disponibilidad. Intenta de nuevo.'
        );
      }
      setSlots([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  // Formatear "HH:mm:ss" o "HH:mm" a "HH:mm"
  // El backend puede devolver segundos o no, esto lo normaliza
  const fmt = (t) => t ? t.substring(0, 5) : '—';

  // Formatear la fecha seleccionada para mostrarla en texto legible
  const dateLabel = selectedDate
    ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-CO', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      })
    : '';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--availability" onClick={e => e.stopPropagation()}>

        <div className="modal__header">
          <div>
            <h3>Disponibilidad</h3>
            {/* Mostrar nombre del doctor para contexto */}
            <p className="modal__header-sub">{doctor.fullName}</p>
          </div>
          <button type="button" className="modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="availability-modal__body">

          {/* Selector de fecha + botón */}
          <div className="availability-date-row">
            <input
              type="date"
              className="availability-date-input"
              value={selectedDate}
              min={todayStr}  // No se puede consultar el pasado
              onChange={e => {
                setSelectedDate(e.target.value);
                // Limpiar resultados anteriores al cambiar fecha
                setSlots([]);
                setSearched(false);
                setError(null);
              }}
            />
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleSearch}
              disabled={loading || !selectedDate}
            >
              {loading
                ? <><Loader size={16} className="spin" /> Consultando...</>
                : <><CalendarDays size={16} /> Consultar</>
              }
            </button>
          </div>

          {/* Fecha en texto legible */}
          {dateLabel && (
            <p className="availability-date-label">{dateLabel}</p>
          )}

          {/* Error */}
          {error && (
            <div className="alert alert--error" style={{ marginTop: 12 }}>
              <AlertCircle size={16} /><span>{error}</span>
            </div>
          )}

          {/* Resultados */}
          {searched && !error && (
            slots.length === 0 ? (
              /*
                Sin slots disponibles: puede deberse a:
                - El doctor tiene citas todo el día
                - El día no está dentro del horario del doctor (ej: domingo)
                El mensaje es neutro para cubrir ambos casos.
              */
              <div className="availability-empty">
                <Clock size={32} />
                <p>No hay horarios disponibles para este día.</p>
                <span>El doctor puede estar completamente ocupado o no atiende ese día.</span>
              </div>
            ) : (
              <div className="availability-slots">
                <p className="availability-slots__count">
                  {slots.length} horario{slots.length !== 1 ? 's' : ''} disponible{slots.length !== 1 ? 's' : ''}
                </p>
                {/*
                  Cuadrícula de chips de horario.
                  Cada chip muestra el intervalo de tiempo libre.
                  Verde = disponible.
                */}
                <div className="availability-slots__grid">
                  {slots.map((slot, i) => (
                    <div key={i} className="slot-chip">
                      {fmt(slot.slotStart)} – {fmt(slot.slotEnd)}
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          {/* Estado inicial: instrucción */}
          {!searched && !loading && !error && (
            <div className="availability-hint">
              <CalendarDays size={28} />
              <p>Selecciona una fecha y haz clic en "Consultar" para ver los horarios libres del doctor.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════════════
// COMPONENTE: DoctorModal (crear / editar)
// ════════════════════════════════════════════════════════════════
// Igual que antes + sin cambios funcionales en esta versión.
// Los horarios se crean al mismo tiempo que el doctor (modo CREAR).
function DoctorModal({ isOpen, onClose, onSubmit, doctor, specialties, loadingSpecialties }) {

  const isEditing = doctor !== null && doctor !== undefined;

  const [form, setForm] = useState({
    fullName: '', email: '', licenseNumber: '',
    documentNumber: '', specialtyId: '', status: 'ACTIVE',
  });
  const [schedules, setSchedules] = useState([]);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState(null);

  // Sincronizar el form con el doctor recibido por props.
  // useEffect con [doctor, isOpen] garantiza que:
  //   - Al abrir en modo CREAR: campos vacíos
  //   - Al abrir en modo EDITAR: campos pre-llenados con el doctor
  //   - Al cerrar y volver a abrir: estado limpio (saving=false, error=null)
  useEffect(() => {
    setForm({
      fullName:       doctor?.fullName       ?? '',
      email:          doctor?.email          ?? '',
      licenseNumber:  doctor?.licenseNumber  ?? '',
      documentNumber: doctor?.documentNumber ?? '',
      specialtyId:    doctor?.specialty?.id  ?? '',
      status:         doctor?.status         ?? 'ACTIVE',
    });
    setSchedules([]);
    setError(null);
    setSaving(false);
  }, [doctor, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const addSchedule    = () => setSchedules(prev => [...prev, { ...EMPTY_SCHEDULE }]);
  const removeSchedule = (i) => setSchedules(prev => prev.filter((_, idx) => idx !== i));
  const updateSchedule = (i, field, value) =>
    setSchedules(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));

  const validateSchedules = () => {
    for (const s of schedules) {
      if (s.startTime >= s.endTime) {
        const day = DAYS_OF_WEEK.find(d => d.value === s.dayOfWeek)?.label;
        return `El horario del ${day} tiene la hora de inicio mayor o igual a la hora de fin.`;
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim())  return setError('El nombre completo es requerido.');
    if (!form.email.trim())     return setError('El correo electrónico es requerido.');
    if (!form.specialtyId)      return setError('La especialidad es requerida.');
    if (!isEditing) {
      if (!form.licenseNumber.trim())  return setError('El número de licencia es requerido.');
      if (!form.documentNumber.trim()) return setError('El número de documento es requerido.');
    }
    if (schedules.length > 0) {
      const err = validateSchedules();
      if (err) return setError(err);
    }

    setSaving(true);
    const result = await onSubmit(form);

    if (!result.success) {
      setError(result.error);
      setSaving(false);
      return;
    }

    // Si se crearon horarios junto con el doctor, los enviamos ahora
    // que ya tenemos el ID del doctor recién creado (result.doctorId)
    if (!isEditing && schedules.length > 0 && result.doctorId) {
      const failed = [];
      for (const s of schedules) {
        try {
          await api.post(`/api/doctors/${result.doctorId}/schedules`, s);
        } catch {
          failed.push(`${DAYS_OF_WEEK.find(d => d.value === s.dayOfWeek)?.label} ${s.startTime}-${s.endTime}`);
        }
      }
      if (failed.length > 0) {
        setError(`Doctor creado, pero fallaron estos horarios: ${failed.join(', ')}`);
        setSaving(false);
        return;
      }
    }

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--wide" onClick={e => e.stopPropagation()}>

        <div className="modal__header">
          <h3>{isEditing ? 'Editar Doctor' : 'Nuevo Doctor'}</h3>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="modal__error">
            <AlertCircle size={16} /><span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal__form">

          <p className="form-section-title">Datos del Doctor</p>
          <div className="form-grid">

            <div className="form-group form-group--full">
              <label htmlFor="d-fullName">Nombre Completo *</label>
              <input id="d-fullName" name="fullName" type="text"
                placeholder="Ej: Dr. Juan Pérez"
                value={form.fullName} onChange={handleChange}
                disabled={saving} maxLength={100} />
            </div>

            <div className="form-group">
              <label htmlFor="d-email">Correo Electrónico *</label>
              <input id="d-email" name="email" type="email"
                placeholder="doctor@hospital.com"
                value={form.email} onChange={handleChange}
                disabled={saving} />
            </div>

            <div className="form-group">
              <label htmlFor="d-specialty">Especialidad *</label>
              {loadingSpecialties ? (
                <div className="form-readonly">Cargando especialidades...</div>
              ) : (
                <select id="d-specialty" name="specialtyId"
                  value={form.specialtyId} onChange={handleChange}
                  disabled={saving} className="form-select">
                  <option value="">Selecciona una especialidad</option>
                  {specialties.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}
            </div>

            {!isEditing ? (
              <>
                <div className="form-group">
                  <label htmlFor="d-license">Número de Licencia *</label>
                  <input id="d-license" name="licenseNumber" type="text"
                    placeholder="Ej: LIC-001"
                    value={form.licenseNumber} onChange={handleChange}
                    disabled={saving} maxLength={50} />
                </div>
                <div className="form-group">
                  <label htmlFor="d-doc">Número de Documento *</label>
                  <input id="d-doc" name="documentNumber" type="text"
                    placeholder="Ej: 1001234567"
                    value={form.documentNumber} onChange={handleChange}
                    disabled={saving} maxLength={50} />
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>Número de Licencia</label>
                  <div className="form-readonly">{doctor.licenseNumber ?? '—'}</div>
                  <p className="form-hint">La licencia no puede modificarse.</p>
                </div>
                <div className="form-group">
                  <label>Número de Documento</label>
                  <div className="form-readonly">{doctor.documentNumber ?? '—'}</div>
                  <p className="form-hint">El documento no puede modificarse.</p>
                </div>
                <div className="form-group">
                  <label htmlFor="d-status">Estado del Doctor</label>
                  <select id="d-status" name="status"
                    value={form.status} onChange={handleChange}
                    disabled={saving} className="form-select">
                    <option value="ACTIVE">Activo</option>
                    <option value="INACTIVE">Inactivo</option>
                  </select>
                  <p className="form-hint">
                    {form.status === 'ACTIVE'
                      ? 'El doctor puede recibir citas normalmente.'
                      : 'El doctor no puede recibir citas nuevas.'}
                  </p>
                </div>
              </>
            )}
          </div>

          {/*
            SECCIÓN DE HORARIOS — solo al crear.
            Al editar, los horarios ya existen y se consultan desde
            el modal de disponibilidad. No hay endpoint de edición
            de horarios individuales por ahora.
          */}
          {!isEditing && (
            <div className="schedule-section">
              <div className="schedule-section__header">
                <p className="form-section-title">
                  <Clock size={16} /> Horarios de Atención
                  <span className="label-optional"> (opcional)</span>
                </p>
                <button type="button" className="btn btn--ghost btn--sm"
                  onClick={addSchedule} disabled={saving}>
                  <PlusCircle size={15} /> Agregar horario
                </button>
              </div>

              {schedules.length === 0 && (
                <p className="schedule-empty-hint">
                  Puedes agregar los horarios ahora o hacerlo más tarde.
                </p>
              )}

              {schedules.map((s, i) => (
                <div key={i} className="schedule-row">
                  <div className="form-group">
                    <label>Día</label>
                    <select value={s.dayOfWeek}
                      onChange={e => updateSchedule(i, 'dayOfWeek', e.target.value)}
                      disabled={saving} className="form-select">
                      {DAYS_OF_WEEK.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Inicio</label>
                    <input type="time" value={s.startTime}
                      onChange={e => updateSchedule(i, 'startTime', e.target.value)}
                      disabled={saving} />
                  </div>
                  <div className="form-group">
                    <label>Fin</label>
                    <input type="time" value={s.endTime}
                      onChange={e => updateSchedule(i, 'endTime', e.target.value)}
                      disabled={saving} />
                  </div>
                  <button type="button" className="schedule-remove-btn"
                    onClick={() => removeSchedule(i)} disabled={saving}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="modal__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving
                ? <><Loader size={16} className="spin" /> Guardando...</>
                : <><Save size={16} /> {isEditing ? 'Guardar cambios' : 'Crear doctor'}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════════════
// COMPONENTE: LoadingSkeleton
// ════════════════════════════════════════════════════════════════
function LoadingSkeleton() {
  return (
    <div className="skeleton-table">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="skeleton-row">
          <div className="sk sk--avatar" />
          <div className="sk sk--name" />
          <div className="sk sk--md" />
          <div className="sk sk--md" />
          <div className="sk sk--sm" />
          <div className="sk sk--badge" />
          {/* Dos botones de acción */}
          <div className="sk sk--action" />
          <div className="sk sk--action" />
        </div>
      ))}
    </div>
  );
}


// ════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL: DoctorsPage
// ════════════════════════════════════════════════════════════════
function DoctorsPage() {

  const {
    doctors, loading, error,
    totalPages, totalElements,
    currentPage, setCurrentPage,
    addDoctor, editDoctor,
  } = useDoctors();

  const { specialties, loading: loadingSpecialties } = useSpecialties();

  const [modalOpen,           setModalOpen]           = useState(false);
  const [selectedDoctor,      setSelectedDoctor]      = useState(null);
  const [availabilityDoctor,  setAvailabilityDoctor]  = useState(null); // Doctor para el modal de disponibilidad
  const [searchQuery,         setSearchQuery]         = useState('');
  const [statusFilter,        setStatusFilter]        = useState('');
  const filteredDoctors = doctors.filter(d => {
    const matchesSearch = !searchQuery.trim() || (() => {
      const q = searchQuery.toLowerCase();
      return (
        d.fullName?.toLowerCase().includes(q) ||
        d.email?.toLowerCase().includes(q) ||
        d.specialty?.name?.toLowerCase().includes(q)
      );
    })();
    const matchesStatus = !statusFilter || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openCreate = () => { setSelectedDoctor(null); setModalOpen(true); };
  const openEdit   = (d) => { setSelectedDoctor(d);   setModalOpen(true); };
  const closeModal = ()  => { setModalOpen(false); setSelectedDoctor(null); };

  const handleModalSubmit = async (formData) =>
    selectedDoctor
      ? await editDoctor(selectedDoctor.id, formData)
      : await addDoctor(formData);

  return (
    <MainLayout pageTitle="Doctores">
      <div className="doctors-page">

        <div className="page-header">
          <div>
            <h2 className="page-header__title">Gestión de Doctores</h2>
            <p className="page-header__subtitle">
              {loading
                ? 'Cargando...'
                : `${totalElements} doctor${totalElements !== 1 ? 'es' : ''} registrado${totalElements !== 1 ? 's' : ''}`
              }
            </p>
          </div>
          <button className="btn btn--primary" onClick={openCreate}>
            <Plus size={18} /> Nuevo Doctor
          </button>
        </div>

        <div className="doctors-filters">
          <div className="search-bar">
            <Search size={17} className="search-bar__icon" />
            <input type="text"
              placeholder="Buscar por nombre, email o especialidad..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-bar__input" />
            {searchQuery && (
              <button className="search-bar__clear" onClick={() => setSearchQuery('')}>
                <X size={16} />
              </button>
            )}
          </div>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
          </select>
        </div>

        {error && (
          <div className="alert alert--error">
            <AlertCircle size={18} /><span>{error}</span>
          </div>
        )}

        <div className="table-card">
          {loading ? (
            <LoadingSkeleton />
          ) : filteredDoctors.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon"><UserRound size={40} /></div>
              <h3>{searchQuery ? `Sin resultados para "${searchQuery}"` : 'No hay doctores registrados'}</h3>
              <p>{searchQuery ? 'Intenta con otro nombre, email o especialidad.' : 'Comienza registrando el primer doctor.'}</p>
              {!searchQuery && (
                <button className="btn btn--primary" onClick={openCreate}>
                  <Plus size={16} /> Registrar primer doctor
                </button>
              )}
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th>Especialidad</th>
                    <th>Licencia</th>
                    <th>Documento</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDoctors.map(doctor => (
                    <tr key={doctor.id}>
                      <td>
                        <div className="doctor-cell">
                          <div className="doctor-cell__avatar">
                            {doctor.fullName?.charAt(0).toUpperCase() ?? '?'}
                          </div>
                          <div className="doctor-cell__info">
                            <span className="doctor-cell__name">{doctor.fullName}</span>
                            <span className="doctor-cell__email">{doctor.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        {doctor.specialty ? (
                          <div className="specialty-badge">
                            <Stethoscope size={13} />
                            <span>{doctor.specialty.name}</span>
                          </div>
                        ) : <span className="td--muted">—</span>}
                      </td>
                      <td className="td--muted">{doctor.licenseNumber ?? '—'}</td>
                      <td className="td--muted">{doctor.documentNumber ?? '—'}</td>
                      <td><DoctorStatusBadge status={doctor.status} /></td>
                      <td>
                        <div className="action-btn-group">
                          {/* Botón editar (ya existía) */}
                          <button className="action-btn" onClick={() => openEdit(doctor)}
                            title="Editar doctor">
                            <Edit2 size={15} />
                          </button>
                          {/*
                            NUEVO: Botón disponibilidad.
                            Ícono de calendario para diferenciarlo del botón de editar.
                            Al hacer clic abre el AvailabilityModal con este doctor.
                          */}
                          <button
                            className="action-btn action-btn--availability"
                            onClick={() => setAvailabilityDoctor(doctor)}
                            title="Ver disponibilidad"
                          >
                            <CalendarDays size={15} />
                          </button>
                        </div>
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

        {/* Modal crear/editar doctor */}
        <DoctorModal
          isOpen={modalOpen}
          onClose={closeModal}
          onSubmit={handleModalSubmit}
          doctor={selectedDoctor}
          specialties={specialties}
          loadingSpecialties={loadingSpecialties}
        />

        {/* Modal de disponibilidad — nuevo */}
        <AvailabilityModal
          isOpen={availabilityDoctor !== null}
          onClose={() => setAvailabilityDoctor(null)}
          doctor={availabilityDoctor}
        />

      </div>
    </MainLayout>
  );
}

export default DoctorsPage;