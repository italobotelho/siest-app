import axios from 'axios';
import { setupCache } from 'axios-cache-interceptor';

// Cria uma instância do Axios apontando para o seu Backend
// Usa variável de ambiente no Vercel, ou fallback para localhost rodando localmente
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api', 
  timeout: 30000, // Dá 30 segundos para a API responder antes de dar erro
});

const api = setupCache(axiosInstance, {
  ttl: 1000 * 60 * 5, // 5 minutos
  methods: ['get'] // Apenas cacheia requisições GET
});

let activeRequests = 0;

api.interceptors.request.use((config) => {
  activeRequests++;
  if (activeRequests === 1 && typeof window !== 'undefined') {
    window.dispatchEvent(new Event('dashboard-loading-start'));
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    activeRequests--;
    if (activeRequests <= 0 && typeof window !== 'undefined') {
      activeRequests = 0;
      window.dispatchEvent(new Event('dashboard-loading-stop'));
    }
    return response;
  },
  (error) => {
    activeRequests--;
    if (activeRequests <= 0 && typeof window !== 'undefined') {
      activeRequests = 0;
      window.dispatchEvent(new Event('dashboard-loading-stop'));
    }
    return Promise.reject(error);
  }
);

export default api;