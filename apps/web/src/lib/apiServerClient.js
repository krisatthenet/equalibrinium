import pb from './pocketbaseClient.js';

const API_SERVER_URL = import.meta.env.VITE_API_URL || "/hcgi/api";

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
