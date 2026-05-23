import { useState, useEffect, useCallback } from 'react';
import { getSpecialties, createSpecialty } from '../api/specialtiesApi';

export function useSpecialties() {

  // ── Datos (sin paginación — el backend devuelve lista completa) ──
  const [specialties, setSpecialties] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  // ── Carga de datos ────────────────────────────────────────
  const fetchSpecialties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // El backend devuelve List<SpecialtySummaryResponse> directamente (no Page)
      const data = await getSpecialties();
      setSpecialties(data ?? []);

    } catch (err) {
      setError(
        err.response?.data?.message ??
        err.message ??
        'Error al cargar las especialidades'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSpecialties();
  }, [fetchSpecialties]);


  // ── Crear especialidad ────────────────────────────────────
  const addSpecialty = async (formData) => {
    try {
      await createSpecialty({
        name:        formData.name.trim(),
        description: formData.description?.trim() || undefined,
      });
      await fetchSpecialties();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message ?? 'Error al crear la especialidad',
      };
    }
  };


  return {
    specialties,
    loading,
    error,
    addSpecialty,
    refetch: fetchSpecialties,
  };
}