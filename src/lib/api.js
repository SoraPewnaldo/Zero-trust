import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// API methods
export const api = {
    // Authentication
    auth: {
        login: async (username, password) => {
            const response = await apiClient.post('/auth/login', { username, password });
            return response.data;
        },
        logout: async () => {
            const response = await apiClient.post('/auth/logout');
            return response.data;
        },
        getCurrentUser: async () => {
            const response = await apiClient.get('/auth/me');
            return response.data;
        },
    },

    // Verification
    verification: {
        initiateScan: async (resourceId) => {
            const response = await apiClient.post('/verify/scan', { resourceId });
            return response.data;
        },
        verifyMFA: async (scanId, mfaCode) => {
            const response = await apiClient.post('/verify/mfa', { scanId, mfaCode });
            return response.data;
        },
        getScanStatus: async (scanId) => {
            const response = await apiClient.get(`/verify/status/${scanId}`);
            return response.data;
        },
    },

    // Resources
    resources: {
        getAll: async () => {
            const response = await apiClient.get('/resources');
            return response.data;
        },
        getById: async (resourceId) => {
            const response = await apiClient.get(`/resources/${resourceId}`);
            return response.data;
        },
    },

    // User
    user: {
        getScanHistory: async (limit) => {
            const response = await apiClient.get('/user/scans', {
                params: { limit },
            });
            return response.data;
        },
        getDevices: async () => {
            const response = await apiClient.get('/user/devices');
            return response.data;
        },
        getStats: async () => {
            const response = await apiClient.get('/user/stats');
            return response.data;
        },
    },

    // Admin
    admin: {
        getDashboardStats: async (timeRange) => {
            const response = await apiClient.get('/admin/stats', {
                params: { timeRange },
            });
            return response.data;
        },
        getScanLogs: async (params) => {
            const response = await apiClient.get('/admin/scans', { params });
            return response.data;
        },
        getUsers: async () => {
            const response = await apiClient.get('/admin/users');
            return response.data;
        },
        getUserDetail: async (userId) => {
            const response = await apiClient.get(`/admin/users/${userId}`);
            return response.data;
        },
        createUser: async (userData) => {
            const response = await apiClient.post('/admin/users', userData);
            return response.data;
        },
        deleteUser: async (userId) => {
            const response = await apiClient.delete(`/admin/users/${userId}`);
            return response.data;
        },
    },
};

export default apiClient;
