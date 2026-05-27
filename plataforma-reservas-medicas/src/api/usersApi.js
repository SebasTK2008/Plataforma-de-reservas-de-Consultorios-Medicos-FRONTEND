// usersApi.js
//
// CAPA DE DATOS — Users
// Responsabilidad única: encapsular las llamadas HTTP al backend.
// No conoce React, no maneja estado, no lanza side-effects.
//
// Exporta:
//   registerUser(payload) → Promise<void>

import api from '../api/AxiosConfig';

/**
 * Crea un nuevo usuario del sistema.
 *
 * @param {{ documentNumber: string, password: string, roles: string[] }} payload
 * @returns {Promise<void>} Resuelve sin valor si la creación fue exitosa.
 * @throws {import('axios').AxiosError} Propaga el error para que la capa superior lo interprete.
 */
export async function registerUser(payload) {
  // POST /api/auth/register está en .permitAll() pero solo ADMIN llega a esta página.
  // El backend espera roles como array de strings: ["ROLE_ADMIN"]
  await api.post('/api/auth/register', payload);
}