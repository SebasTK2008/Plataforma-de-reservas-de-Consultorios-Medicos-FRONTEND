// patientsApi.js
// Esta capa SOLO sabe cómo hablar con el backend.
// No sabe nada de React, de estado, ni de la UI.
// Es puro JavaScript que hace peticiones HTTP.

import api from './AxiosConfig';

// ─────────────────────────────────────────────────────
// ¿Qué es "api"?
// Es la instancia de Axios que ya configuraste en AxiosConfig.js
// Ya tiene la baseURL, el timeout, y el interceptor del JWT.
// Así que cuando hacemos api.get('/api/patients'), en realidad
// se convierte en: GET http://localhost:8080/api/patients
// Y el token JWT se agrega automáticamente en cada petición.
// ─────────────────────────────────────────────────────


// OBTENER LISTA PAGINADA DE PACIENTES
// El backend espera: GET /api/patients?page=0&size=10&sort=createdAt,asc
// Devuelve un objeto Page de Spring: { content: [...], totalPages: X, totalElements: X, ... }
export async function getPatients(page = 0, size = 10) {
  const response = await api.get('/api/patients', {
    params: {
      page,        // Número de página (empieza en 0 en Spring)
      size,        // Cuántos registros por página
      sort: 'createdAt,desc'  // Ordenar por fecha de creación, más reciente primero
    }
  });
  // response.data contiene el body de la respuesta del backend
  return response.data;
}


// OBTENER UN PACIENTE POR ID
// El backend espera: GET /api/patients/{id}
// {id} es un UUID (ejemplo: "550e8400-e29b-41d4-a716-446655440000")
export async function getPatientById(id) {
  const response = await api.get(`/api/patients/${id}`);
  return response.data;
}


// CREAR UN NUEVO PACIENTE
// El backend espera: POST /api/patients
// Con body: { fullName, email, phoneNumber, documentNumber, studentCode }
// Nota: studentCode es opcional según el DTO del backend
export async function createPatient(patientData) {
  const response = await api.post('/api/patients', patientData);
  return response.data;
}


// ACTUALIZAR UN PACIENTE EXISTENTE
// El backend espera: PATCH /api/patients/{id}
// Con body: { fullName, email, phoneNumber } (campos opcionales)
// PATCH (no PUT) significa actualización parcial: solo envías lo que cambió
export async function updatePatient(id, patientData) {
  const response = await api.patch(`/api/patients/${id}`, patientData);
  return response.data;
}


// BUSCAR PACIENTES (filtro local por ahora)
// El backend no tiene un endpoint de búsqueda por nombre directamente,
// así que cargamos todos y filtramos en el frontend.
// En producción real, lo ideal sería que el backend tenga ese endpoint.
// Esta es una decisión pragmática para el proyecto académico.
export async function searchPatients(query, page = 0, size = 100) {
  const response = await api.get('/api/patients', {
    params: { page, size, sort: 'fullName,asc' }
  });
  // Filtramos los resultados en el cliente si hay una query
  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    return {
      ...response.data,
      content: response.data.content.filter(p =>
        p.fullName.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.documentNumber.toLowerCase().includes(q)
      )
    };
  }
  return response.data;
}