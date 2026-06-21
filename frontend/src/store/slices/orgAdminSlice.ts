import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import orgAdminService from '../../services/orgAdminService';
import userService from '../../services/userService';
import type { Organization } from '../../models/auth';
import type { CreateOrganizationRequest, CreateOrganizationResponse, AdminStats } from '../../models/admin';
import type { PaginatedResponse } from '../../models/common';
import type { TeamMember } from '../../models/user';

// Deliberately separate from authSlice: authSlice's extendOrganizationTrial assumes the
// acting user belongs to the org being modified, which is never true for a Super Admin
// managing a *different* org. This slice owns an arbitrary list of orgs instead.
interface OrgAdminState {
	organizations: Organization[];
	total: number;
	page: number;
	pageSize: number;
	loading: boolean;
	error: string | null;
	stats: AdminStats | null;
	selectedOrgUsers: TeamMember[];
	selectedOrgUsersLoading: boolean;
	selectedOrgUsersError: string | null;
}

const initialState: OrgAdminState = {
	organizations: [],
	total: 0,
	page: 1,
	pageSize: 20,
	loading: false,
	error: null,
	stats: null,
	selectedOrgUsers: [],
	selectedOrgUsersLoading: false,
	selectedOrgUsersError: null,
};

export const fetchOrganizations = createAsyncThunk(
	'orgAdmin/fetchAll',
	async (params: { page?: number; pageSize?: number; search?: string } | undefined, { rejectWithValue }) => {
		try {
			const { page = 1, pageSize = 20, search } = params || {};
			return await orgAdminService.listOrganizations(page, pageSize, search);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to fetch organizations');
		}
	}
);

export const createOrganization = createAsyncThunk(
	'orgAdmin/create',
	async (payload: CreateOrganizationRequest, { rejectWithValue }) => {
		try {
			return await orgAdminService.createOrganization(payload);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to create organization');
		}
	}
);

export const deactivateOrg = createAsyncThunk(
	'orgAdmin/deactivate',
	async (publicId: string, { rejectWithValue }) => {
		try {
			return await orgAdminService.deactivateOrganization(publicId);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to deactivate organization');
		}
	}
);

export const reactivateOrg = createAsyncThunk(
	'orgAdmin/reactivate',
	async (publicId: string, { rejectWithValue }) => {
		try {
			return await orgAdminService.reactivateOrganization(publicId);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to reactivate organization');
		}
	}
);

export const fetchAdminStats = createAsyncThunk(
	'orgAdmin/fetchStats',
	async (_, { rejectWithValue }) => {
		try {
			return await orgAdminService.getAdminStats();
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to fetch platform stats');
		}
	}
);

export const fetchOrgUsers = createAsyncThunk(
	'orgAdmin/fetchOrgUsers',
	async (publicId: string, { rejectWithValue }) => {
		try {
			return await orgAdminService.getOrganizationUsers(publicId);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to fetch organization users');
		}
	}
);

export const deactivateOrgUser = createAsyncThunk(
	'orgAdmin/deactivateUser',
	async (publicId: string, { rejectWithValue }) => {
		try {
			return await userService.deactivate(publicId);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to deactivate user');
		}
	}
);

export const reactivateOrgUser = createAsyncThunk(
	'orgAdmin/reactivateUser',
	async (publicId: string, { rejectWithValue }) => {
		try {
			return await userService.reactivate(publicId);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to reactivate user');
		}
	}
);

export const deleteOrgUser = createAsyncThunk(
	'orgAdmin/deleteUser',
	async (publicId: string, { rejectWithValue }) => {
		try {
			return await userService.deleteUser(publicId);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to delete user');
		}
	}
);

export const resendOrgUserInvite = createAsyncThunk(
	'orgAdmin/resendUserInvite',
	async (publicId: string, { rejectWithValue }) => {
		try {
			return await userService.resendInvite(publicId);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to resend invite');
		}
	}
);

const orgAdminSlice = createSlice({
	name: 'orgAdmin',
	initialState,
	reducers: {
		clearOrgAdminError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchOrganizations.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchOrganizations.fulfilled, (state, action: PayloadAction<PaginatedResponse<Organization>>) => {
				state.loading = false;
				state.organizations = action.payload.items;
				state.total = action.payload.total;
				state.page = action.payload.page;
				state.pageSize = action.payload.page_size;
			})
			.addCase(fetchOrganizations.rejected, (state, action: PayloadAction<any>) => {
				state.loading = false;
				state.error = action.payload;
			})
			.addCase(createOrganization.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(createOrganization.fulfilled, (state, action: PayloadAction<CreateOrganizationResponse>) => {
				state.loading = false;
				state.organizations.unshift(action.payload.organization);
				state.total += 1;
			})
			.addCase(createOrganization.rejected, (state, action: PayloadAction<any>) => {
				state.loading = false;
				state.error = action.payload;
			})
			.addCase(deactivateOrg.fulfilled, (state, action: PayloadAction<Organization>) => {
				const idx = state.organizations.findIndex((o) => o.public_id === action.payload.public_id);
				if (idx !== -1) state.organizations[idx] = action.payload;
			})
			.addCase(deactivateOrg.rejected, (state, action: PayloadAction<any>) => {
				state.error = action.payload;
			})
			.addCase(reactivateOrg.fulfilled, (state, action: PayloadAction<Organization>) => {
				const idx = state.organizations.findIndex((o) => o.public_id === action.payload.public_id);
				if (idx !== -1) state.organizations[idx] = action.payload;
			})
			.addCase(reactivateOrg.rejected, (state, action: PayloadAction<any>) => {
				state.error = action.payload;
			})
			.addCase(fetchAdminStats.fulfilled, (state, action: PayloadAction<AdminStats>) => {
				state.stats = action.payload;
			})
			.addCase(fetchOrgUsers.pending, (state) => {
				state.selectedOrgUsersLoading = true;
				state.selectedOrgUsersError = null;
			})
			.addCase(fetchOrgUsers.fulfilled, (state, action: PayloadAction<PaginatedResponse<TeamMember>>) => {
				state.selectedOrgUsersLoading = false;
				state.selectedOrgUsers = action.payload.items;
			})
			.addCase(fetchOrgUsers.rejected, (state, action: PayloadAction<any>) => {
				state.selectedOrgUsersLoading = false;
				state.selectedOrgUsersError = action.payload;
			})
			.addCase(deactivateOrgUser.fulfilled, (state, action: PayloadAction<TeamMember>) => {
				const idx = state.selectedOrgUsers.findIndex((u) => u.public_id === action.payload.public_id);
				if (idx !== -1) {
					state.selectedOrgUsers[idx] = action.payload;
				}
			})
			.addCase(reactivateOrgUser.fulfilled, (state, action: PayloadAction<TeamMember>) => {
				const idx = state.selectedOrgUsers.findIndex((u) => u.public_id === action.payload.public_id);
				if (idx !== -1) {
					state.selectedOrgUsers[idx] = action.payload;
				}
			})
			.addCase(deleteOrgUser.fulfilled, (state, action: PayloadAction<TeamMember>) => {
				state.selectedOrgUsers = state.selectedOrgUsers.filter((u) => u.public_id !== action.payload.public_id);
			})
			.addCase(resendOrgUserInvite.fulfilled, (state, action: PayloadAction<TeamMember>) => {
				const idx = state.selectedOrgUsers.findIndex((u) => u.public_id === action.payload.public_id);
				if (idx !== -1) {
					state.selectedOrgUsers[idx] = action.payload;
				}
			});
	},
});

export const { clearOrgAdminError } = orgAdminSlice.actions;
export default orgAdminSlice.reducer;
