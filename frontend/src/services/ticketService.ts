import api from './api';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'technical' | 'account' | 'feature_request' | 'other';

export interface TicketMessage {
	id: number;
	ticket_id: number;
	user_id: number;
	message: string;
	created_at: string;
	updated_at: string;
	user?: {
		full_name?: string;
		username: string;
	};
}

export interface Ticket {
	id: number;
	ticket_number: string;
	title: string;
	description: string;
	status: TicketStatus;
	priority: TicketPriority;
	category: TicketCategory;
	user_id: number;
	created_at: string;
	updated_at: string;
	messages: TicketMessage[];
}

export interface TicketCreate {
	title: string;
	description: string;
	priority: TicketPriority;
	category: TicketCategory;
}

export interface TicketUpdate {
	title?: string;
	description?: string;
	status?: TicketStatus;
	priority?: TicketPriority;
	category?: TicketCategory;
}

export interface TicketMessageCreate {
	message: string;
}

export const ticketService = {
	getTickets: async () => {
		const response = await api.get<Ticket[]>('/tickets/');
		return response.data;
	},

	getTicket: async (id: number) => {
		const response = await api.get<Ticket>(`/tickets/${id}`);
		return response.data;
	},

	createTicket: async (ticket: TicketCreate) => {
		const response = await api.post<Ticket>('/tickets/', ticket);
		return response.data;
	},

	updateTicket: async (id: number, ticket: TicketUpdate) => {
		const response = await api.patch<Ticket>(`/tickets/${id}`, ticket);
		return response.data;
	},

	addMessage: async (id: number, message: TicketMessageCreate) => {
		const response = await api.post<TicketMessage>(`/tickets/${id}/messages`, message);
		return response.data;
	}
};
