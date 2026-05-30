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
        error: extractErrorMessage(err, 'Error al crear el consultorio'),
      };
    }
  };

  const editOffice = async (id, formData) => {
    try {
      // OfficeUpdateRequest.java incluye status (ver OfficeDtos.java).
      // includeStatus=true habilita el envío del campo al backend.
      await updateOffice(id, {
        name:        formData.name?.trim()        || undefined,
        location:    formData.location?.trim()    || undefined,
        description: formData.description?.trim() || undefined,
        roomNumber:  formData.roomNumber ? Number(formData.roomNumber) : undefined,
        status:      formData.status              || undefined,
      },
      true /* includeStatus — OfficeUpdateRequest ya tiene el campo */
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