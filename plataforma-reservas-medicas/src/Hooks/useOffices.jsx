import { useState, useEffect, useCallback } from 'react';
import { getOffices, createOffice, updateOffice } from '../api/officesApi';

export function useOffices() {

  // Sin paginación del backend — cargamos la lista completa
  const [offices,  setOffices]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetchOffices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOffices();   // Retorna List directamente
      setOffices(data ?? []);
    } catch (err) {
      setError(
        err.response?.data?.message ??
        err.message ??
        'Error al cargar los consultorios'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffices();
  }, [fetchOffices]);


  // ── Crear consultorio ─────────────────────────────────────
  const addOffice = async (formData) => {
    try {
      await createOffice({
        name:        formData.name.trim(),
        location:    formData.location.trim(),
        description: formData.description?.trim() || undefined,
        roomNumber:  Number(formData.roomNumber),
      });
      await fetchOffices();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message ?? 'Error al crear el consultorio',
      };
    }
  };


  // ── Editar consultorio ────────────────────────────────────
  // Campos editables: name, location, description, roomNumber
  // El status no tiene endpoint propio en el controlador actual.
  const editOffice = async (id, formData) => {
    try {
      await updateOffice(id, {
        name:        formData.name?.trim()        || undefined,
        location:    formData.location?.trim()    || undefined,
        description: formData.description?.trim() || undefined,
        roomNumber:  formData.roomNumber ? Number(formData.roomNumber) : undefined,
      });
      await fetchOffices();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message ?? 'Error al actualizar el consultorio',
      };
    }
  };


  return {
    offices,
    loading,
    error,
    addOffice,
    editOffice,
    refetch: fetchOffices,
  };
}