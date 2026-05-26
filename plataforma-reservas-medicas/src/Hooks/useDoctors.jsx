// useDoctors.jsx
// Hook personalizado que gestiona el estado y las operaciones CRUD de doctores.
//
// CAMBIOS vs versión anterior:
// 1. addDoctor ahora retorna { success: true, doctorId: id }
//    → El modal de DoctorsPage usa ese ID para crear los horarios DESPUÉS de crear el doctor.
//    → Sin esto, result.doctorId era siempre undefined y los horarios nunca se creaban.
// 2. editDoctor ahora incluye "status" en el payload
//    → Cuando el backend tenga el campo en DoctorUpdateRequest, funcionará automáticamente.

import { useState, useEffect, useCallback } from 'react';
import { getDoctors, createDoctor, updateDoctor } from '../api/doctorsApi';

export function useDoctors() {

  // ── Datos ────────────────────────────────────────────────
  const [doctors,       setDoctors]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  // ── Paginación ───────────────────────────────────────────
  const [totalPages,    setTotalPages]    = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage,   setCurrentPage]  = useState(0);

  // ── Carga de datos ───────────────────────────────────────
  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getDoctors(currentPage, 10);

      setDoctors(data.content        ?? []);
      setTotalPages(data.totalPages  ?? 0);
      setTotalElements(data.totalElements ?? 0);

    } catch (err) {
      setError(
        err.response?.data?.message ??
        err.message ??
        'Error al cargar los doctores'
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);


  // ── Crear doctor ──────────────────────────────────────────
  // FIX CLAVE: Ahora retornamos el doctorId del doctor recién creado.
  //
  // ¿Por qué es importante?
  // En DoctorsPage.jsx, después de crear el doctor, el modal intenta
  // crear los horarios usando el ID del doctor nuevo:
  //
  //   if (!isEditing && schedules.length > 0 && result.doctorId) {
  //     await api.post(`/api/doctors/${result.doctorId}/schedules`, schedule);
  //   }
  //
  // Sin el doctorId en el resultado, esa condición nunca se cumplía
  // y los horarios silenciosamente no se creaban.
  const addDoctor = async (formData) => {
    try {
      const created = await createDoctor({
        fullName:       formData.fullName.trim(),
        email:          formData.email.trim(),
        licenseNumber:  formData.licenseNumber.trim(),
        documentNumber: formData.documentNumber.trim(),
        specialtyId:    formData.specialtyId,
      });

      await fetchDoctors(); // Refresca la tabla

      // ✅ Retornamos el ID del doctor recién creado
      return { success: true, doctorId: created.id };

    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message ?? 'Error al crear el doctor',
      };
    }
  };


  // ── Editar doctor ─────────────────────────────────────────
  // Ahora incluye "status" en el payload.
  //
  // NOTA SOBRE COMPATIBILIDAD CON EL BACKEND:
  // Si el backend aún no tiene "status" en DoctorUpdateRequest,
  // Spring Boot simplemente ignorará el campo desconocido (comportamiento por defecto).
  // Cuando agregues el campo al DTO, empezará a funcionar automáticamente
  // sin necesitar cambiar el frontend.
  //
  // Usamos spread condicional: ...(condition ? { field: value } : {})
  // Esto solo agrega el campo si tiene un valor válido.
  const editDoctor = async (id, formData) => {
    try {
      await updateDoctor(id, {
        // Solo enviamos campos que tengan valor (evitamos enviar undefined)
        ...(formData.fullName?.trim()    ? { fullName:    formData.fullName.trim()    } : {}),
        ...(formData.email?.trim()       ? { email:       formData.email.trim()       } : {}),
        ...(formData.specialtyId         ? { specialtyId: formData.specialtyId        } : {}),
        // Status: lo enviamos siempre que esté presente en el formulario
        // El backend lo ignorará hasta que esté en el DTO
        ...(formData.status              ? { status:      formData.status             } : {}),
      });

      await fetchDoctors();
      return { success: true };

    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message ?? 'Error al actualizar el doctor',
      };
    }
  };


  return {
    doctors,
    loading,
    error,
    totalPages,
    totalElements,
    currentPage,
    setCurrentPage,
    addDoctor,
    editDoctor,
    refetch: fetchDoctors,
  };
}