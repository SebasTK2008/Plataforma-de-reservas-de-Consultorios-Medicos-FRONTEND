import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../Hooks/UseAuth';
import PrivateRoute from './PrivateRoute';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import PatientsPage from '../pages/PatientsPage';
import DoctorsPage from '../pages/DoctorsPage';
import AppointmentsPage from '../pages/AppointmentsPage';
import AppointmentTypesPage from '../pages/AppointmentTypesPage';
import SpecialtiesPage from '../pages/SpecialtiesPage';
import OfficesPage from '../pages/OfficesPage';
import AvailabilityPage from '../pages/AvailabilityPage';
import ReportsPage from '../pages/ReportsPage';
import UsersPage from '../pages/UsersPage';

// Ruta de inicio según el rol del usuario.
// El orden importa: se usa el primer match.
const HOME_BY_ROLE = [
  { role: 'ROLE_DOCTOR',      path: '/appointments' },
  { role: 'ROLE_COORDINATOR', path: '/dashboard'    },
  { role: 'ROLE_STAFF',       path: '/dashboard'    },
  { role: 'ROLE_ADMIN',       path: '/dashboard'    },
];

function getHomeFor(roles = []) {
  const match = HOME_BY_ROLE.find((entry) => roles.includes(entry.role));
  return match ? match.path : '/dashboard';
}

function DefaultRedirect() {
  const { user } = useAuth();
  const roles = Array.isArray(user?.roles)
    ? user.roles
    : user?.roles
    ? [user.roles]
    : [];
  return <Navigate to={getHomeFor(roles)} replace />;
}

const privateRoutes = [
  { path: '/dashboard',         element: <DashboardPage />        },
  { path: '/patients',          element: <PatientsPage />         },
  { path: '/doctors',           element: <DoctorsPage />          },
  { path: '/appointments',      element: <AppointmentsPage />     },
  { path: '/appointment-types', element: <AppointmentTypesPage /> },
  { path: '/specialties',       element: <SpecialtiesPage />      },
  { path: '/offices',           element: <OfficesPage />          },
  { path: '/availability',      element: <AvailabilityPage />     },
  { path: '/reports',           element: <ReportsPage />          },
  { path: '/users',             element: <UsersPage />            },
];

function AppRouter() {
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

      {/* "/" y cualquier ruta desconocida redirigen según el rol */}
      <Route path="/"  element={<PrivateRoute><DefaultRedirect /></PrivateRoute>} />
      <Route path="*"  element={<PrivateRoute><DefaultRedirect /></PrivateRoute>} />
    </Routes>
  );
}

export default AppRouter;