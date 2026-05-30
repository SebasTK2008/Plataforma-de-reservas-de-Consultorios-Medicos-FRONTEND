import { useState, useCallback } from 'react';
import { getPatients } from '../api/patientsApi';
import { getTodayAppointments, getRecentAppointments } from '../api/appointmentsApi';
import { getDoctorProductivity } from '../api/reportsApi';

const ROLE_ADMIN = 'ROLE_ADMIN';
const ROLE_COORDINATOR = 'ROLE_COORDINATOR';

export const canSeeOperations = (roles) => roles.includes(ROLE_ADMIN);
export const canSeeReports = (roles) => roles.includes(ROLE_ADMIN) || roles.includes(ROLE_COORDINATOR);

export function useDashboardData(roles = []) {
  const [stats, setStats] = useState({
    totalPatients: null,
    todayAppointments: null,
    scheduledAppointments: null,
    completedToday: null,
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [topDoctors, setTopDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const promises = [];
      const keys = [];

      if (canSeeOperations(roles)) {
        promises.push(getPatients(0, 1));
        promises.push(getTodayAppointments());
        promises.push(getRecentAppointments());
        keys.push('patients', 'today', 'recent');
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

      if (canSeeOperations(roles)) {
        const todayContent = data.today?.content ?? [];

        setStats({
          totalPatients: data.patients?.totalElements ?? null,
          todayAppointments: data.today?.totalElements ?? null,
          scheduledAppointments: todayContent.filter((appointment) => appointment.status === 'SCHEDULED').length || null,
          completedToday: todayContent.filter((appointment) => appointment.status === 'COMPLETED').length || null,
        });

        setRecentAppointments(data.recent?.content ?? []);
      }

      if (canSeeReports(roles)) {
        setTopDoctors((data.productivity ?? []).slice(0, 5));
      }

      setLastUpdated(new Date().toLocaleTimeString('es-CO'));
    } catch (fetchError) {
      console.error('Dashboard data load failed:', fetchError);
      setError('No se pudieron cargar los datos del dashboard.');
    } finally {
      setLoading(false);
    }
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
