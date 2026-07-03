import api from './api';
import type { LoginResponse, RegisterResponse, User, BillingAddress } from '../models/auth';
import { jwtDecode } from 'jwt-decode';

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

interface JWTPayload {
	sub: string;
	exp: number;
	iat: number;
	type?: string;
}

const authService = {
	/**
	 * Login user and store tokens
	 */
	login: async (identifier: string, password: string): Promise<LoginResponse> => {
		const response = await api.post<LoginResponse>('/auth/login', { identifier, password });

		if (response.data.access_token && response.data.refresh_token) {
			localStorage.setItem(ACCESS_TOKEN_KEY, response.data.access_token);
			localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refresh_token);
		}

		return response.data;
	},

	/**
	 * Register a new user (deprecated / legacy)
	 */
	register: async (userData: any): Promise<RegisterResponse> => {
		const response = await api.post<RegisterResponse>('/auth/register', userData);
		return response.data;
	},

	/**
	 * Self-onboard a new organization and admin user
	 */
	onboard: async (onboardData: any): Promise<any> => {
		const response = await api.post('/onboard', onboardData);
		return response.data;
	},

	/**
	 * Verify user email address using the token from the email link
	 */
	verifyEmail: async (token: string): Promise<any> => {
		const response = await api.get('/auth/verify-email', {
			params: { token }
		});
		return response.data;
	},

	/**
	 * Accept an invite (Super-Admin-provisioned org admin or Org-Admin-invited teammate)
	 * by setting a password. Returns a token pair — the caller is logged in immediately.
	 */
	acceptInvite: async (token: string, newPassword: string): Promise<LoginResponse> => {
		const response = await api.post<LoginResponse>('/auth/accept-invite', {
			token,
			new_password: newPassword,
		});

		if (response.data.access_token && response.data.refresh_token) {
			localStorage.setItem(ACCESS_TOKEN_KEY, response.data.access_token);
			localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refresh_token);
		}

		return response.data;
	},

	/**
	 * Resend the verification email for a not-yet-verified account
	 */
	resendVerification: async (email: string): Promise<any> => {
		const response = await api.post('/auth/resend-verification', { email });
		return response.data;
	},

	/**
	 * Reset password using the reset token from the email link
	 */
	resetPassword: async (token: string, newPassword: string): Promise<any> => {
		const response = await api.post('/auth/reset-password', {
			token,
			new_password: newPassword,
		});
		return response.data;
	},

	/**
	 * Refresh access token using refresh token
	 */
	refreshToken: async (): Promise<LoginResponse | null> => {
		const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

		if (!refreshToken) {
			return null;
		}

		try {
			const response = await api.post<LoginResponse>('/auth/refresh', {
				refresh_token: refreshToken
			});

			if (response.data.access_token && response.data.refresh_token) {
				localStorage.setItem(ACCESS_TOKEN_KEY, response.data.access_token);
				localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refresh_token);
			}

			return response.data;
		} catch {
			// If refresh fails, clear all tokens
			authService.clearTokens();
			return null;
		}
	},

	/**
	 * Logout user and clear tokens
	 */
	logout: async (): Promise<void> => {
		const refreshToken = authService.getRefreshToken();
		if (refreshToken) {
			try {
				await api.post('/auth/logout', { refresh_token: refreshToken });
			} catch (error) {
				console.error('Failed to logout on server:', error);
			}
		}
		authService.clearTokens();
	},

	/**
	 * Clear all stored tokens
	 */
	clearTokens: () => {
		localStorage.removeItem(ACCESS_TOKEN_KEY);
		localStorage.removeItem(REFRESH_TOKEN_KEY);
	},

	/**
	 * Get access token from storage
	 */
	getAccessToken: (): string | null => {
		return localStorage.getItem(ACCESS_TOKEN_KEY);
	},

	/**
	 * Get refresh token from storage
	 */
	getRefreshToken: (): string | null => {
		return localStorage.getItem(REFRESH_TOKEN_KEY);
	},

	/**
	 * Check if a token is expired
	 */
	isTokenExpired: (token: string): boolean => {
		try {
			const decoded = jwtDecode<JWTPayload>(token);
			// Check if token expires within next 60 seconds (buffer for network latency)
			return decoded.exp * 1000 < Date.now() + 60000;
		} catch {
			// If token can't be decoded, consider it expired
			return true;
		}
	},

	/**
	 * Validate current session and refresh if needed
	 * Returns true if session is valid or was successfully refreshed
	 */
	validateSession: async (): Promise<boolean> => {
		const accessToken = authService.getAccessToken();
		const refreshToken = authService.getRefreshToken();

		// No tokens at all
		if (!accessToken && !refreshToken) {
			return false;
		}

		// Access token exists and is valid
		if (accessToken && !authService.isTokenExpired(accessToken)) {
			return true;
		}

		// Access token expired or missing, try to refresh
		if (refreshToken && !authService.isTokenExpired(refreshToken)) {
			const result = await authService.refreshToken();
			return result !== null;
		}

		// Both tokens expired or invalid
		authService.clearTokens();
		return false;
	},

	/**
	 * Get current user info
	 */
	getCurrentUser: async (): Promise<User> => {
		const response = await api.get<User>('/auth/me');
		return response.data;
	},

	/**
	 * Update the current user's own display preferences and profile extras
	 * (timezone, currency, dob, phone, avatar)
	 */
	updateProfile: async (payload: {
		full_name?: string | null;
		timezone?: string | null;
		currency?: string | null;
		dob?: string | null;
		phone?: string | null;
		avatar?: string | null;
		job_title?: string | null;
		billing_address?: BillingAddress | null;
		billing_reminder?: boolean | null;
	}): Promise<User> => {
		const response = await api.patch<User>('/auth/me', payload);
		return response.data;
	},

	/**
	 * Extend organization trial period (Super Admin only)
	 */
	extendTrial: async (orgPublicId: string, extendDays: number): Promise<any> => {
		const response = await api.post(`/admin/organizations/${orgPublicId}/extend-trial`, {
			extend_days: extendDays
		});
		return response.data;
	}
};

export default authService;
