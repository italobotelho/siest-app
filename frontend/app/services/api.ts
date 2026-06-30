import axios from 'axios';
import { setupCache } from 'axios-cache-interceptor';

// Cria uma instância do Axios apontando para o seu Backend
// Usa variável de ambiente no Vercel, ou fallback para localhost rodando localmente
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api', 
  timeout: 30000, // Dá 30 segundos para a API responder antes de dar erro
});

// Adicionando um interceptor de retry para tentar novamente requisições falhas por timeout (cold-start)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config) return Promise.reject(error);
    
    // Tentar novamente apenas para erros de rede (status null) ou erros do servidor (5xx)
    const status = error.response ? error.response.status : null;
    if (!status || status >= 500) {
      config.retryCount = config.retryCount || 0;
      if (config.retryCount < 3) { // Tenta até 3 vezes
        config.retryCount += 1;
        // Espera um tempo progressivo antes de tentar novamente (1s, 2s, 3s)
        await new Promise(resolve => setTimeout(resolve, 1000 * config.retryCount));
        return axiosInstance(config);
      }
    }
    return Promise.reject(error);
  }
);

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