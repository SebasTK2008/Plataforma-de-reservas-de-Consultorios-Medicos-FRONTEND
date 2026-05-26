// doctorsApi.js
// Todas las llamadas HTTP relacionadas con doctores.

import api from './AxiosConfig';

// ─────────────────────────────────────────────────────────────
// LISTA PAGINADA
// GET /api/doctors?page=0&size=10&sort=createdAt,asc
// Devuelve Page<DoctorSummaryResponse>:
// { content: [...], totalPages: N, totalElements: N, number: N }
// ─────────────────────────────────────────────────────────────
export async function getDoctors(page = 0, size = 10) {
  const response = await api.get('/api/doctors', {
    params: { page, size, sort: 'createdAt,asc' },
  });
  return response.data;
}

// ─────────────────────────────────────────────────────────────
// CREAR DOCTOR
// POST /api/doctors
// Body: DoctorCreateRequest
//   { fullName, email, licenseNumber, documentNumber, specialtyId }
// ─────────────────────────────────────────────────────────────
export async function createDoctor(doctorData) {
  const response = await api.post('/api/doctors', doctorData);
  return response.data;
}

// ─────────────────────────────────────────────────────────────
// ACTUALIZAR DOCTOR
// PATCH /api/doctors/{id}
// Body: DoctorUpdateRequest (campos opcionales)
//   { fullName?, email?, specialtyId? }
//
// NOTA: licenseNumber y documentNumber NO son editables.
// El status NO tiene endpoint propio en el controlador actual.
// ─────────────────────────────────────────────────────────────
export async function updateDoctor(id, doctorData) {
  const payload = {};

  if (doctorData.fullName   !== undefined) payload.fullName   = doctorData.fullName;
  if (doctorData.email      !== undefined) payload.email      = doctorData.email;
  if (doctorData.specialtyId !== undefined) payload.specialtyId = doctorData.specialtyId;
  if (doctorData.status      !== undefined) payload.status      = doctorData.status;

  const response = await api.patch(`/api/doctors/${id}`, payload);
  return response.data;
}