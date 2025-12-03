import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    // Prepend /api to URL if it doesn't start with /sanctum (which is root-level)
    if (config.url && !config.url.startsWith('/sanctum') && !config.url.startsWith('/api')) {
        config.url = `/api${config.url}`;
    }
    return config;
});

export default api;
