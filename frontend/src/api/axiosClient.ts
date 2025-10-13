// frontend/src/api/axiosClient.ts

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json; charset=UTF-8',
    'Accept': 'application/json',
  },
  // Asegurar que axios use UTF-8 para todas las peticiones
  transformRequest: [
    (data, headers) => {
      // Si es un string, asegurarse de que esté en UTF-8
      if (typeof data === 'string') {
        return data;
      }
      // Si es un objeto, stringify con soporte UTF-8
      if (data && typeof data === 'object' && !(data instanceof FormData) && !(data instanceof URLSearchParams)) {
        return JSON.stringify(data);
      }
      return data;
    }
  ],
});

// Interceptor para inyectar el token JWT en cada petición
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosClient;