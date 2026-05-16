import type { ActivityLog } from '../../models/activitylogs';

/**
 * Gets color for action type badge
 */
export const getActionColor = (actionType: string): 'success' | 'primary' | 'error' | 'warning' | 'info' | 'default' => {
	switch (actionType.toUpperCase()) {
		case 'CREATE':
			return 'success';
		case 'UPDATE':
			return 'primary';
		case 'DELETE':
			return 'error';
		case 'LOGIN':
		case 'LOGOUT':
			return 'info';
		case 'UPLOAD':
		case 'DOWNLOAD':
			return 'warning';
		default:
			return 'default';
	}
};

/**
 * Formats relative time (e.g., "2 minutes ago")
 */
export const getRelativeTime = (timestamp: string): string => {
	const now = new Date();
	const then = new Date(timestamp);
	const diffMs = now.getTime() - then.getTime();
	const diffSec = Math.floor(diffMs / 1000);
	const diffMin = Math.floor(diffSec / 60);
	const diffHour = Math.floor(diffMin / 60);
	const diffDay = Math.floor(diffHour / 24);

	if (diffSec < 60) return 'Just now';
	if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
	if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
	if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;

	return then.toLocaleDateString();
};

/**
 * Formats a value for display
 */
export const formatValue = (val: unknown): string => {
	if (val === null || val === undefined) return '—';
	if (typeof val === 'boolean') return val ? 'Yes' : 'No';

	if (typeof val === 'string') {
		// Check if it's a date string
		if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
			try {
				const date = new Date(val);
				if (!isNaN(date.getTime())) {
					return date.toLocaleString();
				}
			} catch (e) {
				// ignore
			}
		}
		return val;
	}

	if (typeof val === 'object') {
		try {
			// If it's a simple object with a name or label, use that
			const anyVal = val as any;
			if (anyVal.name) return String(anyVal.name);
			if (anyVal.label) return String(anyVal.label);
			if (anyVal.full_name) return String(anyVal.full_name);

			return JSON.stringify(val, null, 2);
		} catch (e) {
			return '[Complex Object]';
		}
	}

	return String(val);
};

/**
 * Gets a human-friendly narrative of the activity
 */
export const getActivityNarrative = (log: ActivityLog, userDisplay: string): string => {
	const action = log.actionType.toLowerCase();
	const resource = humanizeResourceType(log.resourceType);
	const resourceName = getResourceName(log);

	let narrative = `${userDisplay} `;

	switch (action) {
		case 'create':
			narrative += `created a new ${resource}`;
			if (resourceName) narrative += `: ${resourceName}`;
			break;
		case 'update':
			narrative += `updated the ${resource}`;
			if (resourceName) narrative += `: ${resourceName}`;
			break;
		case 'delete':
			narrative += `deleted a ${resource}`;
			if (resourceName) narrative += `: ${resourceName}`;
			break;
		case 'login':
			narrative += `logged into the system`;
			break;
		case 'logout':
			narrative += `logged out of the system`;
			break;
		default:
			narrative += `performed ${action} on ${resource}`;
	}

	if (log.resourceId && !resourceName) {
		narrative += ` (#${log.resourceId})`;
	}

	return narrative;
};

/**
 * Gets a quick summary for tooltip preview
 */
export const getQuickSummary = (log: ActivityLog): string => {
	const actionType = log.actionType.toUpperCase();

	if (actionType === 'UPDATE') {
		const changes = log.metadata?.changes || log.metadata;
		if (changes && typeof changes === 'object' && changes !== null && 'before' in changes && 'after' in changes) {
			const changedFields = Object.keys((changes as any).after || {});
			const fieldCount = changedFields.length;
			if (fieldCount === 0) return 'No changes detected';
			if (fieldCount === 1) return `Updated: ${changedFields[0]}`;
			return `Updated ${fieldCount} fields: ${changedFields.slice(0, 2).join(', ')}${fieldCount > 2 ? '...' : ''}`;
		}
		return 'Update action';
	}

	if (actionType === 'CREATE') return 'New record created';
	if (actionType === 'DELETE') return 'Record deleted';
	if (actionType === 'LOGIN') return 'User logged in';
	if (actionType === 'LOGOUT') return 'User logged out';

	return `${actionType} action`;
};

/**
 * Gets login status from activity log
 */
export const getLoginStatus = (log: ActivityLog): string => {
	if (log.statusCode && (log.statusCode >= 200 && log.statusCode < 300)) {
		return 'Successful';
	}
	return 'Failed';
};

/**
 * Gets location (city, country) from metadata
 */
export const getLocation = (log: ActivityLog): string => {
	const city = log.metadata?.city as string;
	const country = log.metadata?.country as string;

	if (city && country) return `${city}, ${country}`;
	if (city) return city;
	if (country) return country;

	return 'Unknown';
};

/**
 * Humanizes resource type strings
 */
export const humanizeResourceType = (resourceType: string | null | undefined): string => {
	if (!resourceType) return 'System';
	return resourceType
		.split('_')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
};

/**
 * Extracts a display name for the resource from metadata
 */
export const getResourceName = (log: ActivityLog): string | null => {
	const meta = log.metadata;
	if (!meta) return null;

	// Try common name fields
	return (
		(meta.full_name as string) ||
		(meta.fullName as string) ||
		(meta.name as string) ||
		(meta.email as string) ||
		(meta.username as string) ||
		(meta.title as string) ||
		null
	);
};
