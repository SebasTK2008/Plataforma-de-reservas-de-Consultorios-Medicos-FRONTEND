// src/pages/UnderConstruction.jsx
// Componente reutilizable que muestra "en construcción"
// Lo usaremos temporalmente en todas las páginas nuevas

import { Construction } from 'lucide-react';

// Recibe "title" y "description" como props
// para personalizar cada página
function UnderConstruction({ title, description }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '60vh',
      gap: '16px',
      color: '#5c6370'
    }}>
      <Construction size={64} color="#004a80" />
      <h2 style={{ color: '#1a1a2e', fontFamily: 'Montserrat, sans-serif' }}>
        {title}
      </h2>
      <p style={{ maxWidth: '400px', textAlign: 'center' }}>
        {description}
      </p>
    </div>
  );
}

export default UnderConstruction;