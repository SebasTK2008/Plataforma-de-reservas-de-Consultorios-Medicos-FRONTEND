// AppointmentTypesPage.jsx
// CAMBIO CLAVE: Se añade useEffect al AppointmentTypeModal
// para resetear "saving", "error" y "form" cada vez que se abre.
//
// ¿Por qué es necesario?
// Sin useEffect, si el usuario intenta crear, el backend devuelve error,
// el usuario cierra el modal... "saving" queda en su valor anterior (true).
// La próxima vez que abran el modal aparece bloqueado sin razón.

import { useState, useEffect } from 'react';
import {
  Plus, Clock, Search, AlertCircle,
  X, Save, Loader, FileText,
} from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { useAppointmentTypes } from '../hooks/useAppointmentTypes';
import { useAuth } from '../hooks/useAuth';
import './AppointmentTypesPage.css';


function formatDuration(minutes) {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

function DurationBadge({ minutes }) {
  let cls = 'duration-badge--short';
  if (minutes >= 30 && minutes < 60) cls = 'duration-badge--medium';
  if (minutes >= 60)                 cls = 'duration-badge--long';
  return (
    <span className={`duration-badge ${cls}`}>
      <Clock size={11} />
      {formatDuration(minutes)}
    </span>
  );
}


// ── Modal: crear tipo de cita ─────────────────────────────────
function AppointmentTypeModal({ isOpen, onClose, onSubmit }) {

  const [form, setForm] = useState({
    name:            '',
    description:     '',
    durationMinutes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);

  // ✅ FIX PRINCIPAL: useEffect que resetea el estado cuando cambia isOpen.
  //
  // Cuando "isOpen" pasa de false → true (usuario abre el modal),
  // este efecto se ejecuta y:
  //   1. Limpia el formulario (campos vacíos)
  //   2. Borra errores anteriores
  //   3. Resetea "saving" a false (aquí estaba el bug)
  //
  // Sin esto: si saving quedaba en true por un guardado fallido,
  // al reabrir el modal los botones aparecían desactivados.
  //
  // La condición "if (isOpen)" evita limpiar el formulario al cerrar
  // (cuando isOpen pasa a false), lo cual no haría daño pero es más limpio.
  useEffect(() => {
    if (isOpen) {
      setForm({ name: '', description: '', durationMinutes: '' });
      setError(null);
      setSaving(false);
    }
  }, [isOpen]); // Se ejecuta cada vez que isOpen cambia

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      onClose();
      // No necesitamos resetear el form aquí porque el useEffect
      // lo hará la próxima vez que isOpen se ponga en true.
    } else {
      setError(result.error);
      setSaving(false); // ← Siempre resetear en caso de error
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

            <div className="form-group form-group--full">
              <label htmlFor="t-name">Nombre del Tipo de Cita *</label>
              <input
                id="t-name"
                name="name"
                type="text"
                placeholder="Ej: Consulta General, Psicología..."
                value={form.name}
                onChange={handleChange}
                disabled={saving}
                maxLength={100}
              />
            </div>

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
              {form.durationMinutes && Number(form.durationMinutes) > 0 && (
                <p className="form-hint">
                  Equivale a: <strong>{formatDuration(Number(form.durationMinutes))}</strong>
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="t-desc">
                Descripción
                <span className="label-optional">(opcional)</span>
              </label>
              <input
                id="t-desc"
                name="description"
                type="text"
                placeholder="Ej: Consulta médica de rutina"
                value={form.description}
                onChange={handleChange}
                disabled={saving}
                maxLength={255}
              />
            </div>

          </div>

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


function AppointmentTypesPage() {

  const { user } = useAuth();
  const isStaff = user?.roles?.includes('ROLE_STAFF');

  const {
    appointmentTypes,
    loading,
    error,
    addAppointmentType,
  } = useAppointmentTypes();

  const [modalOpen,   setModalOpen]   = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
          {!isStaff && (
            <button className="btn btn--primary" onClick={() => setModalOpen(true)}>
              <Plus size={18} /> Nuevo Tipo de Cita
            </button>
          )}
        </div>

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
            <button className="search-bar__clear" onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>

        {error && (
          <div className="alert alert--error">
            <AlertCircle size={18} /><span>{error}</span>
          </div>
        )}

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
              {!searchQuery && !isStaff && (
                <button className="btn btn--primary" onClick={() => setModalOpen(true)}>
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
                      <td>
                        <div className="type-cell">
                          <div className="type-cell__icon">
                            <FileText size={18} />
                          </div>
                          <span className="type-cell__name">{type.name}</span>
                        </div>
                      </td>
                      <td>
                        <DurationBadge minutes={type.durationMinutes} />
                      </td>
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