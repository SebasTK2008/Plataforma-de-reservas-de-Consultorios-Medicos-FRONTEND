import { 
  LayoutDashboard, 
  Users, 
  UserRound, 
  Calendar, 
  Stethoscope,
  Building2,
  ClipboardList,
  BarChart3,
  LogOut
} from 'lucide-react';

import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const NAV_ITEMS = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard'     },
  { to: '/patients',     icon: Users,           label: 'Pacientes'     },
  { to: '/doctors',      icon: UserRound,       label: 'Doctores'      },
  { to: '/appointments', icon: Calendar,        label: 'Citas'         },
  { to: '/specialties',  icon: Stethoscope,     label: 'Especialidades'},
  { to: '/offices',      icon: Building2,       label: 'Consultorios'  },
  { to: '/schedules',    icon: ClipboardList,   label: 'Horarios'      },
  { to: '/reports',      icon: BarChart3,       label: 'Reportes'      },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      {/* LOGO */}
      <div className="sidebar__logo">
        <div className="sidebar__logo-icon">
          <Stethoscope size={32} color="white" />
        </div>
        <div className="sidebar__logo-text">
          <span className="logo-name">UMARS</span>
          <span className="logo-subtitle">Plataforma de Reservas Médicas</span>
        </div>
      </div>

      {/* SEPARADOR */}
      <div className="sidebar__divider" />

      {/* NAVEGACIÓN */}
      <nav className="sidebar__nav">
        <p className="sidebar__section-label">Menú Principal</p>
        <ul className="sidebar__list">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              {/* NavLink agrega automáticamente la clase "active"
                  cuando la ruta actual coincide con "to" */}
              <NavLink to={to} className="sidebar__link">
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* BOTÓN CERRAR SESIÓN al fondo */}
      <div className="sidebar__footer">
        <button className="sidebar__logout">
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;