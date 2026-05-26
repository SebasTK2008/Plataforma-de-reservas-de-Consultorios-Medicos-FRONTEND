// officesApi.js
// Todas las llamadas HTTP relacionadas con consultorios.
//
// CAMBIO 1: updateOffice ya NO envía "status" por defecto.
// ¿Por qué? Porque el backend (Spring Boot) lanza un 400 si recibe un campo
// que no existe en el DTO (OfficeUpdateRequest). Si tu DTO aún no tiene
// el campo "status", enviarlo causa el error de guardado.
//
// SOLUCIÓN: Solo enviamos status si el parámetro "includeStatus" es true.
// Cuando agregues status a tu OfficeUpdateRequest en el backend,
// cambia la llamada en useOffices para que lo incluya.
//
// CAMBIO 2: Mejor extracción de mensajes de error del backend.
// Spring Boot puede devolver errores en varias formas:
//   - { message: "..." }               → GlobalExceptionHandler simple
//   - { errors: ["...", "..."] }        → @Valid con BindingResult
//   - { fieldErrors: { campo: "..." } } → errores por campo
// La función extractErrorMessage cubre los tres casos.

import api from './AxiosConfig';

// ── Helper: extrae el mensaje más útil de un error de Axios ──
// Lo exportamos para que otros archivos API puedan usarlo también.
export function extractErrorMessage(err, fallback = 'Error desconocido') {
  const data = err.response?.data;
  if (!data) return err.message ?? fallback;

  // Caso 1: { message: "texto" }
  if (typeof data.message === 'string') return data.message;

  // Caso 2: { errors: ["texto1", "texto2"] }
  if (Array.isArray(data.errors) && data.errors.length > 0)
    return data.errors.join('. ');

  // Caso 3: { fieldErrors: { campo: "mensaje" } }
  if (data.fieldErrors && typeof data.fieldErrors === 'object') {
    const msgs = Object.values(data.fieldErrors);
    if (msgs.length > 0) return msgs.join('. ');
  }

  // Caso 4: el backend devolvió solo un string
  if (typeof data === 'string') return data;

  return fallback;
}


// ── Lista completa (sin paginación) ──────────────────────────
export async function getOffices() {
  const response = await api.get('/api/offices');
  return response.data;
}


// ── Crear consultorio ─────────────────────────────────────────
// POST /api/offices
// Body: { name, location, description?, roomNumber }
// El status no se envía al crear: el backend lo inicializa como AVAILABLE.
export async function createOffice(officeData) {
  const response = await api.post('/api/offices', officeData);
  return response.data;
}


// ── Actualizar consultorio ────────────────────────────────────
// PATCH /api/offices/{id}
// Solo enviamos los campos que el backend acepta en OfficeUpdateRequest.
//
// IMPORTANTE: El parámetro "includeStatus" controla si enviamos el campo status.
// - Ponlo en false (default) si tu OfficeUpdateRequest aún no tiene el campo.
// - Ponlo en true cuando lo agregues al DTO del backend.
//
// Esto evita el error 400 "Unrecognized field 'status'" que causa el bug de edición.
export async function updateOffice(id, officeData, includeStatus = false) {
  const payload = {};

  // Solo agregamos un campo al payload si tiene valor real.
  // undefined y string vacío se omiten para no sobrescribir con basura.
  if (officeData.name        !== undefined) payload.name        = officeData.name;
  if (officeData.location    !== undefined) payload.location    = officeData.location;
  if (officeData.description !== undefined) payload.description = officeData.description;
  if (officeData.roomNumber  !== undefined) payload.roomNumber  = officeData.roomNumber;

  // Solo incluimos status cuando el backend esté listo para recibirlo.
  // Cambia includeStatus a true en useOffices.jsx cuando actualices el DTO.
  if (includeStatus && officeData.status !== undefined) {
    payload.status = officeData.status;
  }

  const response = await api.patch(`/api/offices/${id}`, payload);
  return response.data;
}