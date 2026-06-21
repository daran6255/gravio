import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import userService from '../../services/userService';
import type { TeamMember, InviteUserRequest, UpdateUserRequest } from '../../models/user';
import type { PaginatedResponse } from '../../models/common';

interface UserState {
	users: TeamMember[];
	total: number;
	page: number;
	pageSize: number;
	loading: boolean;
	error: string | null;
}

const initialState: UserState = {
	users: [],
	total: 0,
	page: 1,
	pageSize: 20,
	loading: false,
	error: null,
};

export const fetchTeamUsers = createAsyncThunk(
	'users/fetchTeam',
	async (params: { page?: number; pageSize?: number } | undefined, { rejectWithValue }) => {
		try {
			const { page = 1, pageSize = 20 } = params || {};
			return await userService.list(page, pageSize);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to fetch team');
		}
	}
);

export const inviteTeamUser = createAsyncThunk(
	'users/invite',
	async (payload: InviteUserRequest, { rejectWithValue }) => {
		try {
			return await userService.inviteUser(payload);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to invite user');
		}
	}
);

export const updateTeamUser = createAsyncThunk(
	'users/update',
	async (data: { publicId: string; payload: UpdateUserRequest }, { rejectWithValue }) => {
		try {
			return await userService.updateUser(data.publicId, data.payload);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to update user');
		}
	}
);

export const deactivateTeamUser = createAsyncThunk(
	'users/deactivate',
	async (publicId: string, { rejectWithValue }) => {
		try {
			return await userService.deactivate(publicId);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to deactivate user');
		}
	}
);

export const reactivateTeamUser = createAsyncThunk(
	'users/reactivate',
	async (publicId: string, { rejectWithValue }) => {
		try {
			return await userService.reactivate(publicId);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to reactivate user');
		}
	}
);

export const deleteTeamUser = createAsyncThunk(
	'users/delete',
	async (publicId: string, { rejectWithValue }) => {
		try {
			return await userService.deleteUser(publicId);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to delete user invite');
		}
	}
);

export const bulkDeleteTeamUsers = createAsyncThunk(
	'users/bulkDelete',
	async (publicIds: string[], { rejectWithValue }) => {
		try {
			return await userService.bulkDeleteUsers(publicIds);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to bulk delete users');
		}
	}
);

export const resendTeamUserInvite = createAsyncThunk(
	'users/resendInvite',
	async (publicId: string, { rejectWithValue }) => {
		try {
			return await userService.resendInvite(publicId);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to resend invite');
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
			.addCase(fetchTeamUsers.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchTeamUsers.fulfilled, (state, action: PayloadAction<PaginatedResponse<TeamMember>>) => {
				state.loading = false;
				state.users = action.payload.items;
				state.total = action.payload.total;
				state.page = action.payload.page;
				state.pageSize = action.payload.page_size;
			})
			.addCase(fetchTeamUsers.rejected, (state, action: PayloadAction<any>) => {
				state.loading = false;
				state.error = action.payload;
			})
			.addCase(inviteTeamUser.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(inviteTeamUser.fulfilled, (state, action: PayloadAction<TeamMember>) => {
				state.loading = false;
				state.users.unshift(action.payload);
				state.total += 1;
			})
			.addCase(inviteTeamUser.rejected, (state, action: PayloadAction<any>) => {
				state.loading = false;
				state.error = action.payload;
			})
			.addCase(updateTeamUser.fulfilled, (state, action: PayloadAction<TeamMember>) => {
				const idx = state.users.findIndex((u) => u.public_id === action.payload.public_id);
				if (idx !== -1) state.users[idx] = action.payload;
			})
			.addCase(deactivateTeamUser.fulfilled, (state, action: PayloadAction<TeamMember>) => {
				const idx = state.users.findIndex((u) => u.public_id === action.payload.public_id);
				if (idx !== -1) state.users[idx] = action.payload;
			})
			.addCase(deactivateTeamUser.rejected, (state, action: PayloadAction<any>) => {
				state.error = action.payload;
			})
			.addCase(reactivateTeamUser.fulfilled, (state, action: PayloadAction<TeamMember>) => {
				const idx = state.users.findIndex((u) => u.public_id === action.payload.public_id);
				if (idx !== -1) state.users[idx] = action.payload;
			})
			.addCase(reactivateTeamUser.rejected, (state, action: PayloadAction<any>) => {
				state.error = action.payload;
			})
			.addCase(deleteTeamUser.fulfilled, (state, action: PayloadAction<TeamMember>) => {
				state.users = state.users.filter((u) => u.public_id !== action.payload.public_id);
				state.total = Math.max(0, state.total - 1);
			})
			.addCase(deleteTeamUser.rejected, (state, action: PayloadAction<any>) => {
				state.error = action.payload;
			})
			.addCase(bulkDeleteTeamUsers.fulfilled, (state, action: PayloadAction<any, string, { arg: string[] }>) => {
				const deletedIds = action.meta.arg;
				state.users = state.users.filter((u) => !deletedIds.includes(u.public_id));
				state.total = Math.max(0, state.total - deletedIds.length);
			})
			.addCase(bulkDeleteTeamUsers.rejected, (state, action: PayloadAction<any>) => {
				state.error = action.payload;
			})
			.addCase(resendTeamUserInvite.fulfilled, (state, action: PayloadAction<TeamMember>) => {
				const idx = state.users.findIndex((u) => u.public_id === action.payload.public_id);
				if (idx !== -1) state.users[idx] = action.payload;
			})
			.addCase(resendTeamUserInvite.rejected, (state, action: PayloadAction<any>) => {
				state.error = action.payload;
			});
	},
});

export const { clearUserError } = userSlice.actions;
export default userSlice.reducer;
