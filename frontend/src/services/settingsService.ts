import api from './api';

export interface DynamicField {
	id: number;
	entity_type: 'screening' | 'counseling';
	name: string;
	label: string;
	field_type: 'text' | 'textarea' | 'number' | 'single_choice' | 'multiple_choice' | 'phone_number';
	options?: string[];
	is_required: boolean;
	order: number;
}

export type DynamicFieldCreate = Omit<DynamicField, 'id'>;
export type DynamicFieldUpdate = Partial<DynamicFieldCreate>;

export interface SystemSetting {
	id: number;
	key: string;
	value: string;
	description: string;
	is_secret: boolean;
}

export type SystemSettingUpdate = {
	value: string;
}

export type SystemSettingCreate = {
	key: string;
	value: string;
	description?: string;
	is_secret?: boolean;
}

export const settingsService = {
	getFields: async (entityType: string): Promise<DynamicField[]> => {
		const response = await api.get(`/settings/fields/${entityType}`);
		return response.data;
	},

	createField: async (field: DynamicFieldCreate): Promise<DynamicField> => {
		const response = await api.post('/settings/fields', field);
		return response.data;
	},

	updateField: async (id: number, field: DynamicFieldUpdate): Promise<DynamicField> => {
		const response = await api.put(`/settings/fields/${id}`, field);
		return response.data;
	},

	deleteField: async (id: number): Promise<void> => {
		await api.delete(`/settings/fields/${id}`);
	},

	getSystemSettings: async (): Promise<SystemSetting[]> => {
		const response = await api.get('/settings/system');
		return response.data;
	},

	updateSystemSetting: async (id: number, setting: SystemSettingUpdate): Promise<SystemSetting> => {
		const response = await api.patch(`/settings/system/${id}`, setting);
		return response.data;
	},

	createSystemSetting: async (setting: SystemSettingCreate): Promise<SystemSetting> => {
		const response = await api.post('/settings/system', setting);
		return response.data;
	}
};
