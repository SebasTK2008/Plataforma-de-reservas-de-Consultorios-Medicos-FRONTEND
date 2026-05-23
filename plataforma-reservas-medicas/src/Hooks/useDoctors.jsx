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
  const addDoctor = async (formData) => {
    try {
      await createDoctor({
        fullName:       formData.fullName.trim(),
        email:          formData.email.trim(),
        licenseNumber:  formData.licenseNumber.trim(),
        documentNumber: formData.documentNumber.trim(),
        specialtyId:    formData.specialtyId,
      });
      await fetchDoctors();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message ?? 'Error al crear el doctor',
      };
    }
  };


  // ── Editar doctor ─────────────────────────────────────────
  // Campos editables: fullName, email, specialtyId
  const editDoctor = async (id, formData) => {
    try {
      await updateDoctor(id, {
        fullName:    formData.fullName?.trim()    || undefined,
        email:       formData.email?.trim()       || undefined,
        specialtyId: formData.specialtyId         || undefined,
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