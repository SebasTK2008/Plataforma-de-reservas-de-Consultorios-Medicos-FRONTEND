// availabilityApi.js
// Maneja los endpoints de disponibilidad de horarios.
// El backend calcula automáticamente los slots disponibles
// restando los intervalos ya ocupados por citas existentes.

import api from './AxiosConfig';

// ─────────────────────────────────────────────────────────────
// SLOTS DISPONIBLES PARA UN DOCTOR EN UNA FECHA
// GET /api/availability/doctors/{doctorId}?date=YYYY-MM-DD
//
// El backend devuelve List<AvailabilitySlotResponse>:
// [{ date: "2026-06-15", slotStart: "08:00", slotEnd: "08:30" }, ...]
//
// IMPORTANTE: slotStart y slotEnd vienen como "HH:mm" o "HH:mm:ss"
// Usamos substring(0,5) para quedarnos solo con "HH:mm"
// ─────────────────────────────────────────────────────────────
export async function getAvailableSlots(doctorId, date) {
  const response = await api.get(`/api/availability/doctors/${doctorId}`, {
    params: { date }, // date en formato "YYYY-MM-DD"
  });
  return response.data; // Array de slots disponibles
}

// ─────────────────────────────────────────────────────────────
// SLOTS DISPONIBLES PARA UN DOCTOR + TIPO DE CITA
// GET /api/availability/doctors/{doctorId}/appointment-types/{typeId}?date=...
//
// Este endpoint filtra los slots según la duración del tipo de cita.
// Por ejemplo: si el tipo dura 60 min, solo devuelve slots
// donde quepan 60 minutos consecutivos disponibles.
// ─────────────────────────────────────────────────────────────
export async function getAvailableSlotsForType(doctorId, appointmentTypeId, date) {
  const response = await api.get(
    `/api/availability/doctors/${doctorId}/appointment-types/${appointmentTypeId}`,
    { params: { date } }
  );
  return response.data;
}