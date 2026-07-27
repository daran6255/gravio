import api from './api';

export interface ContactSubmission {
	name: string;
	email: string;
	company?: string;
	message: string;
}

// TODO(backend): POST /contact/submit does not exist yet. Add a public (no-auth)
// route that accepts { name, email, company?, message }, forwards/stores the
// inquiry (e.g. email notification or a CRM lead), and returns 2xx on success.
const contactService = {
	submit: async (payload: ContactSubmission): Promise<void> => {
		await api.post('/contact/submit', payload);
	},
};

export default contactService;
