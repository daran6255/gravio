import axios from 'axios';
import authService from './authService';

const api = axios.create({
	baseURL: `${import.meta.env.VITE_API_URL}/api/v1`,
	headers: {
		'Content-Type': 'application/json',
	},
});

// Track if we're currently refreshing to avoid multiple refresh calls
let isRefreshing = false;
let failedQueue: Array<{
	resolve: (value?: any) => void;
	reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null, token: string | null = null) => {
	failedQueue.forEach(promise => {
		if (error) {
			promise.reject(error);
		} else {
			promise.resolve(token);
		}
	});

	failedQueue = [];
};

// Request interceptor for adding auth token
api.interceptors.request.use(
	(config) => {
		const token = authService.getAccessToken();
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// Response interceptor for handling errors and token refresh
api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;

		// If error is not 401 or request already retried, reject immediately
		if (error.response?.status !== 401 || originalRequest._retry) {
			return Promise.reject(error);
		}

		// If we're already refreshing, queue this request
		if (isRefreshing) {
			return new Promise((resolve, reject) => {
				failedQueue.push({ resolve, reject });
			})
				.then(token => {
					originalRequest.headers.Authorization = `Bearer ${token}`;
					return api(originalRequest);
				})
				.catch(err => {
					return Promise.reject(err);
				});
		}

		// Mark this request as retried to avoid infinite loops
		originalRequest._retry = true;
		isRefreshing = true;

		try {
			// Attempt to refresh the token
			const response = await authService.refreshToken();

			const publicPaths = ['/login', '/candidate-registration', '/success', '/maintenance', '/exam'];
			const isPublicPath = publicPaths.some(path => window.location.pathname.startsWith(path));

			if (!response) {
				// Refresh failed, clear tokens and redirect to login
				processQueue(new Error('Token refresh failed'), null);
				authService.clearTokens();

				// Only redirect if we're not already on login page and not on a public path
				if (!isPublicPath && window.location.pathname !== '/login') {
					window.location.href = '/login';
				}

				return Promise.reject(error);
			}

			// Refresh succeeded, update the failed queue and retry original request
			const newToken = response.access_token;
			processQueue(null, newToken);

			// Update the original request with new token
			originalRequest.headers.Authorization = `Bearer ${newToken}`;

			return api(originalRequest);
		} catch (refreshError) {
			// Refresh failed, clear everything
			processQueue(refreshError, null);
			authService.clearTokens();

			// Redirect to login - only for non-public routes
			const publicPaths = ['/login', '/candidate-registration', '/success', '/maintenance', '/exam', '/candidate/interview'];
			const isPublicPath = publicPaths.some(path => window.location.pathname.startsWith(path));

			if (!isPublicPath && window.location.pathname !== '/login') {
				window.location.href = '/login';
			}

			return Promise.reject(refreshError);
		} finally {
			isRefreshing = false;
		}
	}
);

export default api;
