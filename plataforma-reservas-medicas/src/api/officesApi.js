// officesApi.js
// Todas las llamadas HTTP relacionadas con consultorios.
// IMPORTANTE: el backend retorna List (sin paginación) en findAll.

import api from './AxiosConfig';

// ─────────────────────────────────────────────────────────────
// LISTA COMPLETA (sin paginación del backend)
// GET /api/offices → List<OfficeSummaryResponse>
// ─────────────────────────────────────────────────────────────
export async function getOffices() {
  const response = await api.get('/api/offices');
  return response.data;
}

// ─────────────────────────────────────────────────────────────
// CREAR CONSULTORIO
// POST /api/offices
// Body: OfficeCreateRequest { name, location, description?, roomNumber }
// ─────────────────────────────────────────────────────────────
export async function createOffice(officeData) {
  const response = await api.post('/api/offices', officeData);
  return response.data;
}

// ─────────────────────────────────────────────────────────────
// ACTUALIZAR CONSULTORIO
// PATCH /api/offices/{id}
// Body: OfficeUpdateRequest { name?, location?, description?, roomNumber? }
// El status se actualiza incluyendo el campo en el body
// ─────────────────────────────────────────────────────────────
export async function updateOffice(id, officeData) {
  const payload = {};
  if (officeData.name        !== undefined) payload.name        = officeData.name;
  if (officeData.location    !== undefined) payload.location    = officeData.location;
  if (officeData.description !== undefined) payload.description = officeData.description;
  if (officeData.roomNumber  !== undefined) payload.roomNumber  = officeData.roomNumber;

  const response = await api.patch(`/api/offices/${id}`, payload);
  return response.data;
}