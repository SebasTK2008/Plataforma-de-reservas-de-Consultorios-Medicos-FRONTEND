import {
  LayoutDashboard, Users, UserRound, Calendar,
  Stethoscope, Building2, ClipboardList,
  BarChart3, LogOut, Clock,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Sidebar.css';

// Cada item declara qué roles pueden verlo.
// Si "roles" está vacío → cualquier autenticado puede verlo.
// Si "roles" tiene valores → solo esos roles.
const NAV_ITEMS = [
  {
    to: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
    roles: ['ROLE_ADMIN', 'ROLE_STAFF', 'ROLE_COORDINATOR'],
  },
  {
    to: '/patients',
    icon: Users,
    label: 'Pacientes',
    roles: ['ROLE_ADMIN', 'ROLE_STAFF'],
  },
  {
    to: '/doctors',
    icon: UserRound,
    label: 'Doctores',
    roles: ['ROLE_ADMIN', 'ROLE_STAFF'],
  },
  {
    to: '/appointments',
    icon: Calendar,
    label: 'Citas',
    roles: ['ROLE_ADMIN', 'ROLE_STAFF', 'ROLE_DOCTOR'],
  },
  {
    to: '/appointment-types',
    icon: Clock,
    label: 'Tipos de Cita',
    roles: ['ROLE_ADMIN', 'ROLE_STAFF'],
  },
  {
    to: '/specialties',
    icon: Stethoscope,
    label: 'Especialidades',
    roles: ['ROLE_ADMIN', 'ROLE_STAFF'],
  },
  {
    to: '/offices',
    icon: Building2,
    label: 'Consultorios',
    roles: ['ROLE_ADMIN', 'ROLE_STAFF'],
  },
  {
    to: '/availability',
    icon: ClipboardList,
    label: 'Disponibilidad',
    roles: ['ROLE_ADMIN', 'ROLE_STAFF'],
  },
  {
    to: '/reports',
    icon: BarChart3,
    label: 'Reportes',
    roles: ['ROLE_ADMIN', 'ROLE_COORDINATOR'],
  },
  {
    to: '/users',
    icon: Users,
    label: 'Administrar usuarios',
    roles: ['ROLE_ADMIN'],
  },
];

function canSee(itemRoles, userRoles) {
  if (!itemRoles || itemRoles.length === 0) return true;
  return itemRoles.some((r) => userRoles.includes(r));
}

function Sidebar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const userRoles = Array.isArray(user?.roles)
    ? user.roles
    : user?.roles
    ? [user.roles]
    : [];

  const visibleItems = NAV_ITEMS.filter((item) => canSee(item.roles, userRoles));

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <div className="sidebar__logo-image-container">
          <img src="/icon_sidebar.png" alt="Logo UMARS" className="sidebar__logo-image" />
        </div>
        <div className="sidebar__logo-text">
          <span className="logo-name">UMARS</span>
          <span className="logo-subtitle">Plataforma de Reservas Médicas</span>
        </div>
      </div>

      <div className="sidebar__divider" />

      <nav className="sidebar__nav">
        <p className="sidebar__section-label">Menú Principal</p>
        <ul className="sidebar__list">
          {visibleItems.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink to={to} className="sidebar__link">
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar__footer">
        <button className="sidebar__logout" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;