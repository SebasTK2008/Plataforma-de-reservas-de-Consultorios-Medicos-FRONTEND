// useAppointments.jsx
// Hook para gestionar citas médicas.
//
// CAMBIOS:
// 1. Los filtros ahora incluyen: status, doctorId, startDate, endDate
// 2. Al hacer fetch, convertimos startDate/endDate (formato "YYYY-MM-DD")
//    a startAt/endAt (formato "YYYY-MM-DDThh:mm") que espera el backend.
//    - startDate "2026-06-01" → startAt "2026-06-01T00:00"
//    - endDate   "2026-06-01" → endAt   "2026-06-01T23:59"

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

  // ── Filtros expandidos ────────────────────────────────────
  // ANTES: { status: '' }
  // AHORA: también doctorId, startDate, endDate
  //
  // Usamos "startDate" y "endDate" (tipo date input, formato YYYY-MM-DD)
  // en lugar de "startAt"/"endAt" (LocalDateTime) para que el filtro
  // sea más natural desde el UI de fecha.
  const [filters, setFilters] = useState({
    status:    '',
    doctorId:  '',
    startDate: '',
    endDate:   '',
  });

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Transformamos los filtros de fecha antes de enviarlos al API.
      // El backend espera LocalDateTime en formato "yyyy-MM-dd'T'HH:mm"
      const apiFilters = {
        status:   filters.status   || undefined,
        doctorId: filters.doctorId || undefined,
        // Convertimos fechas: "2026-06-01" → "2026-06-01T00:00"
        startAt:  filters.startDate ? `${filters.startDate}T00:00` : undefined,
        endAt:    filters.endDate   ? `${filters.endDate}T23:59`   : undefined,
      };

      const data = await getAppointments(apiFilters, currentPage, 10);
      setAppointments(data.content        ?? []);
      setTotalPages(data.totalPages       ?? 0);
      setTotalElements(data.totalElements ?? 0);

    } catch (err) {
      setError(
        err.response?.data?.message ??
        err.message ??
        'Error al cargar las citas'
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // Actualizar filtros siempre reinicia a página 0
  // para no quedarse en una página que ya no existe
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
      return {
        success: false,
        error: err.response?.data?.message ?? 'Error al crear la cita',
      };
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