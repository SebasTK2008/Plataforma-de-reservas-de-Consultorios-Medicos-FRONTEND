// reportsApi.js
// Todas las llamadas HTTP relacionadas con reportes.
//
// ENDPOINTS QUE CONSUME:
//
// 1. GET /api/reports/office-occupancy?from=YYYY-MM-DD&to=YYYY-MM-DD
//    → List<OfficeOccupancyResponse>
//    Requiere rango de fechas (from/to).
//
// 2. GET /api/reports/doctor-productivity
//    → List<DoctorProductivityResponse>
//    No requiere parámetros. Devuelve ranking de doctores por citas completadas.
//
// 3. GET /api/reports/no-show-patients?from=YYYY-MM-DD&to=YYYY-MM-DD
//    → List<NoShowPatientResponse>
//    Requiere rango de fechas (from/to).
//
// FORMATO DE FECHAS:
//   El backend usa @DateTimeFormat(iso = DateTimeFormat.ISO.DATE),
//   lo que significa que espera exactamente "YYYY-MM-DD" (ISO 8601 sin hora).
//   Ejemplo: "2026-01-01" ✓   "2026-01-01T00:00:00" ✗

import api from './AxiosConfig';

// ─── OCUPACIÓN DE CONSULTORIOS ───────────────────────────────
// Devuelve cuántas citas, minutos ocupados y no-shows tiene cada consultorio
// en el rango de fechas especificado.
//
// @param {string} from - Fecha inicio en formato "YYYY-MM-DD"
// @param {string} to   - Fecha fin   en formato "YYYY-MM-DD"
// @returns {Promise<OfficeOccupancyResponse[]>}
export async function getOfficeOccupancy(from, to) {
  const response = await api.get('/api/reports/office-occupancy', {
    params: { from, to },
  });
  return response.data;
}

// ─── PRODUCTIVIDAD DE DOCTORES ───────────────────────────────
// Devuelve el ranking completo de doctores ordenado por citas completadas.
// No requiere filtro de fecha — el backend calcula sobre todo el histórico.
//
// @returns {Promise<DoctorProductivityResponse[]>}
export async function getDoctorProductivity() {
  const response = await api.get('/api/reports/doctor-productivity');
  return response.data;
}

// ─── PACIENTES CON NO-SHOW ───────────────────────────────────
// Devuelve los pacientes que más veces no asistieron a sus citas
// en el rango de fechas dado.
//
// @param {string} from - Fecha inicio en formato "YYYY-MM-DD"
// @param {string} to   - Fecha fin   en formato "YYYY-MM-DD"
// @returns {Promise<NoShowPatientResponse[]>}
export async function getNoShowPatients(from, to) {
  const response = await api.get('/api/reports/no-show-patients', {
    params: { from, to },
  });
  return response.data;
}