import axios from 'axios';

const api = axios.create({

  // ANTES: 'http://localhost:8080'
  // AHORA: cadena vacía — las peticiones van al mismo origen
  // Vite proxy se encarga de redirigirlas al backend
  baseURL: '',

  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Los interceptores se quedan exactamente igual
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('umars_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('umars_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;