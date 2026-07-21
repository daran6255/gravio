export type GoogleConnectionStatus = 'connected' | 'disconnected' | 'error';

export interface GoogleConnectionStatusResponse {
	status: GoogleConnectionStatus;
	google_email?: string;
	connected_at?: string;
	last_error?: string;
}

export interface GoogleAuthorizationUrlResponse {
	authorization_url: string;
}
