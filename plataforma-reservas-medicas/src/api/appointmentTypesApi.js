import api from './AxiosConfig';

// GET /api/appointment-types — retorna List (sin paginación)
export async function getAppointmentTypes() {
  const response = await api.get('/api/appointment-types');
  return response.data;
}

// POST /api/appointment-types
// Body: { name, description?, durationMinutes }
// El backend valida: durationMinutes > 0 y <= 480
export async function createAppointmentType(data) {
  const response = await api.post('/api/appointment-types', data);
  return response.data;
}