// frontend\src\services\userService.ts
import api from './api';
import type { User, UserCreate, UserUpdate } from '../models/user';

const userService = {
    // Get all users with pagination, optional role and search filter
    getAll: async (skip = 0, limit = 100, role?: string, search?: string): Promise<{ items: User[], total: number }> => {
        const response = await api.get<{ items: User[], total: number }>('/users/', {
            params: { skip, limit, role, search }
        });
        return response.data;
    },

    // Get user by ID
    getById: async (id: string): Promise<User> => {
        const response = await api.get<User>(`/users/${id}`);
        return response.data;
    },

    // Create new user
    create: async (userData: UserCreate): Promise<User> => {
        const response = await api.post<User>('/users/', userData);
        return response.data;
    },

    // Update user
    update: async (id: string, userData: UserUpdate): Promise<User> => {
        const response = await api.put<User>(`/users/${id}`, userData);
        return response.data;
    },

    // Delete user
    delete: async (id: string): Promise<void> => {
        await api.delete(`/users/${id}`);
    },

    // Get current user profile
    getProfile: async (): Promise<User> => {
        const response = await api.get<User>('/users/me/');
        return response.data;
    },

    // Search users
    search: async (query: string, skip = 0, limit = 50): Promise<User[]> => {
        const response = await api.get<User[]>('/users/search/', {
            params: { q: query, skip, limit }
        });
        return response.data;
    },

    // Get available roles
    getRoles: async (): Promise<string[]> => {
        const response = await api.get<string[]>('/users/roles');
        return response.data;
    }
};

export default userService;