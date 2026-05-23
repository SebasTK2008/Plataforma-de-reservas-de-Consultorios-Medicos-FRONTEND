import { useState } from 'react';
import {
  Plus, Search, Edit2, UserRound,
  ChevronLeft, ChevronRight,
  AlertCircle, X, Save, Loader,
  Stethoscope,
} from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { useDoctors } from '../Hooks/useDoctors';
import { useSpecialties } from '../Hooks/useSpecialties';
import './DoctorsPage.css';


// ─────────────────────────────────────────────────────────────
// COMPONENTE: DoctorStatusBadge
// ─────────────────────────────────────────────────────────────
function DoctorStatusBadge({ status }) {
  const MAP = {
    ACTIVE:   { label: 'Activo',   cls: 'badge--green' },
    INACTIVE: { label: 'Inactivo', cls: 'badge--gray'  },
  };
  const { label, cls } = MAP[status] ?? { label: status, cls: 'badge--gray' };
  return <span className={`badge ${cls}`}>{label}</span>;
}


// ─────────────────────────────────────────────────────────────
// COMPONENTE: DoctorModal
// Modo crear (doctor = null): fullName, email, licenseNumber,
//   documentNumber, specialtyId
// Modo editar (doctor = objeto): fullName, email, specialtyId
//   (licenseNumber y documentNumber son de solo lectura)
// ─────────────────────────────────────────────────────────────
function DoctorModal({ isOpen, onClose, onSubmit, doctor, specialties, loadingSpecialties }) {

  const isEditing = doctor !== null && doctor !== undefined;

  const [form, setForm] = useState({
    fullName:       doctor?.fullName            ?? '',
    email:          doctor?.email               ?? '',
    licenseNumber:  doctor?.licenseNumber       ?? '',
    documentNumber: doctor?.documentNumber      ?? '',
    specialtyId:    doctor?.specialty?.id       ?? '',
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

    if (!form.fullName.trim())   return setError('El nombre completo es requerido.');
    if (!form.email.trim())      return setError('El correo electrónico es requerido.');
    if (!form.specialtyId)       return setError('La especialidad es requerida.');
    if (!isEditing) {
      if (!form.licenseNumber.trim())  return setError('El número de licencia es requerido.');
      if (!form.documentNumber.trim()) return setError('El número de documento es requerido.');
    }

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
          <h3>{isEditing ? 'Editar Doctor' : 'Nuevo Doctor'}</h3>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Cerrar">
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
          <div className="form-grid">

            {/* ── Nombre completo ── */}
            <div className="form-group form-group--full">
              <label htmlFor="d-fullName">Nombre Completo *</label>
              <input
                id="d-fullName"
                name="fullName"
                type="text"
                placeholder="Ej: Dr. Juan Pérez"
                value={form.fullName}
                onChange={handleChange}
                disabled={saving}
                maxLength={100}
              />
            </div>

            {/* ── Email ── */}
            <div className="form-group">
              <label htmlFor="d-email">Correo Electrónico *</label>
              <input
                id="d-email"
                name="email"
                type="email"
                placeholder="doctor@hospital.com"
                value={form.email}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            {/* ── Especialidad ── */}
            <div className="form-group">
              <label htmlFor="d-specialty">Especialidad *</label>
              {loadingSpecialties ? (
                <div className="form-readonly">Cargando especialidades...</div>
              ) : (
                <select
                  id="d-specialty"
                  name="specialtyId"
                  value={form.specialtyId}
                  onChange={handleChange}
                  disabled={saving}
                  className="form-select"
                >
                  <option value="">Selecciona una especialidad</option>
                  {specialties.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* ── Licencia (solo en modo CREAR) ── */}
            {!isEditing && (
              <div className="form-group">
                <label htmlFor="d-license">Número de Licencia *</label>
                <input
                  id="d-license"
                  name="licenseNumber"
                  type="text"
                  placeholder="Ej: LIC-001"
                  value={form.licenseNumber}
                  onChange={handleChange}
                  disabled={saving}
                  maxLength={50}
                />
              </div>
            )}

            {/* ── Documento (solo en modo CREAR) ── */}
            {!isEditing && (
              <div className="form-group">
                <label htmlFor="d-doc">Número de Documento *</label>
                <input
                  id="d-doc"
                  name="documentNumber"
                  type="text"
                  placeholder="Ej: 1001234567"
                  value={form.documentNumber}
                  onChange={handleChange}
                  disabled={saving}
                  maxLength={50}
                />
              </div>
            )}

            {/* ── Campos de solo lectura en modo EDITAR ── */}
            {isEditing && (
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
              </>
            )}

          </div>

          <div className="modal__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? (
                <><Loader size={16} className="spin" /> Guardando...</>
              ) : (
                <><Save size={16} /> {isEditing ? 'Guardar cambios' : 'Crear doctor'}</>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// COMPONENTE: LoadingSkeleton
// ─────────────────────────────────────────────────────────────
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
          <div className="sk sk--action" />
        </div>
      ))}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL: DoctorsPage
// ─────────────────────────────────────────────────────────────
function DoctorsPage() {

  const {
    doctors,
    loading,
    error,
    totalPages,
    totalElements,
    currentPage,
    setCurrentPage,
    addDoctor,
    editDoctor,
  } = useDoctors();

  // Especialidades para el dropdown del modal
  const { specialties, loading: loadingSpecialties } = useSpecialties();

  // ── Estado del modal ──────────────────────────────────────
  const [modalOpen,      setModalOpen]      = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // ── Búsqueda local ────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDoctors = searchQuery.trim()
    ? doctors.filter(d => {
        const q = searchQuery.toLowerCase();
        return (
          d.fullName?.toLowerCase().includes(q) ||
          d.email?.toLowerCase().includes(q) ||
          d.specialty?.name?.toLowerCase().includes(q)
        );
      })
    : doctors;

  const openCreate = () => { setSelectedDoctor(null); setModalOpen(true); };
  const openEdit   = (doctor) => { setSelectedDoctor(doctor); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setSelectedDoctor(null); };

  const handleModalSubmit = async (formData) => {
    if (selectedDoctor) return await editDoctor(selectedDoctor.id, formData);
    return await addDoctor(formData);
  };


  return (
    <MainLayout pageTitle="Doctores">
      <div className="doctors-page">

        {/* ─── ENCABEZADO ─────────────────────────────────── */}
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
            <Plus size={18} />
            Nuevo Doctor
          </button>
        </div>


        {/* ─── BÚSQUEDA ────────────────────────────────────── */}
        <div className="search-bar">
          <Search size={17} className="search-bar__icon" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o especialidad..."
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


        {/* ─── ERROR ───────────────────────────────────────── */}
        {error && (
          <div className="alert alert--error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}


        {/* ─── TABLA ───────────────────────────────────────── */}
        <div className="table-card">
          {loading ? (
            <LoadingSkeleton />

          ) : filteredDoctors.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">
                <UserRound size={40} />
              </div>
              <h3>
                {searchQuery
                  ? `Sin resultados para "${searchQuery}"`
                  : 'No hay doctores registrados'}
              </h3>
              <p>
                {searchQuery
                  ? 'Intenta con otro nombre, email o especialidad.'
                  : 'Comienza registrando el primer doctor del sistema.'}
              </p>
              {!searchQuery && (
                <button className="btn btn--primary" onClick={openCreate}>
                  <Plus size={16} />
                  Registrar primer doctor
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

                      {/* Avatar + nombre + email */}
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

                      {/* Especialidad — viene en DoctorSummaryResponse */}
                      <td>
                        {doctor.specialty ? (
                          <div className="specialty-badge">
                            <Stethoscope size={13} />
                            <span>{doctor.specialty.name}</span>
                          </div>
                        ) : (
                          <span className="td--muted">—</span>
                        )}
                      </td>

                      <td className="td--muted">{doctor.licenseNumber ?? '—'}</td>
                      <td className="td--muted">{doctor.documentNumber ?? '—'}</td>

                      <td>
                        <DoctorStatusBadge status={doctor.status} />
                      </td>

                      <td>
                        <button
                          className="action-btn"
                          onClick={() => openEdit(doctor)}
                          title="Editar doctor"
                          aria-label={`Editar ${doctor.fullName}`}
                        >
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


        {/* ─── PAGINACIÓN ──────────────────────────────────── */}
        {!loading && totalPages > 1 && (
          <div className="pagination">
            <span className="pagination__info">
              Página {currentPage + 1} de {totalPages}
            </span>
            <div className="pagination__controls">
              <button
                className="pagination__btn"
                onClick={() => setCurrentPage(p => p - 1)}
                disabled={currentPage === 0}
                aria-label="Página anterior"
              >
                <ChevronLeft size={17} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  className={`pagination__btn ${currentPage === i ? 'pagination__btn--active' : ''}`}
                  onClick={() => setCurrentPage(i)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="pagination__btn"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage === totalPages - 1}
                aria-label="Página siguiente"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        )}


        {/* ─── MODAL ───────────────────────────────────────── */}
        <DoctorModal
          isOpen={modalOpen}
          onClose={closeModal}
          onSubmit={handleModalSubmit}
          doctor={selectedDoctor}
          specialties={specialties}
          loadingSpecialties={loadingSpecialties}
        />

      </div>
    </MainLayout>
  );
}

export default DoctorsPage;