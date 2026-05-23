// specialtiesApi.js
// Todas las llamadas HTTP relacionadas con especialidades.
// Backend: SIN paginación, solo GET y POST, no hay endpoint de edición.

import api from './AxiosConfig';

// ─────────────────────────────────────────────────────────────
// LISTA COMPLETA (sin paginación)
// GET /api/specialties
// Devuelve List<SpecialtySummaryResponse>:
//   [{ id, name, description }, ...]
// ─────────────────────────────────────────────────────────────
export async function getSpecialties() {
  const response = await api.get('/api/specialties');
  return response.data;
}

// ─────────────────────────────────────────────────────────────
// CREAR ESPECIALIDAD
// POST /api/specialties
// Body: SpecialtyCreateRequest
//   { name, description? }
// ─────────────────────────────────────────────────────────────
export async function createSpecialty(specialtyData) {
  const response = await api.post('/api/specialties', specialtyData);
  return response.data;
}