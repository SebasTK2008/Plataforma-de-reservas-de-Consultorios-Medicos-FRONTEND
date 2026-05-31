import { useState, useCallback } from 'react';
import { getDashboardStats } from '../api/dashboardApi';
import { getRecentAppointments } from '../api/appointmentsApi';
import { getDoctorProductivity } from '../api/reportsApi';

// Qué puede ver cada rol:
//   ADMIN       → stats operativas + citas recientes + ranking doctores
//   COORDINATOR → solo ranking de doctores (reportes)
//   STAFF       → stats operativas + citas recientes (no ranking)
//
// El endpoint /api/dashboard ya acepta ADMIN, COORDINATOR y STAFF
// según SecurityConfig. No necesitamos guardarlo por rol en el frontend;
// el backend devuelve los mismos campos para todos.

const ROLE_ADMIN = 'ROLE_ADMIN';
const ROLE_COORDINATOR = 'ROLE_COORDINATOR';
const ROLE_STAFF = 'ROLE_STAFF';

export const canSeeOperations = (roles) =>
  roles.includes(ROLE_ADMIN) ||
  roles.includes(ROLE_STAFF) ||
  roles.includes(ROLE_COORDINATOR);

export const canSeeReports = (roles) =>
  roles.includes(ROLE_ADMIN) || roles.includes(ROLE_COORDINATOR);

// Devuelve hoy en formato YYYY-MM-DD que espera el backend
function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function useDashboardData(roles = []) {
  const [stats, setStats] = useState({
    activeDoctors: null,
    inactiveDoctors: null,
    activePatients: null,
    inactivePatients: null,
    todayAppointments: null,
    todayCompletedAppointments: null,
    todayScheduledAppointments: null,
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [topDoctors, setTopDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const promises = [];
    const keys = [];

    // Todos los roles con acceso al dashboard pueden pedir el endpoint principal
    promises.push(getDashboardStats(todayISO()));
    keys.push('dashboard');

    if (canSeeOperations(roles)) {
      promises.push(getRecentAppointments());
      keys.push('recent');
    }

    if (canSeeReports(roles)) {
      promises.push(getDoctorProductivity());
      keys.push('productivity');
    }

    const results = await Promise.allSettled(promises);
    const data = {};

    keys.forEach((key, index) => {
      if (results[index].status === 'fulfilled') {
        data[key] = results[index].value;
      } else {
        console.warn(`Dashboard: fallo al cargar '${key}'`, results[index].reason);
        data[key] = null;
      }
    });

    if (data.dashboard) {
      setStats(data.dashboard);
    } else {
      setError('No se pudieron cargar los datos del dashboard.');
    }

    if (canSeeOperations(roles)) {
      setRecentAppointments(data.recent?.content ?? []);
    }

    if (canSeeReports(roles)) {
      setTopDoctors((data.productivity ?? []).slice(0, 5));
    }

    setLastUpdated(new Date().toLocaleTimeString('es-CO'));
    setLoading(false);
  }, [roles]);

  return {
    stats,
    recentAppointments,
    topDoctors,
    loading,
    error,
    lastUpdated,
    loadDashboardData,
  };
}