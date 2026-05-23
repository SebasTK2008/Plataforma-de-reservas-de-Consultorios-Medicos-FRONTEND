// reportsApi.js
// Maneja los endpoints de reportes del sistema.

import api from './AxiosConfig';


// PRODUCTIVIDAD DE DOCTORES (ranking por citas completadas)
// GET /api/reports/doctor-productivity
export async function getDoctorProductivity() {
  const response = await api.get('/api/reports/doctor-productivity');
  return response.data;
}


// PACIENTES CON MÁS INASISTENCIAS
// GET /api/reports/no-show-patients?from=2026-01-01&to=2026-12-31
export async function getNoShowPatients(from, to) {
  const response = await api.get('/api/reports/no-show-patients', {
    params: { from, to }
  });
  return response.data;
}


// OCUPACIÓN DE CONSULTORIOS
// GET /api/reports/office-occupancy?from=2026-01-01&to=2026-12-31
export async function getOfficeOccupancy(from, to) {
  const response = await api.get('/api/reports/office-occupancy', {
    params: { from, to }
  });
  return response.data;
}