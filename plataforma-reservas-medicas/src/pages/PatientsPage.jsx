import { useState, useEffect } from 'react';
import {
  Plus, Search, Edit2, User,
  ChevronLeft, ChevronRight,
  AlertCircle, X, Save, Loader,
} from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { usePatients } from '../Hooks/usePatients';
import './PatientsPage.css';


// ─────────────────────────────────────────────────────────────
// COMPONENTE: PatientStatusBadge
// Muestra el estado del paciente con color semántico.
// ─────────────────────────────────────────────────────────────
function PatientStatusBadge({ status }) {
  const MAP = {
    ACTIVE:    { label: 'Activo',     cls: 'badge--green'  },
    SUSPENDED: { label: 'Suspendido', cls: 'badge--orange' },
    INACTIVE:  { label: 'Inactivo',   cls: 'badge--gray'   },
  };
  const { label, cls } = MAP[status] ?? { label: status, cls: 'badge--gray' };
  return <span className={`badge ${cls}`}>{label}</span>;
}


// ─────────────────────────────────────────────────────────────
// COMPONENTE: PatientModal
// Modal unificado para CREAR y EDITAR pacientes.
//
// Modo crear (patient = null):
//   Campos: fullName, email, phoneNumber, documentNumber, studentCode
//
// Modo editar (patient = objeto):
//   Campos: fullName, email, phoneNumber, status
//   (documentNumber y studentCode son de solo lectura)
// ─────────────────────────────────────────────────────────────
function PatientModal({ isOpen, onClose, onSubmit, patient }) {

  const isEditing = patient !== null && patient !== undefined;

  // Pre-llenamos el formulario con los datos del paciente si estamos editando
  const [form, setForm] = useState({
    fullName:       patient?.fullName       ?? '',
    email:          patient?.email          ?? '',
    phoneNumber:    patient?.phoneNumber    ?? '',
    documentNumber: patient?.documentNumber ?? '',
    studentCode:    patient?.studentCode    ?? '',
    status:         patient?.status         ?? 'ACTIVE',
  });

  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);

  // Sincroniza el estado del formulario cuando cambia la prop `patient`.
  // Esto asegura que al abrir el modal en modo EDITAR los campos se
  // pre-llenen correctamente incluso si el componente ya estaba montado.
  useEffect(() => {
    setForm({
      fullName:       patient?.fullName       ?? '',
      email:          patient?.email          ?? '',
      phoneNumber:    patient?.phoneNumber    ?? '',
      documentNumber: patient?.documentNumber ?? '',
      studentCode:    patient?.studentCode    ?? '',
      status:         patient?.status         ?? 'ACTIVE',
    });
    setError(null);
    setSaving(false);
  }, [patient]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones básicas del lado del cliente
    if (!form.fullName.trim())    return setError('El nombre completo es requerido.');
    if (!form.email.trim())       return setError('El correo electrónico es requerido.');
    if (!form.phoneNumber.trim()) return setError('El número de teléfono es requerido.');
    if (!isEditing && !form.documentNumber.trim())
      return setError('El número de documento es requerido.');

    setSaving(true);
    try {
      const result = await onSubmit(form);
      if (result.success) {
        onClose();
      } else {
        setError(result.error);
        setSaving(false);
      }
    } catch (err) {
      setError('Error inesperado al guardar. Intenta de nuevo.');
      setSaving(false);
    }
  };

  return (
    // Overlay: clic fuera cierra el modal
    <div className="modal-overlay" onClick={onClose}>
      {/* stopPropagation: evita que el clic dentro cierre el modal */}
      <div className="modal" onClick={e => e.stopPropagation()}>

        {/* Encabezado */}
        <div className="modal__header">
          <h3>{isEditing ? 'Editar Paciente' : 'Nuevo Paciente'}</h3>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error del formulario */}
        {error && (
          <div className="modal__error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal__form">
          <div className="form-grid">

            {/* ── Nombre completo ─── */}
            <div className="form-group form-group--full">
              <label htmlFor="m-fullName">Nombre Completo *</label>
              <input
                id="m-fullName"
                name="fullName"
                type="text"
                placeholder="Ej: Juan Pérez García"
                value={form.fullName}
                onChange={handleChange}
                disabled={saving}
                maxLength={100}
              />
            </div>

            {/* ── Email ─── */}
            <div className="form-group">
              <label htmlFor="m-email">Correo Electrónico *</label>
              <input
                id="m-email"
                name="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={form.email}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            {/* ── Teléfono ─── */}
            <div className="form-group">
              <label htmlFor="m-phone">Teléfono *</label>
              <input
                id="m-phone"
                name="phoneNumber"
                type="tel"
                placeholder="Ej: 3001234567"
                value={form.phoneNumber}
                onChange={handleChange}
                disabled={saving}
                maxLength={20}
              />
            </div>

            {/* ── Documento (solo en modo CREAR) ─── */}
            {!isEditing && (
              <div className="form-group">
                <label htmlFor="m-doc">Número de Documento *</label>
                <input
                  id="m-doc"
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

            {/* ── Código estudiantil (solo en modo CREAR) ─── */}
            {!isEditing && (
              <div className="form-group">
                <label htmlFor="m-student">
                  Código Estudiantil
                  <span className="label-optional">(opcional)</span>
                </label>
                <input
                  id="m-student"
                  name="studentCode"
                  type="text"
                  placeholder="Ej: 2024114220"
                  value={form.studentCode}
                  onChange={handleChange}
                  disabled={saving}
                  maxLength={50}
                />
              </div>
            )}

            {/* ── Estado (solo en modo EDITAR) ─── */}
            {isEditing && (
              <div className="form-group">
                <label htmlFor="m-status">Estado del Paciente</label>
                <select
                  id="m-status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  disabled={saving}
                  className="form-select"
                >
                  <option value="ACTIVE">Activo</option>
                  <option value="SUSPENDED">Suspendido</option>
                  <option value="INACTIVE">Inactivo</option>
                </select>
                {/* Explicación contextual del estado seleccionado */}
                <p className="form-hint">
                  {form.status === 'ACTIVE'    && 'El paciente puede agendar citas normalmente.'}
                  {form.status === 'SUSPENDED' && 'El paciente no puede agendar citas temporalmente.'}
                  {form.status === 'INACTIVE'  && 'El paciente está dado de baja del sistema.'}
                </p>
              </div>
            )}

            {/* ── Campos de solo lectura en modo EDITAR ─── */}
            {isEditing && (
              <>
                <div className="form-group">
                  <label>Documento</label>
                  <div className="form-readonly">
                    {patient.documentNumber ?? '—'}
                  </div>
                  <p className="form-hint">El documento no puede modificarse.</p>
                </div>
                <div className="form-group">
                  <label>Código Estudiantil</label>
                  <div className="form-readonly">
                    {patient.studentCode ?? '—'}
                  </div>
                  <p className="form-hint">El código no puede modificarse.</p>
                </div>
              </>
            )}

          </div>

          {/* Footer del modal */}
          <div className="modal__footer">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={saving}
            >
              {saving ? (
                <><Loader size={16} className="spin" /> Guardando...</>
              ) : (
                <><Save size={16} /> {isEditing ? 'Guardar cambios' : 'Crear paciente'}</>
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
// Filas animadas mientras se cargan los datos.
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
// COMPONENTE PRINCIPAL: PatientsPage
// ─────────────────────────────────────────────────────────────
function PatientsPage() {

  const {
    patients,
    loading,
    error,
    totalPages,
    totalElements,
    currentPage,
    setCurrentPage,
    addPatient,
    editPatient,
  } = usePatients();

  // ── Estado del modal ──────────────────────────────────────
  const [modalOpen,       setModalOpen]       = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // ── Estado de la búsqueda local ───────────────────────────
  const [searchQuery, setSearchQuery] = useState('');

  // ── Filtrado local sobre la página actual ─────────────────
  // Filtramos los N registros ya cargados.
  // Es correcto para N pequeño (10-20 registros por página).
  const filteredPatients = searchQuery.trim()
    ? patients.filter(p => {
        const q = searchQuery.toLowerCase();
        return (
          p.fullName?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.documentNumber?.toLowerCase().includes(q)
        );
      })
    : patients;

  // ── Abrir modal en modo CREAR ─────────────────────────────
  const openCreate = () => {
    setSelectedPatient(null);
    setModalOpen(true);
  };

  // ── Abrir modal en modo EDITAR ────────────────────────────
  const openEdit = (patient) => {
    setSelectedPatient(patient);
    setModalOpen(true);
  };

  // ── Cerrar modal ──────────────────────────────────────────
  const closeModal = () => {
    setModalOpen(false);
    setSelectedPatient(null);
  };

  // ── Envío del modal (crea o edita según el modo) ──────────
  const handleModalSubmit = async (formData) => {
    if (selectedPatient) {
      return await editPatient(selectedPatient.id, formData);
    }
    return await addPatient(formData);
  };


  return (
    <MainLayout pageTitle="Pacientes">
      <div className="patients-page">

        {/* ─── ENCABEZADO ─────────────────────────────────── */}
        <div className="page-header">
          <div>
            <h2 className="page-header__title">Gestión de Pacientes</h2>
            <p className="page-header__subtitle">
              {loading
                ? 'Cargando...'
                : `${totalElements} paciente${totalElements !== 1 ? 's' : ''} registrado${totalElements !== 1 ? 's' : ''}`
              }
            </p>
          </div>
          <button className="btn btn--primary" onClick={openCreate}>
            <Plus size={18} />
            Nuevo Paciente
          </button>
        </div>


        {/* ─── BÚSQUEDA ────────────────────────────────────── */}
        <div className="search-bar">
          <Search size={17} className="search-bar__icon" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o documento..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="search-bar__input"
          />
          {searchQuery && (
            <button
              className="search-bar__clear"
              onClick={() => setSearchQuery('')}
              aria-label="Limpiar búsqueda"
            >
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

          ) : filteredPatients.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">
                <User size={40} />
              </div>
              <h3>
                {searchQuery
                  ? `Sin resultados para "${searchQuery}"`
                  : 'No hay pacientes registrados'}
              </h3>
              <p>
                {searchQuery
                  ? 'Intenta con otro nombre, email o documento.'
                  : 'Comienza registrando el primer paciente del sistema.'}
              </p>
              {!searchQuery && (
                <button className="btn btn--primary" onClick={openCreate}>
                  <Plus size={16} />
                  Registrar primer paciente
                </button>
              )}
            </div>

          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Documento</th>
                    <th>Teléfono</th>
                    <th>Código Estudiantil</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map(patient => (
                    <tr key={patient.id}>

                      {/* Avatar + nombre + email */}
                      <td>
                        <div className="patient-cell">
                          <div className="patient-cell__avatar">
                            {patient.fullName?.charAt(0).toUpperCase() ?? '?'}
                          </div>
                          <div className="patient-cell__info">
                            <span className="patient-cell__name">
                              {patient.fullName}
                            </span>
                            <span className="patient-cell__email">
                              {patient.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Documento — requiere que el backend incluya el campo */}
                      <td className="td--muted">
                        {patient.documentNumber ?? '—'}
                      </td>

                      <td className="td--muted">
                        {patient.phoneNumber ?? '—'}
                      </td>

                      {/* Código estudiantil */}
                      <td className="td--muted">
                        {patient.studentCode ?? '—'}
                      </td>

                      <td>
                        <PatientStatusBadge status={patient.status} />
                      </td>

                      <td>
                        <button
                          className="action-btn"
                          onClick={() => openEdit(patient)}
                          title="Editar paciente"
                          aria-label={`Editar ${patient.fullName}`}
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
        <PatientModal
          isOpen={modalOpen}
          onClose={closeModal}
          onSubmit={handleModalSubmit}
          patient={selectedPatient}
        />

      </div>
    </MainLayout>
  );
}

export default PatientsPage;