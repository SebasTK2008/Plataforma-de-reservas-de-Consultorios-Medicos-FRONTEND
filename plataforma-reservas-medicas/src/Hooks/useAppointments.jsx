import { useState, useEffect, useCallback } from 'react';
import {
  getAppointments, createAppointment,
  confirmAppointment, cancelAppointment,
  completeAppointment, markNoShow,
} from '../api/appointmentsApi';

export function useAppointments() {

  const [appointments,   setAppointments]   = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [totalPages,     setTotalPages]     = useState(0);
  const [totalElements,  setTotalElements]  = useState(0);
  const [currentPage,    setCurrentPage]    = useState(0);

  // filters guarda los criterios actuales de búsqueda.
  // Cuando cambia, resetea a la página 0 automáticamente.
  const [filters, setFilters] = useState({ status: '' });

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAppointments(filters, currentPage, 10);
      setAppointments(data.content     ?? []);
      setTotalPages(data.totalPages    ?? 0);
      setTotalElements(data.totalElements ?? 0);
    } catch (err) {
      setError(err.response?.data?.message ?? err.message ?? 'Error al cargar las citas');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // Actualizar filtros siempre reinicia a página 0
  const updateFilters = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(0);
  };

  // ── Acciones de ciclo de vida ──────────────────────────
  const doCreate = async (data) => {
    try {
      await createAppointment(data);
      await fetchAppointments();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message ?? 'Error al crear la cita' };
    }
  };

  const doConfirm = async (id) => {
    try {
      await confirmAppointment(id);
      await fetchAppointments();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message ?? 'Error al confirmar' };
    }
  };

  const doCancel = async (id, reason) => {
    try {
      await cancelAppointment(id, reason);
      await fetchAppointments();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message ?? 'Error al cancelar' };
    }
  };

  const doComplete = async (id, observations) => {
    try {
      await completeAppointment(id, observations);
      await fetchAppointments();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message ?? 'Error al completar' };
    }
  };

  const doNoShow = async (id) => {
    try {
      await markNoShow(id);
      await fetchAppointments();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message ?? 'Error al registrar inasistencia' };
    }
  };

  return {
    appointments, loading, error,
    totalPages, totalElements,
    currentPage, setCurrentPage,
    filters, updateFilters,
    doCreate, doConfirm, doCancel, doComplete, doNoShow,
    refetch: fetchAppointments,
  };
}