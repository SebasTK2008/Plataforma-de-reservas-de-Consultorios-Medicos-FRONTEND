import api from './AxiosConfig';

// ─────────────────────────────────────────────────────────────
// LISTA PAGINADA
// GET /api/patients?page=0&size=10&sort=createdAt,desc
// Devuelve Page<PatientSummaryResponse> de Spring Boot:
// { content: [...], totalPages: N, totalElements: N, number: N }
// ─────────────────────────────────────────────────────────────
export async function getPatients(page = 0, size = 10) {
  const response = await api.get('/api/patients', {
    params: { page, size, sort: 'createdAt,desc' }
  });
  return response.data;
}

// ─────────────────────────────────────────────────────────────
// DETALLE DE UN PACIENTE
// GET /api/patients/{id}
// Devuelve PatientResponse (con appointments incluidos)
// ─────────────────────────────────────────────────────────────
export async function getPatientById(id) {
  const response = await api.get(`/api/patients/${id}`);
  return response.data;
}

// ─────────────────────────────────────────────────────────────
// CREAR PACIENTE
// POST /api/patients
// Body: PatientCreateRequest
//   { fullName, email, phoneNumber, documentNumber, studentCode? }
// ─────────────────────────────────────────────────────────────
export async function createPatient(patientData) {
  const response = await api.post('/api/patients', patientData);
  return response.data;
}

// ─────────────────────────────────────────────────────────────
// ACTUALIZAR PACIENTE
// PATCH /api/patients/{id}
// Body: PatientUpdateRequest (campos opcionales)
//   { fullName?, email?, phoneNumber?, status? }
//
// IMPORTANTE: documentNumber y studentCode NO son editables.
// El backend los ignora si los envías.
// El status SÍ es editable porque lo agregaste al DTO.
// ─────────────────────────────────────────────────────────────
export async function updatePatient(id, patientData) {
  // Construimos el payload con SOLO los campos que el backend acepta editar.
  // Omitimos documentNumber y studentCode intencionalmente.
  const payload = {};

  if (patientData.fullName    !== undefined) payload.fullName    = patientData.fullName;
  if (patientData.email       !== undefined) payload.email       = patientData.email;
  if (patientData.phoneNumber !== undefined) payload.phoneNumber = patientData.phoneNumber;
  if (patientData.status      !== undefined) payload.status      = patientData.status;

  const response = await api.patch(`/api/patients/${id}`, payload);
  return response.data;
}