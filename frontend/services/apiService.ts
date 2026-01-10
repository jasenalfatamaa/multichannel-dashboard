import axios from 'axios';
import { Conversation, Customer, Message, UserSession } from '../types';
import * as MOCK from '../constants';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
});

// Demo Mode State
let isDemoMode = false;

export const checkDemoMode = () => isDemoMode;
export const setDemoMode = (val: boolean) => { isDemoMode = val; };

// Add interceptor to include token and handle connection errors
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('omniai_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    response => response,
    error => {
        if (!error.response || error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
            console.warn("Backend unreachable. Switching to Demo Mode.");
            isDemoMode = true;
            // Dispatch a custom event to notify UI
            window.dispatchEvent(new Event('demo-mode-changed'));
        }
        return Promise.reject(error);
    }
);

export const authService = {
    login: async (email: string, password: string): Promise<UserSession> => {
        if (isDemoMode) {
            // Mock login for demo mode
            if (email === 'super@omniai.com' && password === 'password123') {
                localStorage.setItem('omniai_token', 'demo-token');
                return MOCK.MOCK_USER;
            }
            throw { response: { data: { detail: "Invalid demo credentials" } } };
        }

        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);

        const response = await api.post('/auth/login', formData);
        localStorage.setItem('omniai_token', response.data.access_token);

        const userResponse = await api.get('/auth/me');
        return userResponse.data;
    },
    getCurrentUser: async (): Promise<UserSession> => {
        if (isDemoMode) return MOCK.MOCK_USER;
        try {
            const response = await api.get('/auth/me');
            return response.data;
        } catch (e) {
            if (isDemoMode) return MOCK.MOCK_USER;
            throw e;
        }
    },
    updateProfile: async (data: any): Promise<any> => {
        if (isDemoMode) return { ...MOCK.MOCK_USER, ...data };
        const response = await api.patch('/auth/me', data);
        return response.data;
    },
    changePassword: async (data: any): Promise<any> => {
        if (isDemoMode) return { message: "Demo Mode: Password not changed" };
        const response = await api.post('/auth/change-password', data);
        return response.data;
    },
    listIntegrations: async (): Promise<any[]> => {
        if (isDemoMode) return MOCK.MOCK_INTEGRATIONS;
        try {
            const response = await api.get('/auth/integrations');
            return response.data;
        } catch (e) {
            if (isDemoMode) return MOCK.MOCK_INTEGRATIONS;
            throw e;
        }
    },
    createIntegration: async (data: any): Promise<any> => {
        if (isDemoMode) return { ...data, id: Math.random() };
        const response = await api.post('/auth/integrations', data);
        return response.data;
    },
    deleteIntegration: async (id: string | number): Promise<void> => {
        if (isDemoMode) return;
        await api.delete(`/auth/integrations/${id}`);
    }
};

export const customerService = {
    list: async (): Promise<Customer[]> => {
        if (isDemoMode) return MOCK.MOCK_CUSTOMERS;
        try {
            const response = await api.get('/customers/');
            return response.data.map((c: any) => ({
                ...c,
                id: String(c.id),
                lastActive: c.last_active ? new Date(c.last_active) : new Date(),
            }));
        } catch (e) {
            if (isDemoMode) return MOCK.MOCK_CUSTOMERS.map(cust => ({
                id: cust.id,
                name: cust.name,
                email: cust.email,
                phone: cust.phone,
                avatar: cust.avatar,
                lastActive: cust.lastActive,
                source: cust.source,
                tags: cust.tags,
                external_id: cust.external_id
            }));
            throw e;
        }
    },
    create: async (customer: Partial<Customer>): Promise<Customer> => {
        if (isDemoMode) return { ...customer, id: String(Math.random()) } as Customer;
        const response = await api.post('/customers/', customer);
        return {
            ...response.data,
            id: String(response.data.id),
            lastActive: response.data.last_active ? new Date(response.data.last_active) : new Date(),
        };
    },
    delete: async (id: string | number): Promise<void> => {
        if (isDemoMode) return;
        await api.delete(`/customers/${id}`);
    }
};

export const conversationService = {
    list: async (): Promise<Conversation[]> => {
        if (isDemoMode) return MOCK.MOCK_CONVERSATIONS;
        try {
            const response = await api.get('/conversations/');
            return response.data.map((c: any) => ({
                ...c,
                id: String(c.id),
                customerId: String(c.customer_id),
                lastTimestamp: new Date(c.last_timestamp),
                startedAt: new Date(c.started_at),
                resolvedAt: c.resolved_at ? new Date(c.resolved_at) : undefined,
                messages: c.messages ? c.messages.map((m: any) => ({
                    ...m,
                    id: String(m.id),
                    timestamp: new Date(m.timestamp)
                })) : []
            }));
        } catch (e) {
            if (isDemoMode) return MOCK.MOCK_CONVERSATIONS;
            throw e;
        }
    },
    create: async (data: any): Promise<Conversation> => {
        if (isDemoMode) return { ...data, id: `conv-${Date.now()}`, messages: [], startedAt: new Date() };
        const response = await api.post('/conversations/', data);
        return {
            ...response.data,
            id: String(response.data.id),
            customerId: String(response.data.customer_id),
            lastTimestamp: new Date(),
            startedAt: new Date(response.data.started_at),
            messages: []
        };
    },
    get: async (id: string | number): Promise<Conversation> => {
        if (isDemoMode) return MOCK.MOCK_CONVERSATIONS.find(c => c.id === String(id)) || MOCK.MOCK_CONVERSATIONS[0];
        const response = await api.get(`/conversations/${id}`);
        return {
            ...response.data,
            id: String(response.data.id),
            lastTimestamp: new Date(response.data.last_timestamp),
            startedAt: new Date(response.data.started_at),
            resolvedAt: response.data.resolved_at ? new Date(response.data.resolved_at) : undefined,
            messages: response.data.messages.map((m: any) => ({
                ...m,
                id: String(m.id),
                timestamp: new Date(m.timestamp)
            }))
        };
    },
    updateStatus: async (id: string | number, status: string): Promise<void> => {
        if (isDemoMode) return;
        await api.patch(`/conversations/${id}/status?status=${status}`);
    },
    sendMessage: async (id: string | number, sender: string, text: string): Promise<Message> => {
        if (isDemoMode) return { id: String(Math.random()), sender: sender as 'user' | 'admin' | 'ai', text, timestamp: new Date() };
        const response = await api.post(`/conversations/${id}/messages`, { sender, text });
        return {
            ...response.data,
            id: String(response.data.id),
            timestamp: new Date(response.data.timestamp)
        };
    }
};

export const aiService = {
    getSuggestion: async (conversationId: string | number, tone: string): Promise<string> => {
        if (isDemoMode) return "Maaf, fitur AI real-time membutuhkan Backend aktif. (Demo Mode)";
        const response = await api.post(`/ai/suggest?conversation_id=${conversationId}&tone=${tone}`);
        return response.data.suggestion;
    },
    analyzeIntent: async (conversationId: string | number): Promise<string[]> => {
        if (isDemoMode) return ["Demo"];
        const response = await api.post(`/ai/analyze-intent?conversation_id=${conversationId}`);
        return response.data.tags;
    },
    listKnowledge: async (): Promise<any[]> => {
        if (isDemoMode) return MOCK.MOCK_KNOWLEDGE;
        try {
            const response = await api.get('/ai/knowledge');
            return response.data.map((k: any) => ({
                ...k,
                id: String(k.id),
                created_at: new Date(k.created_at)
            }));
        } catch (e) {
            if (isDemoMode) return MOCK.MOCK_KNOWLEDGE;
            throw e;
        }
    },
    createKnowledge: async (name: string, size: string): Promise<any> => {
        if (isDemoMode) return { id: String(Math.random()), name, size, status: 'ready', created_at: new Date() };
        const response = await api.post('/ai/knowledge', { name, size });
        return {
            ...response.data,
            id: String(response.data.id),
            created_at: new Date(response.data.created_at)
        };
    },
    deleteKnowledge: async (id: string | number): Promise<void> => {
        if (isDemoMode) return;
        await api.delete(`/ai/knowledge/${id}`);
    }
};

export const userService = {
    list: async (): Promise<any[]> => {
        if (isDemoMode) return MOCK.MOCK_TEAM;
        try {
            const response = await api.get('/auth/users');
            return response.data.map((u: any) => ({
                ...u,
                id: String(u.id),
                status: 'Active'
            }));
        } catch (e) {
            if (isDemoMode) return MOCK.MOCK_TEAM;
            throw e;
        }
    },
    delete: async (id: string | number): Promise<void> => {
        if (isDemoMode) return;
        await api.delete(`/auth/users/${id}`);
    },
    register: async (userData: any): Promise<any> => {
        if (isDemoMode) return { ...userData, id: String(Math.random()), status: 'Active' };
        const response = await api.post('/auth/register-seed', userData);
        return {
            ...response.data,
            id: String(response.data.id),
            status: 'Active'
        };
    }
};
