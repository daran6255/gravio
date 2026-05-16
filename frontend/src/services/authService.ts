import api from './api';
import type { LoginResponse, RegisterResponse, User } from '../models/auth';
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
	login: async (email: string, password: string): Promise<LoginResponse> => {
		const response = await api.post<LoginResponse>('/auth/login', { email, password });

		if (response.data.access_token && response.data.refresh_token) {
			localStorage.setItem(ACCESS_TOKEN_KEY, response.data.access_token);
			localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refresh_token);
		}

		return response.data;
	},

	/**
	 * Register a new user
	 */
	register: async (userData: any): Promise<RegisterResponse> => {
		const response = await api.post<RegisterResponse>('/auth/register', userData);
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
		} catch (error) {
			// If refresh fails, clear all tokens
			authService.clearTokens();
			return null;
		}
	},

	/**
	 * Logout user and clear tokens
	 */
	logout: () => {
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
		} catch (error) {
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
		const response = await api.get<User>('/users/me');
		return response.data;
	}
};

export default authService;
