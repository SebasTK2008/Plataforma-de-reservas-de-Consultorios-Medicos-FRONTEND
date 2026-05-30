import api from './AxiosConfig';

// GET /api/dashboard?date=YYYY-MM-DD
// Roles: ADMIN, COORDINATOR, STAFF
// Devuelve DashboardResponse:
// { activeDoctors, inactiveDoctors, activePatients, inactivePatients,
//   todayAppointments, todayCompletedAppointments, todayScheduledAppointments }
export async function getDashboardStats(date) {
  const response = await api.get('/api/dashboard', { params: { date } });
  return response.data;
}