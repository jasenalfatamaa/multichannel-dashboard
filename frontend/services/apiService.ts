import axios from 'axios';
import { Conversation, Customer, Message, UserSession } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
});

// Add interceptor to include token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('omniai_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authService = {
    login: async (email: string, password: string): Promise<UserSession> => {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);

        const response = await api.post('/auth/login', formData);
        localStorage.setItem('omniai_token', response.data.access_token);

        const userResponse = await api.get('/auth/me');
        return userResponse.data;
    },
    getCurrentUser: async (): Promise<UserSession> => {
        const response = await api.get('/auth/me');
        return response.data;
    },
    updateProfile: async (data: {
        name?: string, avatar?: string, org?: string, timezone?: string,
        ai_auto_reply?: boolean, ai_tone?: string, two_factor_enabled?: boolean
    }): Promise<any> => {
        const response = await api.patch('/auth/me', data);
        return response.data;
    },
    changePassword: async (data: any): Promise<any> => {
        const response = await api.post('/auth/change-password', data);
        return response.data;
    },
    listIntegrations: async (): Promise<any[]> => {
        const response = await api.get('/auth/integrations');
        return response.data;
    },
    createIntegration: async (data: any): Promise<any> => {
        const response = await api.post('/auth/integrations', data);
        return response.data;
    },
    deleteIntegration: async (id: number): Promise<void> => {
        await api.delete(`/auth/integrations/${id}`);
    }
};

export const customerService = {
    list: async (): Promise<Customer[]> => {
        const response = await api.get('/customers/');
        return response.data;
    },
    create: async (customer: Partial<Customer>): Promise<Customer> => {
        const response = await api.post('/customers/', customer);
        return response.data;
    },
    delete: async (id: number): Promise<void> => {
        await api.delete(`/customers/${id}`);
    }
};

export const conversationService = {
    list: async (): Promise<Conversation[]> => {
        const response = await api.get('/conversations/');
        // Map backend response to frontend Conversation type if needed
        return response.data.map((c: any) => ({
            ...c,
            id: String(c.id),
            lastTimestamp: new Date(c.last_timestamp),
            startedAt: new Date(c.started_at),
            resolvedAt: c.resolved_at ? new Date(c.resolved_at) : undefined,
        }));
    },
    get: async (id: number): Promise<Conversation> => {
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
    updateStatus: async (id: number, status: string): Promise<void> => {
        await api.patch(`/conversations/${id}/status?status=${status}`);
    },
    sendMessage: async (id: number, sender: string, text: string): Promise<Message> => {
        const response = await api.post(`/conversations/${id}/messages`, { sender, text });
        return {
            ...response.data,
            id: String(response.data.id),
            timestamp: new Date(response.data.timestamp)
        };
    }
};

export const aiService = {
    getSuggestion: async (conversationId: number, tone: string): Promise<string> => {
        const response = await api.post(`/ai/suggest?conversation_id=${conversationId}&tone=${tone}`);
        return response.data.suggestion;
    },
    analyzeIntent: async (conversationId: number): Promise<string[]> => {
        const response = await api.post(`/ai/analyze-intent?conversation_id=${conversationId}`);
        return response.data.tags;
    },
    listKnowledge: async (): Promise<any[]> => {
        const response = await api.get('/ai/knowledge');
        return response.data.map((k: any) => ({
            ...k,
            id: String(k.id),
            created_at: new Date(k.created_at)
        }));
    },
    createKnowledge: async (name: string, size: string): Promise<any> => {
        const response = await api.post('/ai/knowledge', { name, size });
        return {
            ...response.data,
            id: String(response.data.id),
            created_at: new Date(response.data.created_at)
        };
    },
    deleteKnowledge: async (id: number): Promise<void> => {
        await api.delete(`/ai/knowledge/${id}`);
    }
};

export const userService = {
    list: async (): Promise<any[]> => {
        const response = await api.get('/auth/users');
        return response.data.map((u: any) => ({
            ...u,
            id: String(u.id),
            status: 'Active' // Backend doesn't have status yet, default to Active
        }));
    },
    delete: async (id: number): Promise<void> => {
        await api.delete(`/auth/users/${id}`);
    },
    register: async (userData: any): Promise<any> => {
        const response = await api.post('/auth/register-seed', userData);
        return {
            ...response.data,
            id: String(response.data.id),
            status: 'Active'
        };
    }
};
