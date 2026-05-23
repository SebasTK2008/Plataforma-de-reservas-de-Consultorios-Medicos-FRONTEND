import { useState, useEffect, useCallback } from 'react';
import { getPatients, createPatient, updatePatient } from '../api/patientsApi';

export function usePatients() {

  // ── Datos ────────────────────────────────────────────────
  const [patients,       setPatients]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);

  // ── Paginación ───────────────────────────────────────────
  const [totalPages,     setTotalPages]     = useState(0);
  const [totalElements,  setTotalElements]  = useState(0);
  const [currentPage,    setCurrentPage]    = useState(0);

  // ── Carga de datos ───────────────────────────────────────
  // useCallback evita que se recree la función en cada render.
  // Solo se recrea cuando cambia currentPage.
  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getPatients(currentPage, 10);

      setPatients(data.content       ?? []);
      setTotalPages(data.totalPages  ?? 0);
      setTotalElements(data.totalElements ?? 0);

    } catch (err) {
      // err.response?.data?.message → mensaje del GlobalExceptionHandler del backend
      // err.message                 → error genérico de red o JavaScript
      setError(
        err.response?.data?.message ??
        err.message ??
        'Error al cargar los pacientes'
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  // Se ejecuta al montar y cada vez que currentPage cambia
  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);


  // ── Crear paciente ────────────────────────────────────────
  const addPatient = async (formData) => {
    try {
      await createPatient({
        fullName:       formData.fullName.trim(),
        email:          formData.email.trim(),
        phoneNumber:    formData.phoneNumber.trim(),
        documentNumber: formData.documentNumber.trim(),
        // studentCode es opcional: solo lo enviamos si tiene valor
        ...(formData.studentCode?.trim()
          ? { studentCode: formData.studentCode.trim() }
          : {}),
      });
      await fetchPatients();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message ?? 'Error al crear el paciente',
      };
    }
  };


  // ── Editar paciente (incluye cambio de estado) ────────────
  const editPatient = async (id, formData) => {
    try {
      await updatePatient(id, {
        fullName:    formData.fullName?.trim()    || undefined,
        email:       formData.email?.trim()       || undefined,
        phoneNumber: formData.phoneNumber?.trim() || undefined,
        status:      formData.status              || undefined,
      });
      await fetchPatients();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message ?? 'Error al actualizar el paciente',
      };
    }
  };


  return {
    patients,
    loading,
    error,
    totalPages,
    totalElements,
    currentPage,
    setCurrentPage,
    addPatient,
    editPatient,
    refetch: fetchPatients,
  };
}