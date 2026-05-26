// useReports.js
// Hook personalizado que gestiona los tres tipos de reportes.
//
// DISEÑO DEL HOOK:
//
// Cada reporte tiene su propio estado independiente (data, loading, error)
// porque se pueden cargar de forma independiente. El usuario puede:
//   - Cargar productividad de doctores sin elegir fechas
//   - Cargar ocupación de consultorios con un rango distinto al de no-shows
//
// La función fetchAll() carga los tres a la vez cuando el usuario hace clic
// en "Generar Reporte" desde la página.
//
// ¿Por qué no un solo estado { loading, error, data }?
// Porque si doctor-productivity falla, el usuario igual puede ver
// los otros reportes. Estados separados = granularidad de errores.

import { useState, useCallback } from 'react';
import {
  getOfficeOccupancy,
  getDoctorProductivity,
  getNoShowPatients,
} from '../api/reportsApi';

export function useReports() {

  // ── Estado: ocupación de consultorios ────────────────────
  const [occupancy,        setOccupancy]        = useState([]);
  const [occupancyLoading, setOccupancyLoading] = useState(false);
  const [occupancyError,   setOccupancyError]   = useState(null);

  // ── Estado: productividad de doctores ────────────────────
  const [productivity,        setProductivity]        = useState([]);
  const [productivityLoading, setProductivityLoading] = useState(false);
  const [productivityError,   setProductivityError]   = useState(null);

  // ── Estado: pacientes no-show ────────────────────────────
  const [noShows,        setNoShows]        = useState([]);
  const [noShowsLoading, setNoShowsLoading] = useState(false);
  const [noShowsError,   setNoShowsError]   = useState(null);

  // ── Fetch ocupación ──────────────────────────────────────
  const fetchOccupancy = useCallback(async (from, to) => {
    setOccupancyLoading(true);
    setOccupancyError(null);
    try {
      const data = await getOfficeOccupancy(from, to);
      setOccupancy(data ?? []);
    } catch (err) {
      setOccupancyError(
        err.response?.data?.message ??
        err.message ??
        'Error al cargar la ocupación de consultorios'
      );
    } finally {
      setOccupancyLoading(false);
    }
  }, []);

  // ── Fetch productividad ──────────────────────────────────
  const fetchProductivity = useCallback(async () => {
    setProductivityLoading(true);
    setProductivityError(null);
    try {
      const data = await getDoctorProductivity();
      setProductivity(data ?? []);
    } catch (err) {
      setProductivityError(
        err.response?.data?.message ??
        err.message ??
        'Error al cargar la productividad de doctores'
      );
    } finally {
      setProductivityLoading(false);
    }
  }, []);

  // ── Fetch no-shows ───────────────────────────────────────
  const fetchNoShows = useCallback(async (from, to) => {
    setNoShowsLoading(true);
    setNoShowsError(null);
    try {
      const data = await getNoShowPatients(from, to);
      setNoShows(data ?? []);
    } catch (err) {
      setNoShowsError(
        err.response?.data?.message ??
        err.message ??
        'Error al cargar los pacientes con inasistencias'
      );
    } finally {
      setNoShowsLoading(false);
    }
  }, []);

  // ── Fetch todo de una vez ────────────────────────────────
  // Lanza los tres en paralelo con Promise.allSettled.
  // ¿Por qué allSettled y no all?
  // Promise.all aborta en cuanto UNO falla. Con allSettled, si
  // doctor-productivity falla, el usuario igual ve los otros dos reportes.
  const fetchAll = useCallback(async (from, to) => {
    await Promise.allSettled([
      fetchOccupancy(from, to),
      fetchProductivity(),
      fetchNoShows(from, to),
    ]);
  }, [fetchOccupancy, fetchProductivity, fetchNoShows]);

  return {
    // Ocupación
    occupancy,
    occupancyLoading,
    occupancyError,

    // Productividad
    productivity,
    productivityLoading,
    productivityError,

    // No-shows
    noShows,
    noShowsLoading,
    noShowsError,

    // Acciones
    fetchAll,
    fetchOccupancy,
    fetchProductivity,
    fetchNoShows,
  };
}