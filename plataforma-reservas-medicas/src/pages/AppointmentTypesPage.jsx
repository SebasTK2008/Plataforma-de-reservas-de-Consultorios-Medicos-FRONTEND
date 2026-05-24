import { useState } from 'react';
import {
  Plus, Clock, Search, AlertCircle,
  X, Save, Loader, FileText,
} from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { useAppointmentTypes } from '../hooks/useAppointmentTypes';
import './AppointmentTypesPage.css';


// ── Helper: formatea minutos a texto legible ──────────────────
// 30  → "30 min"
// 60  → "1 h"
// 90  → "1 h 30 min"
function formatDuration(minutes) {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}


// ── Badge de duración ─────────────────────────────────────────
function DurationBadge({ minutes }) {
  // Color según la duración para identificar visualmente
  let cls = 'duration-badge--short';   // < 30 min
  if (minutes >= 30 && minutes < 60) cls = 'duration-badge--medium';  // 30–59 min
  if (minutes >= 60)                 cls = 'duration-badge--long';    // ≥ 1 hora

  return (
    <span className={`duration-badge ${cls}`}>
      <Clock size={11} />
      {formatDuration(minutes)}
    </span>
  );
}


// ── Modal: crear tipo de cita ─────────────────────────────────
// El backend no tiene endpoint de edición (PUT/PATCH para tipos de cita),
// por eso este modal solo sirve para CREAR.
function AppointmentTypeModal({ isOpen, onClose, onSubmit }) {

  const [form, setForm] = useState({
    name:            '',
    description:     '',
    durationMinutes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones del lado cliente
    if (!form.name.trim())
      return setError('El nombre del tipo de cita es requerido.');

    const duration = Number(form.durationMinutes);
    if (!form.durationMinutes || isNaN(duration))
      return setError('La duración es requerida.');
    if (duration <= 0)
      return setError('La duración debe ser mayor a 0 minutos.');
    if (duration > 480)
      return setError('La duración no puede superar las 8 horas (480 min).');

    setSaving(true);
    const result = await onSubmit(form);

    if (result.success) {
      // Limpiamos el form para el próximo uso
      setForm({ name: '', description: '', durationMinutes: '' });
      onClose();
    } else {
      setError(result.error);
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>

        <div className="modal__header">
          <h3>Nuevo Tipo de Cita</h3>
          <button type="button" className="modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="modal__error">
            <AlertCircle size={16} /><span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal__form">
          <div className="form-grid">

            {/* Nombre */}
            <div className="form-group form-group--full">
              <label htmlFor="t-name">Nombre del Tipo de Cita *</label>
              <input
                id="t-name"
                name="name"
                type="text"
                placeholder="Ej: Consulta General, Psicología, Fisioterapia..."
                value={form.name}
                onChange={handleChange}
                disabled={saving}
                maxLength={100}
              />
            </div>

            {/* Duración */}
            <div className="form-group">
              <label htmlFor="t-duration">Duración (minutos) *</label>
              <input
                id="t-duration"
                name="durationMinutes"
                type="number"
                placeholder="Ej: 30"
                value={form.durationMinutes}
                onChange={handleChange}
                disabled={saving}
                min={1}
                max={480}
              />
              {/* Preview de la duración mientras escribe */}
              {form.durationMinutes && Number(form.durationMinutes) > 0 && (
                <p className="form-hint">
                  Equivale a: <strong>{formatDuration(Number(form.durationMinutes))}</strong>
                </p>
              )}
            </div>

            {/* Descripción (ocupa la otra columna o se extiende) */}
            <div className="form-group">
              <label htmlFor="t-desc">
                Descripción
                <span className="label-optional">(opcional)</span>
              </label>
              <input
                id="t-desc"
                name="description"
                type="text"
                placeholder="Ej: Consulta médica de rutina con historia clínica"
                value={form.description}
                onChange={handleChange}
                disabled={saving}
                maxLength={255}
              />
            </div>

          </div>

          {/* Nota informativa */}
          <div className="modal__note">
            <FileText size={14} />
            <span>
              Una vez creado, el tipo de cita no puede editarse. La duración se
              usará para calcular automáticamente la hora de fin de cada cita.
            </span>
          </div>

          <div className="modal__footer">
            <button type="button" className="btn btn--ghost"
              onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving
                ? <><Loader size={16} className="spin" /> Creando...</>
                : <><Save size={16} /> Crear Tipo de Cita</>
              }
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}


// ── Skeleton de carga ─────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="skeleton-table">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="skeleton-row">
          <div className="sk sk--avatar" />
          <div className="sk sk--name" />
          <div className="sk sk--md" />
          <div className="sk sk--badge" />
        </div>
      ))}
    </div>
  );
}


// ── Página principal ──────────────────────────────────────────
function AppointmentTypesPage() {

  const {
    appointmentTypes,
    loading,
    error,
    addAppointmentType,
  } = useAppointmentTypes();

  const [modalOpen,   setModalOpen]   = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrado local por nombre o descripción
  const filtered = searchQuery.trim()
    ? appointmentTypes.filter(t => {
        const q = searchQuery.toLowerCase();
        return (
          t.name?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
        );
      })
    : appointmentTypes;


  return (
    <MainLayout pageTitle="Tipos de Cita">
      <div className="appt-types-page">

        {/* ── Encabezado ─────────────────────────────────── */}
        <div className="page-header">
          <div>
            <h2 className="page-header__title">Tipos de Cita</h2>
            <p className="page-header__subtitle">
              {loading
                ? 'Cargando...'
                : `${appointmentTypes.length} tipo${appointmentTypes.length !== 1 ? 's' : ''} registrado${appointmentTypes.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>
          <button className="btn btn--primary" onClick={() => setModalOpen(true)}>
            <Plus size={18} /> Nuevo Tipo de Cita
          </button>
        </div>

        {/* ── Búsqueda ────────────────────────────────────── */}
        <div className="search-bar">
          <Search size={17} className="search-bar__icon" />
          <input
            type="text"
            placeholder="Buscar por nombre o descripción..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="search-bar__input"
          />
          {searchQuery && (
            <button className="search-bar__clear"
              onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          )}
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

          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">
                <Clock size={40} />
              </div>
              <h3>
                {searchQuery
                  ? `Sin resultados para "${searchQuery}"`
                  : 'No hay tipos de cita registrados'}
              </h3>
              <p>
                {searchQuery
                  ? 'Intenta con otro término de búsqueda.'
                  : 'Los tipos de cita definen la duración de cada consulta.'}
              </p>
              {!searchQuery && (
                <button className="btn btn--primary"
                  onClick={() => setModalOpen(true)}>
                  <Plus size={16} /> Crear primer tipo
                </button>
              )}
            </div>

          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tipo de Cita</th>
                    <th>Duración</th>
                    <th>Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(type => (
                    <tr key={type.id}>

                      {/* Icono + nombre */}
                      <td>
                        <div className="type-cell">
                          <div className="type-cell__icon">
                            <FileText size={18} />
                          </div>
                          <span className="type-cell__name">
                            {type.name}
                          </span>
                        </div>
                      </td>

                      {/* Badge de duración con color según rango */}
                      <td>
                        <DurationBadge minutes={type.durationMinutes} />
                      </td>

                      {/* Descripción */}
                      <td className="td--muted">
                        {type.description || '—'}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Modal ───────────────────────────────────────── */}
        <AppointmentTypeModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={addAppointmentType}
        />

      </div>
    </MainLayout>
  );
}

export default AppointmentTypesPage;