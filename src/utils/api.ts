import axios from 'axios';

// Configuration de base pour axios
const api = axios.create({
  baseURL: 'http://24.144.87.127:3333',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    
    // Si pas de token et que ce n'est pas une requête de login, rediriger
    if (!token || token.trim() === '') {
      const isLoginRequest = config.url?.includes('/login');
      if (!isLoginRequest) {
        console.error('❌ AUCUN TOKEN - Redirection vers /login');
        window.location.href = '/login';
        return Promise.reject(new Error('No token found'));
      }
    }
    
    if (token && token.trim() !== '') {
      // S'assurer que les headers sont bien définis
      if (!config.headers) {
        config.headers = {} as any;
      }
      
      // Ajouter le token dans le header Authorization au format: 'Bearer ' + token
      config.headers['Authorization'] = 'Bearer ' + token.trim();
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token invalide ou expiré - ne pas rediriger automatiquement
      // Laisser les composants gérer la redirection
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        localStorage.removeItem('authToken');
      }
    }
    return Promise.reject(error);
  }
);

export default api;

