// authApi.js
// Todas las llamadas HTTP relacionadas con autenticación
// van aquí centralizadas.
import api from './axiosConfig';

// ─────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────

// Llama a POST /api/auth/login
// Recibe: { documentNumber, password }
// Devuelve: { accessToken, tokenType, expiresInSeconds }
export async function loginRequest(credentials) {
  // api.post() envía una petición POST con los datos en el body
  const response = await api.post('/api/auth/login', credentials);
  // response.data contiene el cuerpo de la respuesta del backend
  return response.data;
}

