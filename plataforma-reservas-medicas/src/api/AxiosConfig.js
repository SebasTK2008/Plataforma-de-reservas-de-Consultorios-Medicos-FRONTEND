// axiosConfig.js
// Aquí configuramos axios una sola vez para toda la app.
// Piénsalo como la "sede central" de todas las peticiones HTTP.

import axios from 'axios';

// ─────────────────────────────────────────
// INSTANCIA BASE
// ─────────────────────────────────────────

// Creamos una instancia personalizada de axios
// con configuración que se aplica a TODAS las peticiones
const api = axios.create({

  // La URL base de tu backend
  // Todas las peticiones se harán a esta dirección + la ruta específica
  // Ejemplo: api.get('/patients') → http://localhost:8080/api/patients
  baseURL: 'http://localhost:8080',

  // Tiempo máximo de espera: 10 segundos
  // Si el backend no responde en ese tiempo, axios lanza un error
  timeout: 10000,

  // Le decimos al backend que enviamos y esperamos JSON
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─────────────────────────────────────────
// INTERCEPTOR DE PETICIONES (Request)
// ─────────────────────────────────────────

// Un interceptor es una función que se ejecuta ANTES de que
// la petición salga hacia el backend.
// Lo usamos para agregar automáticamente el token JWT
// a cada petición que hagamos.

api.interceptors.request.use(
  // Esta función se ejecuta con cada petición exitosa
  (config) => {
    // Leemos el token guardado en localStorage
    const token = localStorage.getItem('umars_token');

    // Si hay token, lo agregamos al header Authorization
    // El backend lo espera en este formato: "Bearer eyJhbGci..."
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config; // Devolvemos la config modificada
  },

  // Esta función se ejecuta si hay un error configurando la petición
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────────
// INTERCEPTOR DE RESPUESTAS (Response)
// ─────────────────────────────────────────

// Este interceptor se ejecuta DESPUÉS de que el backend responde.
// Lo usamos para manejar errores globales.

api.interceptors.response.use(
  // Si la respuesta fue exitosa (código 2xx), la dejamos pasar
  (response) => response,

  // Si hubo un error, lo manejamos aquí
  (error) => {
    // Error 401 = No autorizado (token vencido o inválido)
    if (error.response?.status === 401) {
      // Borramos el token inválido
      localStorage.removeItem('umars_token');
      // Redirigimos al login
      // Usamos window.location porque aquí no tenemos acceso
      // a los hooks de React Router
      window.location.href = '/login';
    }

    // Dejamos que el error siga propagándose
    // para que cada componente pueda manejarlo también
    return Promise.reject(error);
  }
);

export default api;