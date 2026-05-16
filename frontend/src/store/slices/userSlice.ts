import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import userService from '../../services/userService';
import type { User, UserCreate, UserUpdate } from '../../models/user';

interface UserState {
	users: User[];
	assignmentUsers: User[];
	roles: string[];
	totalCount: number;
	loading: boolean;
	error: string | null;
}

const initialState: UserState = {
	users: [],
	assignmentUsers: [],
	roles: [],
	totalCount: 0,
	loading: false,
	error: null,
};

export const fetchUsers = createAsyncThunk(
	'users/fetchAll',
	async (params: { skip?: number; limit?: number; search?: string; role?: string } | undefined, { rejectWithValue }) => {
		try {
			const { skip = 0, limit = 100, search, role } = params || {};
			const response = await userService.getAll(skip, limit, role, search);
			return response;
		} catch (error: any) {
			return rejectWithValue(error.message || 'Failed to fetch users');
		}
	}
);

export const fetchRoles = createAsyncThunk(
	'users/fetchRoles',
	async (_, { rejectWithValue }) => {
		try {
			return await userService.getRoles();
		} catch (error: any) {
			return rejectWithValue(error.message || 'Failed to fetch roles');
		}
	}
);

export const fetchAssignmentUsers = createAsyncThunk(
	'users/fetchAssignmentUsers',
	async (_, { rejectWithValue }) => {
		try {
			const [sourcingResp, managerResp] = await Promise.all([
				userService.getAll(0, 100, 'sourcing'),
				userService.getAll(0, 100, 'manager')
			]);
			
			// Merge and sort by name
			const mergedUsers = [...sourcingResp.items, ...managerResp.items].sort((a, b) => 
				a.full_name.localeCompare(b.full_name)
			);
			
			return mergedUsers;
		} catch (error: any) {
			return rejectWithValue(error.message || 'Failed to fetch assignment users');
		}
	}
);

export const createUser = createAsyncThunk(
	'users/create',
	async (userData: UserCreate, { rejectWithValue }) => {
		try {
			return await userService.create(userData);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to create user');
		}
	}
);

export const updateUser = createAsyncThunk(
	'users/update',
	async ({ id, userData }: { id: string; userData: UserUpdate }, { rejectWithValue }) => {
		try {
			return await userService.update(id, userData);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to update user');
		}
	}
);

export const deleteUser = createAsyncThunk(
	'users/delete',
	async (id: string, { rejectWithValue }) => {
		try {
			await userService.delete(id);
			return id;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to delete user');
		}
	}
);
const userSlice = createSlice({
	name: 'users',
	initialState,
	reducers: {
		clearUserError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchUsers.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchUsers.fulfilled, (state, action: PayloadAction<{ items: User[]; total: number }>) => {
				state.loading = false;
				state.users = action.payload.items;
				state.totalCount = action.payload.total;
			})
			.addCase(fetchUsers.rejected, (state, action: PayloadAction<any>) => {
				state.loading = false;
				state.error = action.payload;
			})
			.addCase(fetchRoles.fulfilled, (state, action: PayloadAction<string[]>) => {
				state.roles = action.payload;
			})
			.addCase(createUser.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(createUser.fulfilled, (state, action: PayloadAction<User>) => {
				state.loading = false;
				state.users.unshift(action.payload);
				state.totalCount += 1;
			})
			.addCase(createUser.rejected, (state, action: PayloadAction<any>) => {
				state.loading = false;
				state.error = action.payload;
			})
			.addCase(updateUser.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateUser.fulfilled, (state, action: PayloadAction<User>) => {
				state.loading = false;
				state.users = state.users.map(u => u.id === action.payload.id ? action.payload : u);
			})
			.addCase(updateUser.rejected, (state, action: PayloadAction<any>) => {
				state.loading = false;
				state.error = action.payload;
			})
			.addCase(fetchAssignmentUsers.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchAssignmentUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
				state.loading = false;
				state.assignmentUsers = action.payload;
			})
			.addCase(fetchAssignmentUsers.rejected, (state, action: PayloadAction<any>) => {
				state.loading = false;
				state.error = action.payload;
			})
			.addCase(deleteUser.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteUser.fulfilled, (state, action: PayloadAction<string>) => {
				state.loading = false;
				state.users = state.users.filter(u => u.id.toString() !== action.payload);
				state.totalCount -= 1;
			})
			.addCase(deleteUser.rejected, (state, action: PayloadAction<any>) => {
				state.loading = false;
				state.error = action.payload;
			});
	},
});

export const { clearUserError } = userSlice.actions;
export default userSlice.reducer;
