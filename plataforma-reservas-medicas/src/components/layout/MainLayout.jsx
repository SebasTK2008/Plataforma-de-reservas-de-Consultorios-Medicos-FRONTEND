// MainLayout.jsx — El esqueleto que envuelve todas las páginas
// Este componente define la estructura: sidebar + topbar + contenido
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import './MainLayout.css';

// pageTitle viene como prop desde cada página
// children es el contenido específico de cada página
function MainLayout({ children, pageTitle }) {
  return (
    <div className="layout">

      {/* Sidebar fijo a la izquierda */}
      <Sidebar />

      {/* Todo lo que está a la derecha del sidebar */}
      <div className="layout__main">

        {/* Barra superior */}
        <TopBar pageTitle={pageTitle} />

        {/* El contenido cambia según la página */}
        <main className="layout__content">
          {children}
        </main>

      </div>
    </div>
  );
}

export default MainLayout;