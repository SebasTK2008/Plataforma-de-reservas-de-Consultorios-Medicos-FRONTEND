// TopBar.jsx
//
// CAMBIOS vs versión anterior:
//
// 1. NOTIFICACIONES ELIMINADAS
//    No tienen funcionalidad real aún. Mejor no tenerlas
//    que tenerlas rotas con un badge hardcodeado.
//
// 2. BUSCADOR ELIMINADO
//    Cada página tiene su propio buscador contextual.
//    Un buscador global en la topbar no tiene backend que lo soporte aún.
//
// 3. USUARIO REAL desde useAuth()
//    Antes mostraba "AD" y "Admin" hardcodeados.
//    Ahora lee user.sub y user.roles del JWT decodificado.
//
// ESTRUCTURA DEL JWT DECODIFICADO (user object):
//   user.sub   → identificador del usuario (ej: "1001234567" o "admin")
//   user.roles → array de roles (ej: ["ROLE_ADMIN"] o ["ROLE_STAFF"])
//
// MAPEO DE ROLES:
//   "ROLE_ADMIN"       → "Administrador"
//   "ROLE_STAFF"       → "Personal"
//   "ROLE_DOCTOR"      → "Doctor"
//   "ROLE_COORDINATOR" → "Coordinador"
//   Cualquier otro     → se muestra tal cual sin el prefijo ROLE_

import { useAuth } from '../../hooks/useAuth';
import './Topbar.css';

// ── Helper: convierte "ROLE_ADMIN" → "Administrador" ─────────
// El prefijo ROLE_ es una convención de Spring Security,
// no queremos mostrarlo al usuario.
function formatRole(role) {
  if (!role) return 'Usuario';
  const MAP = {
    ROLE_ADMIN:       'Administrador',
    ROLE_STAFF:       'Personal',
    ROLE_DOCTOR:      'Doctor',
    ROLE_COORDINATOR: 'Coordinador',
  };
  return MAP[role] ?? role.replace('ROLE_', '');
}

// ── Helper: genera las iniciales para el avatar ───────────────
// Si sub es "sebastianlopez" → "SL"
// Si sub es "1001234567"     → "U" (número → genérico)
// Si sub es "Dr. Juan Pérez" → "DJ"
function getInitials(sub) {
  if (!sub) return '??';
  // Si es puramente numérico, mostramos "US" (usuario)
  if (/^\d+$/.test(sub)) return 'US';
  // Tomamos la primera letra de cada palabra (máx 2)
  return sub
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}

// ── Helper: color del avatar según rol ───────────────────────
// Cada rol tiene un color distinto para identificación visual rápida.
function getRoleColor(role) {
  const MAP = {
    ROLE_ADMIN:       'avatar--admin',
    ROLE_STAFF:       'avatar--staff',
    ROLE_DOCTOR:      'avatar--doctor',
    ROLE_COORDINATOR: 'avatar--coordinator',
  };
  return MAP[role] ?? 'avatar--default';
}

function TopBar({ pageTitle }) {
  const { user } = useAuth();

  // user.roles puede ser un array ["ROLE_ADMIN"] o un string "ROLE_ADMIN"
  // dependiendo de cómo el backend codificó el JWT.
  // Normalizamos a string para mostrarlo.
  const primaryRole = Array.isArray(user?.roles)
    ? user.roles[0]
    : user?.roles ?? null;

  const initials   = getInitials(user?.sub);
  const roleLabel  = formatRole(primaryRole);
  const avatarColor = getRoleColor(primaryRole);

  return (
    <header className="topbar">

      {/* Título de la página actual */}
      <div className="topbar__title">
        <h1>{pageTitle}</h1>
      </div>

      {/* Info del usuario autenticado */}
      <div className="topbar__user">

        {/* Avatar con iniciales */}
        <div className={`topbar__avatar ${avatarColor}`}>
          <span>{initials}</span>
        </div>

        {/* Nombre y rol */}
        <div className="topbar__user-info">
          <span className="topbar__user-name">
            {user?.sub ?? 'Usuario'}
          </span>
          <span className="topbar__user-role">{roleLabel}</span>
        </div>

      </div>

    </header>
  );
}

export default TopBar;