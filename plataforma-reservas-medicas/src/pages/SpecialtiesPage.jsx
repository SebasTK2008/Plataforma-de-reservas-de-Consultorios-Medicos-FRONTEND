// SpecialtiesPage.jsx
// CAMBIO: Se añade useEffect al SpecialtyModal para resetear el estado al abrir.
// Mismo patrón que AppointmentTypesPage — corrige el bug de "saving infinito".

import { useState, useEffect } from 'react';
import {
  Plus, Stethoscope,
  AlertCircle, X, Save, Loader,
  Search,
} from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { useSpecialties } from '../Hooks/useSpecialties';
import { useAuth } from '../hooks/useAuth';
import './SpecialtiesPage.css';


const CARD_COLORS = [
  { bg: '#eff6ff', icon: '#2563eb', border: '#bfdbfe' },
  { bg: '#f0fdf4', icon: '#16a34a', border: '#bbf7d0' },
  { bg: '#fff7ed', icon: '#ea580c', border: '#fed7aa' },
  { bg: '#fdf4ff', icon: '#9333ea', border: '#e9d5ff' },
  { bg: '#f0fdfa', icon: '#0d9488', border: '#99f6e4' },
  { bg: '#fffbeb', icon: '#d97706', border: '#fde68a' },
];


// ── Modal: Crear especialidad ─────────────────────────────────
function SpecialtyModal({ isOpen, onClose, onSubmit }) {

  const [form,   setForm]   = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);

  // ✅ FIX: useEffect para resetear estado al abrir el modal.
  // Idéntico al patrón usado en AppointmentTypesPage.
  useEffect(() => {
    if (isOpen) {
      setForm({ name: '', description: '' });
      setError(null);
      setSaving(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('El nombre de la especialidad es requerido.');

    setSaving(true);
    const result = await onSubmit(form);

    if (result.success) {
      onClose();
    } else {
      setError(result.error);
      setSaving(false);
    }
  };

  const handleClose = () => {
    onClose();
    // El useEffect limpiará el form la próxima vez que isOpen = true
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal modal--narrow" onClick={e => e.stopPropagation()}>

        <div className="modal__header">
          <h3>Nueva Especialidad</h3>
          <button type="button" className="modal__close" onClick={handleClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="modal__error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal__form">
          <div className="form-grid-single">

            <div className="form-group">
              <label htmlFor="sp-name">Nombre *</label>
              <input
                id="sp-name"
                name="name"
                type="text"
                placeholder="Ej: Cardiología"
                value={form.name}
                onChange={handleChange}
                disabled={saving}
                maxLength={100}
              />
            </div>

            <div className="form-group">
              <label htmlFor="sp-desc">
                Descripción
                <span className="label-optional"> (opcional)</span>
              </label>
              <textarea
                id="sp-desc"
                name="description"
                placeholder="Descripción breve de la especialidad..."
                value={form.description}
                onChange={handleChange}
                disabled={saving}
                maxLength={255}
                rows={3}
                className="form-textarea"
              />
            </div>

          </div>

          <div className="modal__footer">
            <button type="button" className="btn btn--ghost" onClick={handleClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? (
                <><Loader size={16} className="spin" /> Guardando...</>
              ) : (
                <><Save size={16} /> Crear especialidad</>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}


function SpecialtyCard({ specialty, colorIndex }) {
  const color = CARD_COLORS[colorIndex % CARD_COLORS.length];
  return (
    <div
      className="specialty-card"
      style={{ backgroundColor: color.bg, borderColor: color.border }}
    >
      <div className="specialty-card__icon" style={{ color: color.icon }}>
        <Stethoscope size={28} />
      </div>
      <div className="specialty-card__content">
        <h3 className="specialty-card__name">{specialty.name}</h3>
        <p className="specialty-card__desc">
          {specialty.description || 'Sin descripción registrada.'}
        </p>
      </div>
    </div>
  );
}


function CardSkeleton() {
  return (
    <div className="specialty-grid">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="specialty-card specialty-card--skeleton">
          <div className="sk-card sk-card--icon" />
          <div className="sk-card-body">
            <div className="sk-card sk-card--title" />
            <div className="sk-card sk-card--text" />
            <div className="sk-card sk-card--text sk-card--short" />
          </div>
        </div>
      ))}
    </div>
  );
}


function SpecialtiesPage() {

  const { user } = useAuth();
  const isStaff = user?.roles?.includes('ROLE_STAFF');

  const { specialties, loading, error, addSpecialty } = useSpecialties();

  const [modalOpen,   setModalOpen]   = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSpecialties = searchQuery.trim()
    ? specialties.filter(s =>
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : specialties;

  const handleSubmit = async (formData) => await addSpecialty(formData);

  return (
    <MainLayout pageTitle="Especialidades">
      <div className="specialties-page">

        <div className="page-header">
          <div>
            <h2 className="page-header__title">Especialidades Médicas</h2>
            <p className="page-header__subtitle">
              {loading
                ? 'Cargando...'
                : `${specialties.length} especialidad${specialties.length !== 1 ? 'es' : ''} registrada${specialties.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>
          {!isStaff && (
            <button className="btn btn--primary" onClick={() => setModalOpen(true)}>
              <Plus size={18} />
              Nueva Especialidad
            </button>
          )}
        </div>

        {!loading && specialties.length > 0 && (
          <div className="search-bar">
            <Search size={17} className="search-bar__icon" />
            <input
              type="text"
              placeholder="Buscar especialidad..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-bar__input"
            />
            {searchQuery && (
              <button className="search-bar__clear" onClick={() => setSearchQuery('')} aria-label="Limpiar">
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="alert alert--error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <CardSkeleton />
        ) : filteredSpecialties.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              <Stethoscope size={40} />
            </div>
            <h3>
              {searchQuery
                ? `Sin resultados para "${searchQuery}"`
                : 'No hay especialidades registradas'}
            </h3>
            <p>
              {searchQuery
                ? 'Intenta con otro término de búsqueda.'
                : 'Crea la primera especialidad del sistema.'}
            </p>
            {!searchQuery && !isStaff && (
              <button className="btn btn--primary" onClick={() => setModalOpen(true)}>
                <Plus size={16} />
                Crear primera especialidad
              </button>
            )}
          </div>
        ) : (
          <div className="specialty-grid">
            {filteredSpecialties.map((specialty, index) => (
              <SpecialtyCard
                key={specialty.id}
                specialty={specialty}
                colorIndex={index}
              />
            ))}
          </div>
        )}

        <SpecialtyModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        />

      </div>
    </MainLayout>
  );
}

export default SpecialtiesPage;