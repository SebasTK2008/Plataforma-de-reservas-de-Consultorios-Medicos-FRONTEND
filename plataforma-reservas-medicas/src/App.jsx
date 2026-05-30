import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/layout/PrivateRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import DoctorsPage from './pages/DoctorsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import AppointmentTypesPage from './pages/AppointmentTypesPage';
import SpecialtiesPage from './pages/SpecialtiesPage';
import OfficesPage from './pages/OfficesPage';
import AvailabilityPage from './pages/AvailabilityPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';

const privateRoutes = [
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/patients', element: <PatientsPage /> },
  { path: '/doctors', element: <DoctorsPage /> },
  { path: '/appointments', element: <AppointmentsPage /> },
  { path: '/appointment-types', element: <AppointmentTypesPage /> },
  { path: '/specialties', element: <SpecialtiesPage /> },
  { path: '/offices', element: <OfficesPage /> },
  { path: '/availability', element: <AvailabilityPage /> },
  { path: '/reports', element: <ReportsPage /> },
  { path: '/users', element: <UsersPage /> },
];

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {privateRoutes.map(({ path, element }) => (
        <Route
          key={path}
          path={path}
          element={<PrivateRoute>{element}</PrivateRoute>}
        />
      ))}

      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;