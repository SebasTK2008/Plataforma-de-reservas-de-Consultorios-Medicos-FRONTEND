// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/layout/PrivateRoute';

// Páginas públicas
import LoginPage from './pages/LoginPage';

// Páginas privadas
import DashboardPage    from './pages/DashboardPage';
import PatientsPage     from './pages/PatientsPage';
import DoctorsPage      from './pages/DoctorsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import SpecialtiesPage  from './pages/SpecialtiesPage';
import OfficesPage      from './pages/OfficesPage';
import SchedulesPage    from './pages/SchedulesPage';
import ReportsPage      from './pages/ReportsPage';

// PrivateRoute es nuestro "portero":
// si no hay sesión activa, manda al login
function App() {
  return (
    <Routes>

      {/* ── RUTA PÚBLICA ─────────────────────── */}
      <Route path="/login" element={<LoginPage />} />

      {/* ── RUTAS PRIVADAS ───────────────────── */}
      {/* Cada ruta está envuelta en PrivateRoute  */}
      {/* Si no hay sesión → redirige a /login     */}

      <Route path="/dashboard" element={
        <PrivateRoute><DashboardPage /></PrivateRoute>
      }/>

      <Route path="/patients" element={
        <PrivateRoute><PatientsPage /></PrivateRoute>
      }/>

      <Route path="/doctors" element={
        <PrivateRoute><DoctorsPage /></PrivateRoute>
      }/>

      <Route path="/appointments" element={
        <PrivateRoute><AppointmentsPage /></PrivateRoute>
      }/>

      <Route path="/specialties" element={
        <PrivateRoute><SpecialtiesPage /></PrivateRoute>
      }/>

      <Route path="/offices" element={
        <PrivateRoute><OfficesPage /></PrivateRoute>
      }/>

      <Route path="/schedules" element={
        <PrivateRoute><SchedulesPage /></PrivateRoute>
      }/>

      <Route path="/reports" element={
        <PrivateRoute><ReportsPage /></PrivateRoute>
      }/>

      {/* Ruta raíz → redirige al dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Cualquier ruta no definida → dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />

    </Routes>
  );
}

export default App;