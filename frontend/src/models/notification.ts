export type NotificationType =
	| 'lead_assigned'
	| 'lead_reassigned_away'
	| 'lead_status_changed'
	| 'lead_stale';

/** Matches backend's NotificationResponse exactly. */
export interface Notification {
	id: number;
	public_id: string;
	type: NotificationType;
	title: string;
	message: string;
	entity_type?: string;
	entity_id?: number;
	is_read: boolean;
	read_at?: string;
	created_at: string;
}
