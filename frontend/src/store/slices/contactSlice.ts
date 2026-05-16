import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import contactService from '../../services/contactService';
import type { Contact, ContactCreate, ContactUpdate, ContactPaginatedResponse } from '../../models/contact';

interface ContactState {
	list: Contact[];
	total: number;
	selectedContact: Contact | null;
	loading: boolean;
	error: string | null;
}

const initialState: ContactState = {
	list: [],
	total: 0,
	selectedContact: null,
	loading: false,
	error: null,
};

export const fetchContacts = createAsyncThunk(
	'contacts/fetchAll',
	async (params: {
		skip?: number;
		limit?: number;
		search?: string;
		companyId?: number;
		isDecisionMaker?: boolean;
		sortBy?: string;
		sortOrder?: 'asc' | 'desc';
	} | void, { rejectWithValue }) => {
		try {
			const { skip, limit, search, companyId, isDecisionMaker, sortBy, sortOrder } = params || {};
			return await contactService.getAll(skip, limit, search, companyId, isDecisionMaker, sortBy, sortOrder);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch contacts');
		}
	}
);

export const fetchContactById = createAsyncThunk(
	'contacts/fetchById',
	async (publicId: string, { rejectWithValue }) => {
		try {
			return await contactService.getById(publicId);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch contact');
		}
	}
);

export const createContact = createAsyncThunk(
	'contacts/create',
	async (contact: ContactCreate, { rejectWithValue }) => {
		try {
			return await contactService.create(contact);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to create contact');
		}
	}
);

export const updateContact = createAsyncThunk(
	'contacts/update',
	async ({ publicId, contact }: { publicId: string, contact: ContactUpdate }, { rejectWithValue }) => {
		try {
			return await contactService.update(publicId, contact);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to update contact');
		}
	}
);

export const deleteContact = createAsyncThunk(
	'contacts/delete',
	async (publicId: string, { rejectWithValue }) => {
		try {
			await contactService.delete(publicId);
			return publicId;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to delete contact');
		}
	}
);

export const setPrimaryContact = createAsyncThunk(
	'contacts/setPrimary',
	async (publicId: string, { rejectWithValue }) => {
		try {
			return await contactService.setPrimary(publicId);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to set primary contact');
		}
	}
);

const contactSlice = createSlice({
	name: 'contacts',
	initialState,
	reducers: {
		clearSelectedContact: (state) => {
			state.selectedContact = null;
		},
		clearError: (state) => {
			state.error = null;
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchContacts.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchContacts.fulfilled, (state, action: PayloadAction<ContactPaginatedResponse>) => {
				state.loading = false;
				state.list = action.payload.items;
				state.total = action.payload.total;
			})
			.addCase(fetchContacts.rejected, (state, action: PayloadAction<any>) => {
				state.loading = false;
				state.error = action.payload;
			})
			.addCase(fetchContactById.fulfilled, (state, action: PayloadAction<Contact>) => {
				state.selectedContact = action.payload;
			})
			.addCase(updateContact.fulfilled, (state, action: PayloadAction<Contact>) => {
				if (state.selectedContact?.public_id === action.payload.public_id) {
					state.selectedContact = action.payload;
				}
				const index = state.list.findIndex(c => c.public_id === action.payload.public_id);
				if (index !== -1) {
					state.list[index] = action.payload;
				}
			})
			.addCase(setPrimaryContact.fulfilled, (state, action: PayloadAction<Contact>) => {
				if (state.selectedContact?.public_id === action.payload.public_id) {
					state.selectedContact = action.payload;
				}
				// When one becomes primary, others in the same company might change. 
				// Full refresh might be safer, but for now just update the one.
				const index = state.list.findIndex(c => c.public_id === action.payload.public_id);
				if (index !== -1) {
					state.list[index] = action.payload;
				}
			})
			.addCase(deleteContact.fulfilled, (state, action: PayloadAction<string>) => {
				state.list = state.list.filter(c => c.public_id !== action.payload);
				if (state.selectedContact?.public_id === action.payload) {
					state.selectedContact = null;
				}
			});
	}
});

export const { clearSelectedContact, clearError } = contactSlice.actions;
export default contactSlice.reducer;
