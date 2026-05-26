import {
  LayoutDashboard, Users, UserRound, Calendar,
  Stethoscope, Building2, ClipboardList,
  BarChart3, LogOut, Clock            // ← Clock para tipos de cita
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Sidebar.css';

const NAV_ITEMS = [
  { to: '/dashboard',         icon: LayoutDashboard, label: 'Dashboard'       },
  { to: '/patients',          icon: Users,           label: 'Pacientes'       },
  { to: '/doctors',           icon: UserRound,       label: 'Doctores'        },
  { to: '/appointments',      icon: Calendar,        label: 'Citas'           },
  { to: '/appointment-types', icon: Clock,           label: 'Tipos de Cita'  }, // ← NUEVO
  { to: '/specialties',       icon: Stethoscope,     label: 'Especialidades'  },
  { to: '/offices',           icon: Building2,       label: 'Consultorios'    },
  { to: '/availability',      icon: ClipboardList,   label: 'Disponibilidad'        },
  { to: '/reports',           icon: BarChart3,       label: 'Reportes'        },
];

function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

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
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
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