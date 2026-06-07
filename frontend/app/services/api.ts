import axios from 'axios';
import { setupCache } from 'axios-cache-interceptor';

// Cria uma instância do Axios apontando para o seu Backend
// Usa variável de ambiente no Vercel, ou fallback para localhost rodando localmente
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api', 
  timeout: 30000, // Dá 30 segundos para a API responder antes de dar erro
});

// Envelopa o Axios com interceptor de cache (TTL de 5 minutos na memória RAM)
const api = setupCache(axiosInstance, {
  ttl: 1000 * 60 * 5, // 5 minutos
  methods: ['get'] // Apenas cacheia requisições GET
});

export default api;