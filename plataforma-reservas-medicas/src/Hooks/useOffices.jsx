// useOffices.jsx
// Hook para gestionar consultorios.
//
// CAMBIO PRINCIPAL: editOffice ya NO envía status al backend.
//
// ¿Por qué? El backend lanza 400 si el DTO (OfficeUpdateRequest) no tiene
// el campo "status" y Spring Boot está configurado para rechazar campos
// desconocidos (DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES = true,
// que es el default en Spring Boot con Jackson).
//
// CUÁNDO AGREGAR STATUS:
// 1. Agrega "private OfficeStatus status;" a tu OfficeUpdateRequest.java
// 2. Agrega el setter/getter o usa @Data con Lombok.
// 3. Cambia la línea "includeStatus = false" a "includeStatus = true"
//    en la llamada a updateOffice de abajo.
// 4. Descomenta el campo status en el payload de editOffice.
//
// NOTA ADICIONAL: extractErrorMessage importada desde officesApi
// garantiza que el error del backend siempre se muestre en español legible,
// sin importar en qué estructura lo devuelva Spring Boot.

import { useState, useEffect, useCallback } from 'react';
import { getOffices, createOffice, updateOffice, extractErrorMessage } from '../api/officesApi';

export function useOffices() {

  const [offices,  setOffices]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  // useCallback evita recrear fetchOffices en cada render.
  // Como no depende de ningún estado externo (no tiene paginación),
  // el array de dependencias está vacío: solo se crea una vez.
  const fetchOffices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOffices();
      setOffices(data ?? []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Error al cargar los consultorios'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffices();
  }, [fetchOffices]);


  // ── Crear consultorio ─────────────────────────────────────
  // Solo enviamos los campos que el backend espera en OfficeCreateRequest.
  // roomNumber se convierte a número porque el input HTML devuelve string.
  const addOffice = async (formData) => {
    try {
      await createOffice({
        name:        formData.name.trim(),
        location:    formData.location.trim(),
        // || undefined: si el campo está vacío, no lo enviamos (es opcional)
        description: formData.description?.trim() || undefined,
        roomNumber:  Number(formData.roomNumber),
      });
      await fetchOffices(); // Refresca la lista después de crear
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: extractErrorMessage(err, 'Error al crear el consultorio'),
      };
    }
  };


  // ── Editar consultorio ────────────────────────────────────
  // NOTA SOBRE STATUS:
  // Por ahora NO enviamos status porque puede causar error 400 en el backend.
  // El selector de estado en el modal queda "visual" hasta que actualices
  // el DTO del backend. Ver comentario al inicio del archivo para instrucciones.
  const editOffice = async (id, formData) => {
    try {
      await updateOffice(id, {
        // || undefined: omite campos vacíos para no sobrescribir con strings vacíos
        name:        formData.name?.trim()        || undefined,
        location:    formData.location?.trim()    || undefined,
        description: formData.description?.trim() || undefined,
        // roomNumber: convertimos a número, o undefined si está vacío
        roomNumber:  formData.roomNumber ? Number(formData.roomNumber) : undefined,
        // status: lo incluimos en el objeto pero updateOffice lo filtrará
        // según el parámetro includeStatus (false por defecto).
        status:      formData.status || undefined,
      },
      // Cambia a "true" cuando hayas actualizado OfficeUpdateRequest.java
      false /* includeStatus */
      );

      await fetchOffices();
      return { success: true };

    } catch (err) {
      return {
        success: false,
        error: extractErrorMessage(err, 'Error al actualizar el consultorio'),
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