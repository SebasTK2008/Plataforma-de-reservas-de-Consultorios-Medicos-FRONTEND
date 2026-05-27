import { Routes, Route, Navigate }  from 'react-router-dom';
import PrivateRoute                  from './components/layout/PrivateRoute';
import LoginPage                     from './pages/LoginPage';
import DashboardPage                 from './pages/DashboardPage';
import PatientsPage                  from './pages/PatientsPage';
import DoctorsPage                   from './pages/DoctorsPage';
import AppointmentsPage              from './pages/AppointmentsPage';
import AppointmentTypesPage          from './pages/AppointmentTypesPage';  // ← nuevo
import SpecialtiesPage               from './pages/SpecialtiesPage';
import OfficesPage                   from './pages/OfficesPage';
import AvailabilityPage                 from './pages/AvailabilityPage';
import ReportsPage                   from './pages/ReportsPage';
import UsersPage                     from './pages/UsersPage'; 

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/dashboard"         element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/patients"          element={<PrivateRoute><PatientsPage /></PrivateRoute>} />
      <Route path="/doctors"           element={<PrivateRoute><DoctorsPage /></PrivateRoute>} />
      <Route path="/appointments"      element={<PrivateRoute><AppointmentsPage /></PrivateRoute>} />
      <Route path="/appointment-types" element={<PrivateRoute><AppointmentTypesPage /></PrivateRoute>} />
      <Route path="/specialties"       element={<PrivateRoute><SpecialtiesPage /></PrivateRoute>} />
      <Route path="/offices"           element={<PrivateRoute><OfficesPage /></PrivateRoute>} />
      <Route path="/availability"         element={<PrivateRoute><AvailabilityPage /></PrivateRoute>} />
      <Route path="/reports"           element={<PrivateRoute><ReportsPage /></PrivateRoute>} />
      <Route path="/users"             element={<PrivateRoute><UsersPage /></PrivateRoute>} />

      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;