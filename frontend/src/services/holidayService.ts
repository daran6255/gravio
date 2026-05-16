import api from './api';
import type { ImportResult } from '../models/dsr';

export interface CompanyHoliday {
	id: number;
	public_id: string;
	holiday_date: string;
	holiday_name: string;
	created_at: string;
	updated_at: string;
	created_by_id?: number;
}

export interface CompanyHolidayListResponse {
	items: CompanyHoliday[];
	total: number;
}

const holidayService = {
	getHolidays: async (date_from?: string, date_to?: string, skip = 0, limit = 100) => {
		const response = await api.get<CompanyHolidayListResponse>('/dsr/holidays/', {
			params: { date_from, date_to, skip, limit },
		});
		return response.data;
	},

	createHoliday: async (data: { holiday_date: string; holiday_name: string }) => {
		const response = await api.post<CompanyHoliday>('/dsr/holidays/', data);
		return response.data;
	},

	deleteHoliday: async (public_id: string) => {
		const response = await api.delete<{ success: boolean }>(`/dsr/holidays/${public_id}`);
		return response.data;
	},

	updateHoliday: async (public_id: string, data: { holiday_date?: string; holiday_name?: string }) => {
		const response = await api.put<CompanyHoliday>(`/dsr/holidays/${public_id}`, data);
		return response.data;
	},

	importHolidays: async (file: File) => {
		const formData = new FormData();
		formData.append('file', file);
		const response = await api.post<ImportResult>(
			'/dsr/holidays/import',
			formData,
			{
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			}
		);
		return response.data;
	},
};

export default holidayService;
