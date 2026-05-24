import api from './AxiosConfig';

// ─── LISTAR CON FILTROS ─────────────────────────────────────
// El backend usa @ModelAttribute AppointmentSearchRequest:
// filtra por status, patientId, doctorId, startAt, endAt
export async function getAppointments(filters = {}, page = 0, size = 10) {
  const params = { page, size, sort: 'startAt,asc' };
  if (filters.status)    params.status    = filters.status;
  if (filters.startAt)   params.startAt   = filters.startAt;
  if (filters.endAt)     params.endAt     = filters.endAt;
  if (filters.patientId) params.patientId = filters.patientId;
  if (filters.doctorId)  params.doctorId  = filters.doctorId;

  const response = await api.get('/api/appointments', { params });
  return response.data;
}

// ─── CREAR ─────────────────────────────────────────────────
// POST /api/appointments
// { doctorId, patientId, officeId, appointmentTypeId, startAt }
// Nota: startAt viene del datetime-local input → "2026-05-22T10:00"
export async function createAppointment(data) {
  const response = await api.post('/api/appointments', data);
  return response.data;
}

// ─── CICLO DE VIDA ──────────────────────────────────────────
// SCHEDULED → CONFIRMED
export async function confirmAppointment(id) {
  const response = await api.patch(`/api/appointments/${id}/confirm`);
  return response.data;
}

// SCHEDULED | CONFIRMED → CANCELLED  (razón obligatoria)
export async function cancelAppointment(id, cancelReason) {
  const response = await api.patch(
    `/api/appointments/${id}/cancel`,
    { cancelReason }
  );
  return response.data;
}

// CONFIRMED → COMPLETED  (observaciones opcionales)
export async function completeAppointment(id, observations) {
  const response = await api.patch(
    `/api/appointments/${id}/complete`,
    { observations: observations || null }
  );
  return response.data;
}

// CONFIRMED → NO_SHOW
export async function markNoShow(id) {
  const response = await api.patch(`/api/appointments/${id}/no-show`);
  return response.data;
}

// ─── HELPERS para el dashboard (no cambian) ─────────────────
export async function getTodayAppointments() {
  const today = new Date();
  const pad = n => String(n).padStart(2, '0');
  const fmt = d =>
    `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

  const start = new Date(today); start.setHours(0,0,0,0);
  const end   = new Date(today); end.setHours(23,59,59,999);

  return getAppointments({ startAt: fmt(start), endAt: fmt(end) }, 0, 100);
}

export async function getRecentAppointments() {
  const response = await api.get('/api/appointments', {
    params: { page: 0, size: 5, sort: 'createdAt,desc' }
  });
  return response.data;
}