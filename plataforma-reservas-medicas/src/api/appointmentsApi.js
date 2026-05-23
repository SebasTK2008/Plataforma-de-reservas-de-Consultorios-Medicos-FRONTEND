// appointmentsApi.js
// Maneja todas las peticiones relacionadas con citas médicas.

import api from './AxiosConfig';


// OBTENER CITAS CON FILTROS
// El backend usa @ModelAttribute AppointmentSearchRequest, lo que significa
// que los parámetros van como query params en la URL:
// GET /api/appointments?page=0&size=10&status=SCHEDULED&startAt=2026-01-01T00:00
export async function getAppointments(filters = {}, page = 0, size = 10) {
  const response = await api.get('/api/appointments', {
    params: {
      page,
      size,
      sort: 'createdAt,desc',
      // Solo enviamos los filtros que tienen valor (no null, no undefined, no "")
      // El operador spread (...) aquí "desempaca" el objeto filters
      // Ejemplo: si filters = { status: 'SCHEDULED' }
      // entonces params quedará: { page: 0, size: 10, sort: '...', status: 'SCHEDULED' }
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== null && v !== undefined && v !== '')
      )
    }
  });
  return response.data;
}


// OBTENER CITAS DE HOY
// Construimos un rango de fechas: desde las 00:00 hasta las 23:59 de hoy
// El formato que espera el backend es: yyyy-MM-dd'T'HH:mm
export async function getTodayAppointments() {
  const today = new Date();

  // Formato: 2026-05-22T00:00
  const formatDate = (date) => {
    const pad = n => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  return getAppointments({
    startAt: formatDate(startOfDay),
    endAt: formatDate(endOfDay)
  }, 0, 100);
}


// OBTENER CITAS RECIENTES (las últimas 5)
export async function getRecentAppointments() {
  const response = await api.get('/api/appointments', {
    params: { page: 0, size: 5, sort: 'createdAt,desc' }
  });
  return response.data;
}


// CONFIRMAR UNA CITA
export async function confirmAppointment(id) {
  const response = await api.patch(`/api/appointments/${id}/confirm`);
  return response.data;
}


// CANCELAR UNA CITA
export async function cancelAppointment(id, cancelReason) {
  const response = await api.patch(`/api/appointments/${id}/cancel`, { cancelReason });
  return response.data;
}