import axios from 'axios';

// Cria uma instância do Axios apontando para o seu Backend FastAPI
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api', 
  timeout: 30000, // Dá 10 segundos para a API responder antes de dar erro
});

export default api;