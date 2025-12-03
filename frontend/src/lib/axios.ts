import axios from 'axios';

const api = axios.create({
    // Next.jsのrewritesでプロキシするため、相対パスを使用
    baseURL: '',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true,
});

// リクエストインターセプター（デバッグ情報付き）
api.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    // Prepend /api to URL if it doesn't start with /sanctum (which is root-level)
    if (config.url && !config.url.startsWith('/sanctum') && !config.url.startsWith('/api')) {
        config.url = `/api${config.url}`;
    }

    // デバッグ情報を出力
    console.log('[axios] リクエスト:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
        hasToken: !!token,
        headers: config.headers,
    });

    return config;
}, (error) => {
    console.error('[axios] リクエストエラー:', error);
    return Promise.reject(error);
});

// レスポンスインターセプター（デバッグ情報付き）
api.interceptors.response.use((response) => {
    console.log('[axios] レスポンス成功:', {
        status: response.status,
        statusText: response.statusText,
        url: response.config.url,
        data: response.data,
    });
    return response;
}, (error) => {
    console.error('[axios] レスポンスエラー:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: error.config ? `${error.config.baseURL}${error.config.url}` : 'N/A',
    });
    return Promise.reject(error);
});

export default api;
