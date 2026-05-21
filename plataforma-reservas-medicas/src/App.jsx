// App.jsx — Mapa de todas las rutas de la app
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/layout/PrivateRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <Routes>

      {/* ── RUTA PÚBLICA ──────────────────────────────
          Cualquiera puede acceder, logueado o no      */}
      <Route path="/login" element={<LoginPage />} />

      {/* ── RUTAS PRIVADAS ────────────────────────────
          Solo accesibles si hay sesión activa
          PrivateRoute actúa como un "portero"         */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        }
      />

      {/* Ruta raíz — redirige al dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Cualquier ruta no definida → redirige al dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />

    </Routes>
  );
}

export default App;