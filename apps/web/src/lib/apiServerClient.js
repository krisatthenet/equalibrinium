import pb from './pocketbaseClient.js';

// In production builds, hardcode the Railway API URL so no misconfigured build env var can override it.
// In dev, use VITE_API_URL override (e.g. pointing to a local API server).
const API_SERVER_URL = import.meta.env.PROD
  ? 'https://workbee-api-zfq-production.up.railway.app'
  : (import.meta.env.VITE_API_URL || 'http://localhost:3001');

const apiServerClient = {
    fetch: async (url, options = {}) => {
        const headers = { ...options.headers };
        if (pb.authStore.token) {
            headers['Authorization'] = `Bearer ${pb.authStore.token}`;
        }
        return await window.fetch(API_SERVER_URL + url, { ...options, headers });
    }
};

export default apiServerClient;

export { apiServerClient };
