import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import authService from '../../services/authService';
import type { LoginResponse, User, BillingAddress } from '../../models/auth';

// The API wraps errors as { error: { message, code, detail } }, not a bare
// `detail` field — read `error.message` first or the real reason (e.g. "please
// verify your email") gets swallowed and callers fall back to a generic message.
function extractErrorMessage(error: any, fallback: string): string {
	return error?.response?.data?.error?.message || error?.response?.data?.detail || error?.message || fallback;
}

interface AuthState {
	user: User | null;
	token: string | null;
	isAuthenticated: boolean;
	loading: boolean;
	error: string | null;
	isInitialized: boolean;
}

const initialState: AuthState = {
	user: null,
	token: null,
	isAuthenticated: false,
	loading: false,
	error: null,
	isInitialized: false,
};

/**
 * Fetch current user details
 */
export const fetchCurrentUser = createAsyncThunk(
	'auth/fetchCurrentUser',
	async (_, { rejectWithValue }) => {
		try {
			const user = await authService.getCurrentUser();
			return user;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch user details'));
		}
	}
);

/**
 * Validate session on app load
 */
export const validateSession = createAsyncThunk(
	'auth/validateSession',
	async (_, { rejectWithValue }) => {
		try {
			const isValid = await authService.validateSession();

			if (isValid) {
				const token = authService.getAccessToken();
				// Fetch user details immediately if session is valid
				const user = await authService.getCurrentUser();
				return { token, user };
			}

			return rejectWithValue('Session invalid');
		} catch (error: any) {
			authService.clearTokens();
			return rejectWithValue(error.message || 'Session validation failed');
		}
	}
);

/**
 * Login user
 */
export const loginUser = createAsyncThunk(
	'auth/login',
	async ({ identifier, password }: { identifier: string; password: string }, { rejectWithValue }) => {
		try {
			const response = await authService.login(identifier, password);
			// Fetch user details immediately after login
			const user = await authService.getCurrentUser();
			return { ...response, user };
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Login failed'));
		}
	}
);

/**
 * Accept an invite by setting a password — ends in the same logged-in state as loginUser
 */
export const acceptInvite = createAsyncThunk(
	'auth/acceptInvite',
	async ({ token, newPassword }: { token: string; newPassword: string }, { rejectWithValue }) => {
		try {
			const response = await authService.acceptInvite(token, newPassword);
			const user = await authService.getCurrentUser();
			return { ...response, user };
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to accept invite'));
		}
	}
);

/**
 * Onboard a new organization and admin user
 */
export const onboardUser = createAsyncThunk(
	'auth/onboard',
	async (onboardData: any, { rejectWithValue }) => {
		try {
			const response = await authService.onboard(onboardData);
			return response;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Onboarding failed'));
		}
	}
);

/**
 * Refresh access token
 */
export const refreshAccessToken = createAsyncThunk(
	'auth/refresh',
	async (_, { rejectWithValue }) => {
		try {
			const response = await authService.refreshToken();

			if (!response) {
				return rejectWithValue('Token refresh failed');
			}

			return response;
		} catch (error: any) {
			authService.clearTokens();
			return rejectWithValue(extractErrorMessage(error, 'Token refresh failed'));
		}
	}
);

/**
 * Logout user
 */
export const logoutUser = createAsyncThunk(
	'auth/logout',
	async () => {
		await authService.logout();
	}
);

/**
 * Update the current user's own display preferences (timezone, currency)
 */
export const updateProfile = createAsyncThunk(
	'auth/updateProfile',
	async (payload: {
		full_name?: string | null;
		timezone?: string | null;
		currency?: string | null;
		dob?: string | null;
		phone?: string | null;
		avatar?: string | null;
		job_title?: string | null;
		billing_address?: BillingAddress | null;
		billing_reminder?: boolean | null;
		onboarding_completed?: boolean | null;
		reporting_manager_id?: number | null;
	}, { rejectWithValue }) => {
		try {
			const user = await authService.updateProfile(payload);
			return user;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to update profile'));
		}
	}
);

/**
 * Extend organization trial period (Super Admin only)
 */
export const extendOrganizationTrial = createAsyncThunk(
	'auth/extendTrial',
	async ({ orgPublicId, extendDays }: { orgPublicId: string; extendDays: number }, { rejectWithValue }) => {
		try {
			const updatedOrg = await authService.extendTrial(orgPublicId, extendDays);
			return updatedOrg;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to extend trial'));
		}
	}
);

const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		clearError: (state) => {
			state.error = null;
		},
		setToken: (state, action: PayloadAction<string>) => {
			state.token = action.payload;
			state.isAuthenticated = true;
		},
	},
	extraReducers: (builder) => {
		builder
			// Validate Session
			.addCase(validateSession.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(validateSession.fulfilled, (state, action: PayloadAction<{ token: string | null; user: User }>) => {
				state.loading = false;
				state.isAuthenticated = true;
				state.token = action.payload.token;
				state.user = action.payload.user;
				state.isInitialized = true;
			})
			.addCase(validateSession.rejected, (state) => {
				state.loading = false;
				state.isAuthenticated = false;
				state.token = null;
				state.user = null;
				state.isInitialized = true;
			})
			// Login
			.addCase(loginUser.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(loginUser.fulfilled, (state, action: PayloadAction<LoginResponse & { user: User }>) => {
				state.loading = false;
				state.isAuthenticated = true;
				state.token = action.payload.access_token;
				state.user = action.payload.user;
				state.isInitialized = true;
			})
			.addCase(loginUser.rejected, (state, action: PayloadAction<any>) => {
				state.loading = false;
				state.error = action.payload;
				state.isAuthenticated = false;
				state.isInitialized = true;
			})
			// Fetch Current User
			.addCase(fetchCurrentUser.fulfilled, (state, action: PayloadAction<User>) => {
				state.user = action.payload;
			})
			// Update Profile (timezone/currency preferences)
			.addCase(updateProfile.fulfilled, (state, action: PayloadAction<User>) => {
				state.user = action.payload;
			})
			.addCase(updateProfile.rejected, (state, action: PayloadAction<any>) => {
				state.error = action.payload;
			})
			// Accept Invite (ends in the same logged-in state as login)
			.addCase(acceptInvite.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(acceptInvite.fulfilled, (state, action: PayloadAction<LoginResponse & { user: User }>) => {
				state.loading = false;
				state.isAuthenticated = true;
				state.token = action.payload.access_token;
				state.user = action.payload.user;
				state.isInitialized = true;
			})
			.addCase(acceptInvite.rejected, (state, action: PayloadAction<any>) => {
				state.loading = false;
				state.error = action.payload;
			})
			// Onboard User
			.addCase(onboardUser.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(onboardUser.fulfilled, (state) => {
				state.loading = false;
			})
			.addCase(onboardUser.rejected, (state, action: PayloadAction<any>) => {
				state.loading = false;
				state.error = action.payload;
			})
			// Refresh Token
			.addCase(refreshAccessToken.pending, (state) => {
				state.error = null;
			})
			.addCase(refreshAccessToken.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
				state.isAuthenticated = true;
				state.token = action.payload.access_token;
			})
			.addCase(refreshAccessToken.rejected, (state) => {
				state.isAuthenticated = false;
				state.token = null;
				state.user = null;
			})
			// Logout
			.addCase(logoutUser.fulfilled, (state) => {
				state.user = null;
				state.token = null;
				state.isAuthenticated = false;
				state.isInitialized = true;
			})
			// Extend Trial
			.addCase(extendOrganizationTrial.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(extendOrganizationTrial.fulfilled, (state, action: PayloadAction<any>) => {
				state.loading = false;
				if (state.user && state.user.organization && state.user.organization.public_id === action.payload.public_id) {
					state.user.organization = {
						...state.user.organization,
						subscription_status: action.payload.subscription_status,
						trial_expires_at: action.payload.trial_expires_at,
					};
				}
			})
			.addCase(extendOrganizationTrial.rejected, (state, action: PayloadAction<any>) => {
				state.loading = false;
				state.error = action.payload;
			});
	},
});

export const { clearError, setToken } = authSlice.actions;
export default authSlice.reducer;
