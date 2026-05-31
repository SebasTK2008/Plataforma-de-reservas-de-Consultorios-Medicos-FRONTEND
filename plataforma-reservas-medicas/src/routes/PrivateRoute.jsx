// PrivateRoute.jsx — Guarda de seguridad para rutas privadas
// Si el usuario NO está autenticado → lo manda al Login
// Si el usuario SÍ está autenticado → muestra la página pedida

import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function PrivateRoute({ children }) {

  // Leemos si hay sesión activa desde el AuthContext
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default PrivateRoute;