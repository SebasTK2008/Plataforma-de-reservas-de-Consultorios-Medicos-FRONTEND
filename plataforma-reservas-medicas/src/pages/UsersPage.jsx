// UsersPage.jsx
//
// CAPA DE PRESENTACIÓN
// Responsabilidad única: renderizar la UI.
// No contiene lógica de negocio ni llamadas HTTP.
// Todo el estado y las acciones vienen de useUsers().

import {
  UserPlus, Eye, EyeOff, Save,
  Loader, AlertCircle, CheckCircle2,
  ShieldCheck, Users,
} from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { useUsers } from '../hooks/useUsers';
import './UsersPage.css';


// ── Catálogo de roles ─────────────────────────────────────────────────────
// Definido aquí porque es metadata de presentación (labels, colores, descripciones).
// No pertenece a la capa de lógica ni a la de datos.
export const ROLES = [
  {
    value: 'ROLE_ADMIN',
    label: 'Administrador',
    description: 'Acceso total. Gestiona doctores, pacientes, consultorios, citas y usuarios.',
    color: 'role--admin',
  },
  {
    value: 'ROLE_STAFF',
    label: 'Personal',
    description: 'Puede crear y gestionar citas, consultar disponibilidad de doctores.',
    color: 'role--staff',
  },
  {
    value: 'ROLE_DOCTOR',
    label: 'Doctor',
    description: 'Puede marcar sus citas confirmadas como completadas.',
    color: 'role--doctor',
  },
  {
    value: 'ROLE_COORDINATOR',
    label: 'Coordinador',
    description: 'Puede consultar reportes de productividad, ocupación e inasistencias.',
    color: 'role--coordinator',
  },
];


// ════════════════════════════════════════════════════════════════
// COMPONENTE: RoleCard
// ════════════════════════════════════════════════════════════════
function RoleCard({ role, selected, onSelect, disabled }) {
  return (
    <button
      type="button"
      className={`role-card ${role.color} ${selected ? 'role-card--selected' : ''}`}
      onClick={() => onSelect(role.value)}
      disabled={disabled}
    >
      <div className="role-card__header">
        <span className="role-card__label">{role.label}</span>
        {selected && <CheckCircle2 size={16} className="role-card__check" />}
      </div>
      <p className="role-card__desc">{role.description}</p>
    </button>
  );
}


// ════════════════════════════════════════════════════════════════
// COMPONENTE: SuccessBanner
// ════════════════════════════════════════════════════════════════
function SuccessBanner({ documentNumber, role, onDismiss }) {
  const roleInfo = ROLES.find(r => r.value === role);
  return (
    <div className="success-banner">
      <CheckCircle2 size={20} className="success-banner__icon" />
      <div className="success-banner__text">
        <span className="success-banner__title">Usuario creado correctamente</span>
        <span className="success-banner__sub">
          Documento <strong>{documentNumber}</strong> · Rol: {roleInfo?.label ?? role}
        </span>
      </div>
      <button type="button" className="success-banner__close" onClick={onDismiss}>
        ×
      </button>
    </div>
  );
}


// ════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL: UsersPage
// ════════════════════════════════════════════════════════════════
function UsersPage() {

  const {
    form,
    passwordStrength,
    showPassword,
    saving,
    error,
    lastCreated,
    handleChange,
    handleRoleSelect,
    toggleShowPassword,
    handleSubmit,
    dismissSuccess,
  } = useUsers();

  return (
    <MainLayout pageTitle="Usuarios">
      <div className="users-page">

        {/* ── Encabezado ─────────────────────────────────── */}
        <div className="page-header">
          <div>
            <h2 className="page-header__title">Gestión de Usuarios</h2>
            <p className="page-header__subtitle">
              Crea cuentas de acceso al sistema y asigna el rol correspondiente.
            </p>
          </div>
          <div className="users-header-icon">
            <Users size={28} />
          </div>
        </div>

        {/* ── Banner de éxito ──────────────────────────────── */}
        {lastCreated && (
          <SuccessBanner
            documentNumber={lastCreated.documentNumber}
            role={lastCreated.role}
            onDismiss={dismissSuccess}
          />
        )}

        {/* ── Formulario ──────────────────────────────────── */}
        <div className="users-form-card">

          <div className="users-form-card__header">
            <ShieldCheck size={18} className="users-form-card__icon" />
            <span>Nuevo usuario del sistema</span>
          </div>

          {error && (
            <div className="alert alert--error" style={{ margin: '0 var(--spacing-lg)' }}>
              <AlertCircle size={16} /><span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="users-form">

            {/* Número de documento */}
            <div className="form-group">
              <label htmlFor="u-doc">Número de Documento *</label>
              <input
                id="u-doc"
                name="documentNumber"
                type="text"
                placeholder="Ej: 1001234567"
                value={form.documentNumber}
                onChange={handleChange}
                disabled={saving}
                maxLength={50}
                autoComplete="off"
              />
              <p className="form-hint">
                El usuario usará este número para iniciar sesión.
              </p>
            </div>

            {/* Contraseña */}
            <div className="form-group">
              <label htmlFor="u-pass">Contraseña *</label>
              <div className="password-input-wrap">
                <input
                  id="u-pass"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={form.password}
                  onChange={handleChange}
                  disabled={saving}
                  maxLength={64}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={toggleShowPassword}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordStrength && (
                <div className={`password-strength password-strength--${passwordStrength.level}`}>
                  <div className="password-strength__bar" />
                  <span>{passwordStrength.label}</span>
                </div>
              )}
            </div>

            {/* Selección de rol */}
            <div className="form-group">
              <label>Rol del Usuario *</label>
              <p className="form-hint" style={{ marginBottom: 10 }}>
                Selecciona qué puede hacer este usuario en el sistema.
              </p>
              <div className="role-cards-grid">
                {ROLES.map(role => (
                  <RoleCard
                    key={role.value}
                    role={role}
                    selected={form.role === role.value}
                    onSelect={handleRoleSelect}
                    disabled={saving}
                  />
                ))}
              </div>
            </div>

            {/* Botón de envío */}
            <div className="users-form__footer">
              <button
                type="submit"
                className="btn btn--primary"
                disabled={saving}
              >
                {saving
                  ? <><Loader size={16} className="spin" /> Creando usuario...</>
                  : <><UserPlus size={16} /> Crear Usuario</>
                }
              </button>
            </div>

          </form>
        </div>

        {/* ── Nota informativa ────────────────────────────── */}
        <div className="users-info-note">
          <AlertCircle size={14} />
          <p>
            Los usuarios creados aquí pueden iniciar sesión inmediatamente con su número de documento
            y contraseña. Para cambiar el rol o desactivar un usuario, hazlo desde la base de datos
            o implementa el endpoint de gestión de usuarios en el backend.
          </p>
        </div>

      </div>
    </MainLayout>
  );
}

export default UsersPage;