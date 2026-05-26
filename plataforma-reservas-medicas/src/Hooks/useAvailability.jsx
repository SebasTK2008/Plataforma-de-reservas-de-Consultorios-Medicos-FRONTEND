// useAvailability.js
//
// Hook que gestiona el estado completo de la página de disponibilidad.
//
// FLUJO DE DATOS:
//   1. Al montar: carga especialidades, doctores y tipos de cita en paralelo
//      (datos estáticos que no cambian con los filtros del usuario)
//   2. Al buscar: llama al endpoint correcto según si hay tipo de cita o no:
//      - Con tipo de cita → getAvailableSlotsForType (filtra por duración)
//      - Sin tipo de cita → getAvailableSlots (muestra todos los huecos)
//
// SEPARACIÓN DE RESPONSABILIDADES:
//   - Este hook maneja ESTADO y LÓGICA de negocio
//   - AvailabilityPage maneja solo PRESENTACIÓN
//   - availabilityApi maneja solo HTTP

import { useState, useEffect, useCallback } from 'react';
import { getAvailableSlots, getAvailableSlotsForType } from '../api/availabilityApi';
import { getAppointmentTypes } from '../api/appointmentTypesApi';
import api from '../api/AxiosConfig';

export function useAvailability() {

  // ── Datos estáticos (se cargan una sola vez al montar) ───
  const [specialties,       setSpecialties]       = useState([]);
  const [allDoctors,        setAllDoctors]         = useState([]);   // todos, sin filtrar
  const [appointmentTypes,  setAppointmentTypes]  = useState([]);
  const [loadingStatics,    setLoadingStatics]    = useState(true);
  const [staticsError,      setStaticsError]      = useState(null);

  // ── Filtros del usuario ──────────────────────────────────
  const [selectedSpecialty,  setSelectedSpecialty]  = useState('');   // ID de especialidad
  const [selectedDoctor,     setSelectedDoctor]     = useState('');   // ID de doctor
  const [selectedType,       setSelectedType]       = useState('');   // ID de tipo de cita
  const [selectedDate,       setSelectedDate]       = useState('');   // YYYY-MM-DD

  // ── Resultados de disponibilidad ─────────────────────────
  const [slots,      setSlots]      = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [searched,   setSearched]   = useState(false); // ¿se hizo alguna búsqueda?

  // ── Doctors filtrados por especialidad seleccionada ──────
  // Derivado de allDoctors + selectedSpecialty.
  // No requiere llamada al backend — filtramos localmente.
  const filteredDoctors = selectedSpecialty
    ? allDoctors.filter(d => d.specialty?.id === selectedSpecialty)
    : allDoctors;

  // ── Información del tipo de cita seleccionado ────────────
  // Para mostrar la duración en la UI
  const selectedTypeInfo = appointmentTypes.find(t => t.id === selectedType) ?? null;


  // ── Carga inicial de datos estáticos ────────────────────
  useEffect(() => {
    const loadStatics = async () => {
      setLoadingStatics(true);
      setStaticsError(null);
      try {
        const [specialtiesRes, doctorsRes, typesRes] = await Promise.all([
          api.get('/api/specialties').then(r => r.data),
          api.get('/api/doctors', { params: { page: 0, size: 200 } }).then(r => r.data),
          getAppointmentTypes(),
        ]);
        setSpecialties(specialtiesRes ?? []);
        setAllDoctors(doctorsRes.content ?? []);
        setAppointmentTypes(typesRes ?? []);
      } catch (err) {
        setStaticsError(
          err.response?.data?.message ??
          err.message ??
          'Error al cargar los datos del formulario.'
        );
      } finally {
        setLoadingStatics(false);
      }
    };
    loadStatics();
  }, []);


  // ── Buscar disponibilidad ────────────────────────────────
  // Se llama cuando el usuario hace clic en "Buscar".
  // Valida que doctor y fecha estén seleccionados.
  const search = useCallback(async () => {
    if (!selectedDoctor || !selectedDate) return;

    setLoading(true);
    setError(null);
    setSearched(false);
    setSlots([]);

    try {
      let data;

      if (selectedType) {
        // Con tipo de cita: el backend filtra slots que tengan
        // espacio suficiente para la duración del tipo
        data = await getAvailableSlotsForType(selectedDoctor, selectedType, selectedDate);
      } else {
        // Sin tipo de cita: devuelve todos los huecos libres
        data = await getAvailableSlots(selectedDoctor, selectedDate);
      }

      setSlots(data ?? []);
      setSearched(true);

    } catch (err) {
      // 404 → el doctor no tiene horarios configurados para ese día
      if (err.response?.status === 404) {
        setError('Este doctor no tiene horarios de atención configurados para ese día.');
      } else {
        setError(
          err.response?.data?.message ??
          err.message ??
          'Error al consultar la disponibilidad. Intenta de nuevo.'
        );
      }
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, [selectedDoctor, selectedType, selectedDate]);


  // ── Limpiar resultados si cambian los filtros ────────────
  // Cuando el usuario cambia de doctor, fecha o tipo de cita,
  // los resultados anteriores ya no son válidos.
  const resetResults = useCallback(() => {
    setSlots([]);
    setSearched(false);
    setError(null);
  }, []);

  // Al cambiar especialidad, también resetear doctor
  const handleSpecialtyChange = (value) => {
    setSelectedSpecialty(value);
    setSelectedDoctor('');
    resetResults();
  };

  const handleDoctorChange = (value) => {
    setSelectedDoctor(value);
    resetResults();
  };

  const handleTypeChange = (value) => {
    setSelectedType(value);
    resetResults();
  };

  const handleDateChange = (value) => {
    setSelectedDate(value);
    resetResults();
  };


  // ── Helper: formato "HH:mm:ss" → "HH:mm" ────────────────
  const fmt = (t) => (t ? String(t).substring(0, 5) : '—');

  // ── Información del doctor seleccionado ─────────────────
  const selectedDoctorInfo = allDoctors.find(d => d.id === selectedDoctor) ?? null;


  return {
    // Datos estáticos
    specialties,
    filteredDoctors,
    appointmentTypes,
    loadingStatics,
    staticsError,

    // Filtros
    selectedSpecialty,
    selectedDoctor,
    selectedType,
    selectedDate,

    // Acciones de filtro
    handleSpecialtyChange,
    handleDoctorChange,
    handleTypeChange,
    handleDateChange,

    // Resultados
    slots,
    loading,
    error,
    searched,

    // Acciones
    search,

    // Info derivada
    selectedDoctorInfo,
    selectedTypeInfo,
    fmt,
  };
}