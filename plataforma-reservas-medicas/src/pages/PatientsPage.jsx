// PatientsPage.jsx
// Página completa de gestión de pacientes.
// Incluye: listado paginado, búsqueda, crear y editar.

import { useState } from 'react';
import {
  Plus, Search, Edit2, User,
  ChevronLeft, ChevronRight, AlertCircle, X, Save, Loader
} from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { usePatients } from '../hooks/usePatients';
import './PatientsPage.css';


// ─────────────────────────────────────────────────────────
// COMPONENTE: PatientStatusBadge
// Badge de color según el estado del paciente
// ─────────────────────────────────────────────────────────
function PatientStatusBadge({ status }) {
  const config = {
    ACTIVE:    { label: 'Activo',    className: 'badge badge--green' },
    INACTIVE:  { label: 'Inactivo',  className: 'badge badge--gray' },
    SUSPENDED: { label: 'Suspendido', className: 'badge badge--red' },
  };
  const { label, className } = config[status] || { label: status, className: 'badge badge--gray' };
  return <span className={className}>{label}</span>;
}


// ─────────────────────────────────────────────────────────
// COMPONENTE: PatientModal
// Modal para crear o editar un paciente.
// Se muestra sobre el resto del contenido.
// ─────────────────────────────────────────────────────────
// Props:
// - isOpen: boolean que controla si el modal se muestra
// - onClose: función para cerrar el modal
// - onSubmit: función que recibe los datos del formulario
// - patient: si viene con datos, es modo "editar"; si es null, es modo "crear"
// ─────────────────────────────────────────────────────────
function PatientModal({ isOpen, onClose, onSubmit, patient }) {

  // Estado del formulario
  // Si estamos editando, pre-llenamos con los datos del paciente
  const [formData, setFormData] = useState({
    fullName:       patient?.fullName       || '',
    email:          patient?.email          || '',
    phoneNumber:    patient?.phoneNumber    || '',
    documentNumber: patient?.documentNumber || '',
    studentCode:    patient?.studentCode    || '',
  });

  const [saving, setSaving] = useState(false);  // ¿Estamos guardando?
  const [error, setError] = useState(null);     // Error del formulario

  // Si el modal no está abierto, no renderizamos nada
  // Esto es más eficiente que usar CSS para ocultar el modal
  if (!isOpen) return null;


  // Manejador de cambios en los inputs
  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,                    // Copiamos el estado anterior
      [e.target.name]: e.target.value  // Actualizamos solo el campo que cambió
      // La sintaxis [e.target.name] es "computed property name":
      // Si name="email", esto es equivalente a { email: e.target.value }
    }));
    if (error) setError(null);  // Limpiamos el error al escribir
  };


  // Manejador del envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();  // Prevenir el comportamiento por defecto del formulario (reload de página)

    // Validación básica en el frontend
    if (!formData.fullName.trim()) return setError('El nombre es requerido');
    if (!formData.email.trim()) return setError('El email es requerido');
    if (!formData.phoneNumber.trim()) return setError('El teléfono es requerido');
    if (!patient && !formData.documentNumber.trim()) return setError('El documento es requerido');

    setSaving(true);
    // Llamamos a onSubmit (que viene del componente padre PatientsPage)
    // Esto retorna { success, error }
    const result = await onSubmit(formData);

    if (result.success) {
      onClose();  // Cerramos el modal si todo salió bien
    } else {
      setError(result.error);  // Mostramos el error del backend
      setSaving(false);
    }
  };

  const isEditing = !!patient;  // !! convierte a boolean: null → false, objeto → true


  // El modal usa un "portal" conceptual: se renderiza encima de todo
  return (
    // Fondo oscuro (overlay) — al hacer clic, cierra el modal
    <div className="modal-overlay" onClick={onClose}>

      {/* Contenido del modal — stopPropagation evita que el clic
          se "propague" al overlay y cierre el modal accidentalmente */}
      <div className="modal" onClick={e => e.stopPropagation()}>

        {/* Encabezado */}
        <div className="modal__header">
          <h3>{isEditing ? 'Editar Paciente' : 'Nuevo Paciente'}</h3>
          <button className="modal__close" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        {/* Error del formulario */}
        {error && (
          <div className="modal__error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="modal__form">

          {/* Grid de dos columnas para los campos */}
          <div className="form-grid">

            <div className="form-group">
              <label htmlFor="fullName">Nombre Completo *</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Ej: Juan Pérez García"
                value={formData.fullName}
                onChange={handleChange}
                disabled={saving}
                maxLength={100}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Correo Electrónico *</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="juan@correo.com"
                value={formData.email}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Teléfono *</label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                placeholder="Ej: 3001234567"
                value={formData.phoneNumber}
                onChange={handleChange}
                disabled={saving}
                maxLength={20}
              />
            </div>

            {/* El documento solo se puede establecer al crear, no al editar.
                Esto refleja la regla de negocio del backend. */}
            {!isEditing && (
              <div className="form-group">
                <label htmlFor="documentNumber">Número de Documento *</label>
                <input
                  id="documentNumber"
                  name="documentNumber"
                  type="text"
                  placeholder="Ej: 1234567890"
                  value={formData.documentNumber}
                  onChange={handleChange}
                  disabled={saving}
                  maxLength={50}
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="studentCode">Código Estudiantil</label>
              <input
                id="studentCode"
                name="studentCode"
                type="text"
                placeholder="Ej: 2024114220 (opcional)"
                value={formData.studentCode}
                onChange={handleChange}
                disabled={saving || isEditing}  // No se puede editar tampoco
                maxLength={50}
              />
            </div>

          </div>

          {/* Botones del footer */}
          <div className="modal__footer">
            <button
              type="button"
              className="btn btn--secondary"
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
                <><Save size={16} /> {isEditing ? 'Guardar Cambios' : 'Crear Paciente'}</>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL: PatientsPage
// ─────────────────────────────────────────────────────────
function PatientsPage() {

  // Usamos nuestro custom hook que maneja toda la lógica de datos
  const {
    patients,
    loading,
    error,
    totalPages,
    totalElements,
    currentPage,
    setCurrentPage,
    searchQuery,
    setSearchQuery,
    addPatient,
    editPatient,
  } = usePatients();

  // Estado del modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null); // null = crear, objeto = editar


  // Abrir modal para CREAR un paciente nuevo
  const handleOpenCreate = () => {
    setSelectedPatient(null);  // Limpiamos para modo "crear"
    setModalOpen(true);
  };

  // Abrir modal para EDITAR un paciente existente
  const handleOpenEdit = (patient) => {
    setSelectedPatient(patient);  // Pasamos el paciente para pre-llenar el form
    setModalOpen(true);
  };

  // Cerrar el modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedPatient(null);
  };

  // Función que se llama cuando el modal envía el formulario
  const handleModalSubmit = async (formData) => {
    if (selectedPatient) {
      // Modo editar: solo enviamos los campos editables
      return await editPatient(selectedPatient.id, {
        fullName:    formData.fullName,
        email:       formData.email,
        phoneNumber: formData.phoneNumber,
      });
    } else {
      // Modo crear: enviamos todos los campos
      return await addPatient(formData);
    }
  };


  // ── Filtrado de pacientes por búsqueda ────────────────
  // Filtramos en el cliente (los datos ya cargados)
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


  // ── Render ────────────────────────────────────────────
  return (
    <MainLayout pageTitle="Pacientes">
      <div className="patients-page">

        {/* ─── ENCABEZADO ─────────────────────────────── */}
        <div className="page-header">
          <div>
            <h2 className="page-header__title">Gestión de Pacientes</h2>
            <p className="page-header__subtitle">
              {loading ? 'Cargando...' : `${totalElements} pacientes registrados`}
            </p>
          </div>

          <button className="btn btn--primary" onClick={handleOpenCreate}>
            <Plus size={18} />
            Nuevo Paciente
          </button>
        </div>


        {/* ─── BARRA DE BÚSQUEDA ──────────────────────── */}
        <div className="search-bar">
          <Search size={18} className="search-bar__icon" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o documento..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="search-bar__input"
          />
          {/* Botón para limpiar la búsqueda */}
          {searchQuery && (
            <button
              className="search-bar__clear"
              onClick={() => setSearchQuery('')}
              title="Limpiar búsqueda"
            >
              <X size={16} />
            </button>
          )}
        </div>


        {/* ─── MENSAJE DE ERROR ───────────────────────── */}
        {error && (
          <div className="page-error">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        )}


        {/* ─── TABLA DE PACIENTES ─────────────────────── */}
        <div className="patients-table-card">

          {loading ? (
            // Estado de carga
            <div className="table-loading">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="table-loading__row">
                  <div className="table-loading__cell table-loading__cell--wide" />
                  <div className="table-loading__cell" />
                  <div className="table-loading__cell" />
                  <div className="table-loading__cell--small" />
                  <div className="table-loading__cell--small" />
                </div>
              ))}
            </div>

          ) : filteredPatients.length === 0 ? (
            // Estado vacío
            <div className="empty-state">
              <User size={48} />
              <h3>No se encontraron pacientes</h3>
              <p>
                {searchQuery
                  ? `No hay resultados para "${searchQuery}"`
                  : 'Comienza creando el primer paciente'
                }
              </p>
              {!searchQuery && (
                <button className="btn btn--primary" onClick={handleOpenCreate}>
                  <Plus size={16} />
                  Crear Primer Paciente
                </button>
              )}
            </div>

          ) : (
            // Tabla con datos
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

                      {/* Columna: Avatar + Nombre + Email */}
                      <td>
                        <div className="patient-info">
                          <div className="patient-info__avatar">
                            {patient.fullName?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="patient-info__name">{patient.fullName}</p>
                            <p className="patient-info__email">{patient.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="text-secondary">{patient.documentNumber}</td>
                      <td className="text-secondary">{patient.phoneNumber}</td>
                      <td className="text-secondary">{patient.studentCode || '—'}</td>

                      <td>
                        <PatientStatusBadge status={patient.status} />
                      </td>

                      {/* Acciones */}
                      <td>
                        <div className="table-actions">
                          <button
                            className="action-btn action-btn--edit"
                            onClick={() => handleOpenEdit(patient)}
                            title="Editar paciente"
                          >
                            <Edit2 size={15} />
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


        {/* ─── PAGINACIÓN ─────────────────────────────── */}
        {/* Solo mostramos la paginación si hay más de 1 página */}
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
              >
                <ChevronLeft size={18} />
              </button>

              {/* Botones de número de página */}
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                // Calculamos qué páginas mostrar alrededor de la actual
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i;
                } else if (currentPage < 3) {
                  pageNum = i;
                } else if (currentPage > totalPages - 3) {
                  pageNum = totalPages - 5 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    className={`pagination__btn ${currentPage === pageNum ? 'pagination__btn--active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}

              <button
                className="pagination__btn"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage === totalPages - 1}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}


        {/* ─── MODAL ──────────────────────────────────── */}
        <PatientModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          onSubmit={handleModalSubmit}
          patient={selectedPatient}
        />

      </div>
    </MainLayout>
  );
}

export default PatientsPage;