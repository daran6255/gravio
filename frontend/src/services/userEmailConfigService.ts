import api from './api';

export interface UserEmailConfig {
	id?: number;
	user_id?: number;
	smtp_server: string;
	smtp_port: number;
	smtp_username: string;
	smtp_password?: string;
	sender_email: string;
	sender_name?: string;
	encryption: string;
	is_active: boolean;
}

const userEmailConfigService = {
	getMyConfig: async (): Promise<UserEmailConfig> => {
		const response = await api.get('/user-email-config/me');
		return response.data;
	},

	saveConfig: async (config: UserEmailConfig): Promise<UserEmailConfig> => {
		const response = await api.post('/user-email-config', config);
		return response.data;
	},

	testConfig: async (config: UserEmailConfig): Promise<{ status: string; message: string }> => {
		const response = await api.post('/user-email-config/test', config);
		return response.data;
	},

	deleteConfig: async (): Promise<void> => {
		await api.delete('/user-email-config');
	}
};

export default userEmailConfigService;
