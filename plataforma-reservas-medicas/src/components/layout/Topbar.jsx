// TopBar.jsx — La barra superior con info del usuario
import { Bell, Search } from 'lucide-react';
import './TopBar.css';

function TopBar({ pageTitle }) {
  return (
    <header className="topbar">
      {/* Título de la página actual */}
      <div className="topbar__title">
        <h1>{pageTitle}</h1>
      </div>

      {/* Acciones del lado derecho */}
      <div className="topbar__actions">

        {/* Buscador */}
        <div className="topbar__search">
          <Search size={16} />
          <input type="text" placeholder="Buscar..." />
        </div>

        {/* Notificaciones */}
        <button className="topbar__icon-btn" title="Notificaciones">
          <Bell size={20} />
          {/* Badge rojo del contador — solo visible si hay notificaciones */}
          <span className="topbar__badge">3</span>
        </button>

        {/* Avatar del usuario */}
        <div className="topbar__user">
          <div className="topbar__avatar">
            {/* Iniciales del usuario — después vendrán del contexto */}
            <span>AD</span>
          </div>
          <div className="topbar__user-info">
            <span className="topbar__user-name">Admin</span>
            <span className="topbar__user-role">Administrador</span>
          </div>
        </div>

      </div>
    </header>
  );
}

export default TopBar;