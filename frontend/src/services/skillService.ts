import api from './api';

export interface Skill {
    id: number;
    name: string;
    is_verified: boolean;
}

export interface SkillCreate {
    name: string;
    is_verified?: boolean;
}

export const skillService = {
    async getSkills(query?: string): Promise<Skill[]> {
        const response = await api.get<Skill[]>('/skills', {
            params: { query, limit: 100 }
        });
        return response.data;
    },

    async createSkill(skill: SkillCreate): Promise<Skill> {
        const response = await api.post<Skill>('/skills', skill);
        return response.data;
    },

    async getAggregatedSkills(): Promise<string[]> {
        const response = await api.get<string[]>('/skills/aggregated');
        return response.data;
    },

    async verifySkill(id: number): Promise<Skill> {
        const response = await api.patch<Skill>(`/skills/${id}/verify`);
        return response.data;
    }
};
