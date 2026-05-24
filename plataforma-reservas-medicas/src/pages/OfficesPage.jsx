import { useState } from 'react';
import {
  Plus, Search, Edit2, Building2,
  ChevronLeft, ChevronRight,
  AlertCircle, X, Save, Loader,
} from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { useOffices } from '../hooks/useOffices';
import './OfficesPage.css';


// ── Badge de estado del consultorio ──────────────────────────
function OfficeStatusBadge({ status }) {
  const MAP = {
    AVAILABLE:   { label: 'Disponible',    cls: 'badge--green'  },
    UNAVAILABLE: { label: 'No disponible', cls: 'badge--gray'   },
    MAINTENANCE: { label: 'Mantenimiento', cls: 'badge--orange' },
  };
  const { label, cls } = MAP[status] ?? { label: status, cls: 'badge--gray' };
  return <span className={`badge ${cls}`}>{label}</span>;
}


// ── Modal unificado crear / editar consultorio ────────────────
function OfficeModal({ isOpen, onClose, onSubmit, office }) {

  const isEditing = office !== null && office !== undefined;

  const [form, setForm] = useState({
    name:        office?.name        ?? '',
    location:    office?.location    ?? '',
    description: office?.description ?? '',
    roomNumber:  office?.roomNumber  ?? '',
    status:      office?.status      ?? 'AVAILABLE',
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
    if (!form.name.trim())     return setError('El nombre es requerido.');
    if (!form.location.trim()) return setError('La ubicación es requerida.');
    if (!form.roomNumber)      return setError('El número de sala es requerido.');
    if (isNaN(Number(form.roomNumber)) || Number(form.roomNumber) <= 0)
      return setError('El número de sala debe ser un número positivo.');

    setSaving(true);
    const result = await onSubmit(form);
    if (result.success) {
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
          <h3>{isEditing ? 'Editar Consultorio' : 'Nuevo Consultorio'}</h3>
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
              <label htmlFor="o-name">Nombre del Consultorio *</label>
              <input id="o-name" name="name" type="text"
                placeholder="Ej: Consultorio de Medicina General"
                value={form.name} onChange={handleChange}
                disabled={saving} maxLength={100} />
            </div>

            {/* Ubicación */}
            <div className="form-group">
              <label htmlFor="o-location">Ubicación *</label>
              <input id="o-location" name="location" type="text"
                placeholder="Ej: Edificio de Bienestar, Piso 2"
                value={form.location} onChange={handleChange}
                disabled={saving} maxLength={100} />
            </div>

            {/* Número de sala */}
            <div className="form-group">
              <label htmlFor="o-room">Número de Sala *</label>
              <input id="o-room" name="roomNumber" type="number"
                placeholder="Ej: 101"
                value={form.roomNumber} onChange={handleChange}
                disabled={saving} min={1} />
            </div>

            {/* Descripción */}
            <div className="form-group form-group--full">
              <label htmlFor="o-desc">
                Descripción
                <span className="label-optional">(opcional)</span>
              </label>
              <input id="o-desc" name="description" type="text"
                placeholder="Ej: Equipado con camilla, tensiómetro y oxímetro"
                value={form.description} onChange={handleChange}
                disabled={saving} maxLength={255} />
            </div>

            {/* Estado — solo al editar */}
            {isEditing && (
              <div className="form-group form-group--full">
                <label htmlFor="o-status">Estado del Consultorio</label>
                <select id="o-status" name="status" value={form.status}
                  onChange={handleChange} disabled={saving} className="form-select">
                  <option value="AVAILABLE">Disponible</option>
                  <option value="UNAVAILABLE">No disponible</option>
                  <option value="MAINTENANCE">En mantenimiento</option>
                </select>
                <p className="form-hint">
                  {form.status === 'AVAILABLE'   && 'El consultorio puede ser asignado a citas.'}
                  {form.status === 'UNAVAILABLE' && 'El consultorio no puede recibir citas nuevas.'}
                  {form.status === 'MAINTENANCE' && 'El consultorio está fuera de servicio temporalmente.'}
                </p>
              </div>
            )}

          </div>

          <div className="modal__footer">
            <button type="button" className="btn btn--ghost"
              onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving
                ? <><Loader size={16} className="spin" /> Guardando...</>
                : <><Save size={16} /> {isEditing ? 'Guardar cambios' : 'Crear consultorio'}</>
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
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="skeleton-row">
          <div className="sk sk--avatar" />
          <div className="sk sk--name" />
          <div className="sk sk--md" />
          <div className="sk sk--sm" />
          <div className="sk sk--badge" />
          <div className="sk sk--action" />
        </div>
      ))}
    </div>
  );
}


// ── Página principal ──────────────────────────────────────────
function OfficesPage() {

  const { offices, loading, error, addOffice, editOffice } = useOffices();

  const [modalOpen,       setModalOpen]       = useState(false);
  const [selectedOffice,  setSelectedOffice]  = useState(null);
  const [searchQuery,     setSearchQuery]     = useState('');
  const [statusFilter,    setStatusFilter]    = useState('');

  // Filtrado local: primero por estado, luego por texto
  const filtered = offices
    .filter(o => !statusFilter || o.status === statusFilter)
    .filter(o => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        o.name?.toLowerCase().includes(q) ||
        o.location?.toLowerCase().includes(q)
      );
    });

  const openCreate = () => { setSelectedOffice(null); setModalOpen(true); };
  const openEdit   = (o) => { setSelectedOffice(o);   setModalOpen(true); };
  const closeModal = ()  => { setModalOpen(false); setSelectedOffice(null); };

  const handleSubmit = async (formData) =>
    selectedOffice
      ? editOffice(selectedOffice.id, formData)
      : addOffice(formData);

  return (
    <MainLayout pageTitle="Consultorios">
      <div className="offices-page">

        {/* ── Encabezado ─────────────────────────────── */}
        <div className="page-header">
          <div>
            <h2 className="page-header__title">Gestión de Consultorios</h2>
            <p className="page-header__subtitle">
              {loading ? 'Cargando...' : `${offices.length} consultorio${offices.length !== 1 ? 's' : ''} registrado${offices.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button className="btn btn--primary" onClick={openCreate}>
            <Plus size={18} /> Nuevo Consultorio
          </button>
        </div>

        {/* ── Filtros ─────────────────────────────────── */}
        <div className="filters-bar">
          <div className="search-bar">
            <Search size={17} className="search-bar__icon" />
            <input type="text" placeholder="Buscar por nombre o ubicación..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
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
            <option value="AVAILABLE">Disponible</option>
            <option value="UNAVAILABLE">No disponible</option>
            <option value="MAINTENANCE">En mantenimiento</option>
          </select>
        </div>

        {/* ── Error ───────────────────────────────────── */}
        {error && (
          <div className="alert alert--error">
            <AlertCircle size={18} /><span>{error}</span>
          </div>
        )}

        {/* ── Tabla ───────────────────────────────────── */}
        <div className="table-card">
          {loading ? (
            <LoadingSkeleton />
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon"><Building2 size={40} /></div>
              <h3>{searchQuery || statusFilter ? 'Sin resultados' : 'No hay consultorios registrados'}</h3>
              <p>{searchQuery || statusFilter ? 'Intenta con otros filtros.' : 'Comienza registrando el primer consultorio.'}</p>
              {!searchQuery && !statusFilter && (
                <button className="btn btn--primary" onClick={openCreate}>
                  <Plus size={16} /> Registrar consultorio
                </button>
              )}
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Consultorio</th>
                    <th>Ubicación</th>
                    <th>Sala N°</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(office => (
                    <tr key={office.id}>
                      <td>
                        <div className="office-cell">
                          <div className="office-cell__icon">
                            <Building2 size={18} />
                          </div>
                          <div>
                            <p className="office-cell__name">{office.name}</p>
                            {office.description && (
                              <p className="office-cell__desc">{office.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="td--muted">{office.location}</td>
                      <td className="td--muted room-number">{office.roomNumber}</td>
                      <td><OfficeStatusBadge status={office.status} /></td>
                      <td>
                        <button className="action-btn" onClick={() => openEdit(office)}
                          title="Editar consultorio">
                          <Edit2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Modal ───────────────────────────────────── */}
        <OfficeModal
          isOpen={modalOpen}
          onClose={closeModal}
          onSubmit={handleSubmit}
          office={selectedOffice}
        />

      </div>
    </MainLayout>
  );
}

export default OfficesPage;