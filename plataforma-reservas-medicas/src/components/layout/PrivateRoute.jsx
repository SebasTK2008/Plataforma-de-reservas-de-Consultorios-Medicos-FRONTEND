// PrivateRoute.jsx — Guarda de seguridad para rutas privadas
// Si el usuario NO está autenticado → lo manda al Login
// Si el usuario SÍ está autenticado → muestra la página pedida

import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

function PrivateRoute({ children }) {

  // Leemos si hay sesión activa desde el AuthContext
  const { isAuthenticated } = useAuth();

  // Si no está autenticado, redirige al login
  // "replace" reemplaza la entrada en el historial
  // (así el botón "atrás" no vuelve a la página protegida)
  if (!isAuthenticated) { //RECORDAR AGREGARLE LA NEGACION PARA QUE FUNCIONE CORRECTAMENTE
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado, muestra el contenido normalmente
  return children;
}

export default PrivateRoute;