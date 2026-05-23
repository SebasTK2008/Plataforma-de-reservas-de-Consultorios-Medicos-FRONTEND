// usePatients.js
// Hook personalizado que maneja todo el estado relacionado con pacientes.
// Cualquier componente que necesite datos de pacientes usa este hook.

import { useState, useEffect, useCallback } from 'react';
import { getPatients, createPatient, updatePatient } from '../api/patientsApi';


// ────────────────────────────────────────────────
// ANATOMÍA DE UN CUSTOM HOOK:
//
// 1. El nombre SIEMPRE empieza con "use" (regla de React)
// 2. Puede usar otros hooks de React (useState, useEffect, etc.)
// 3. Devuelve datos y funciones que el componente necesita
// 4. Se comporta como cualquier función de JavaScript
// ────────────────────────────────────────────────

export function usePatients() {

  // ── Estado interno del hook ──────────────────────────
  const [patients, setPatients] = useState([]);     // Lista de pacientes
  const [loading, setLoading] = useState(true);     // ¿Estamos cargando?
  const [error, setError] = useState(null);         // Mensaje de error o null
  const [totalPages, setTotalPages] = useState(0);  // Total de páginas (para paginación)
  const [totalElements, setTotalElements] = useState(0); // Total de registros
  const [currentPage, setCurrentPage] = useState(0);    // Página actual
  const [searchQuery, setSearchQuery] = useState('');   // Texto de búsqueda


  // ── Función para cargar pacientes ──────────────────────
  // useCallback memoriza la función para que no se recree en cada render.
  // Sin useCallback, React crearía una función nueva cada vez que el
  // componente se renderice, causando renders infinitos en useEffect.
  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);  // Activamos el indicador de carga
      setError(null);    // Limpiamos errores anteriores

      const data = await getPatients(currentPage, 10);

      // Spring Boot Page devuelve esta estructura:
      // {
      //   content: [...pacientes],
      //   totalPages: 3,
      //   totalElements: 28,
      //   number: 0,        ← página actual
      //   size: 10,         ← tamaño de página
      //   first: true,      ← ¿es la primera página?
      //   last: false       ← ¿es la última página?
      // }
      setPatients(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);

    } catch (err) {
      // err.response existe si el backend respondió con un código de error
      // err.message siempre existe (es el mensaje del error de JavaScript)
      const message = err.response?.data?.message || err.message || 'Error al cargar pacientes';
      setError(message);
    } finally {
      // finally se ejecuta SIEMPRE, tanto si hubo error como si no
      setLoading(false);
    }
  }, [currentPage]); // ← Este hook se recrea cuando currentPage cambia


  // ── Efecto: cargar pacientes cuando cambia la página ──
  // useEffect ejecuta código cuando el componente "monta" o cuando
  // cambian las dependencias listadas en el array final.
  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]); // ← Se ejecuta cuando fetchPatients cambia


  // ── Crear paciente ────────────────────────────────────
  const addPatient = async (patientData) => {
    try {
      // No necesitamos setLoading aquí porque es una acción puntual
      // (el modal tendrá su propio estado de loading)
      const newPatient = await createPatient(patientData);
      // Recargamos la lista para ver el nuevo paciente
      await fetchPatients();
      return { success: true, data: newPatient };
    } catch (err) {
      const message = err.response?.data?.message || 'Error al crear paciente';
      return { success: false, error: message };
    }
  };


  // ── Actualizar paciente ───────────────────────────────
  const editPatient = async (id, patientData) => {
    try {
      const updated = await updatePatient(id, patientData);
      await fetchPatients(); // Recargamos la lista
      return { success: true, data: updated };
    } catch (err) {
      const message = err.response?.data?.message || 'Error al actualizar paciente';
      return { success: false, error: message };
    }
  };


  // ── Lo que devolvemos al componente ───────────────────
  // Todo lo que un componente podría necesitar está aquí
  return {
    patients,         // Array con los pacientes de la página actual
    loading,          // Boolean: true mientras carga
    error,            // String con el error, o null
    totalPages,       // Para los botones de paginación
    totalElements,    // Para mostrar "Mostrando X de Y pacientes"
    currentPage,      // Página actual (0-based)
    setCurrentPage,   // Función para cambiar de página
    searchQuery,      // Texto de búsqueda actual
    setSearchQuery,   // Función para cambiar el texto de búsqueda
    addPatient,       // Función para crear
    editPatient,      // Función para editar
    refetch: fetchPatients  // Por si el componente quiere recargar manualmente
  };
}