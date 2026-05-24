import { useState, useEffect } from 'react';
import { getAppointmentTypes, createAppointmentType } from '../api/appointmentTypesApi';

export function useAppointmentTypes() {

  const [appointmentTypes, setAppointmentTypes] = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);

  const fetchTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAppointmentTypes();
      // El backend retorna un Array directo, no un Page
      setAppointmentTypes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.message ??
        err.message ??
        'Error al cargar los tipos de cita'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTypes(); }, []);

  const addAppointmentType = async (formData) => {
    try {
      await createAppointmentType({
        name:            formData.name.trim(),
        description:     formData.description?.trim() || null,
        durationMinutes: Number(formData.durationMinutes),
      });
      await fetchTypes();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message ?? 'Error al crear el tipo de cita',
      };
    }
  };

  return {
    appointmentTypes,
    loading,
    error,
    addAppointmentType,
    refetch: fetchTypes,
  };
}