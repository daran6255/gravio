/**
 * Activity Log Models
 * 
 * Type definitions for activity logs, filters, and responses.
 * 
 * @module activitylogs
 */

/**
 * Available action types for activity logs.
 * 
 * @remarks
 * These represent the different types of actions that can be logged in the system.
 */
export type ActionType =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "READ"
  | "LOGIN"
  | "LOGOUT"
  | "UPLOAD"
  | "DOWNLOAD"
  | "OTHER";

/**
 * Represents a single activity log entry from the system.
 * 
 * @interface ActivityLog
 * 
 * @property id - Unique identifier for the log entry
 * @property userId - ID of the user who performed the action (null for anonymous actions)
 * @property actionType - Type of action performed
 * @property resourceType - Type of resource affected (e.g., 'candidate', 'job', 'company')
 * @property resourceId - ID of the affected resource
 * @property method - HTTP method used (GET, POST, PUT, DELETE, etc.)
 * @property statusCode - HTTP response status code
 * @property ipAddress - IP address from which the action was performed
 * @property userAgent - User agent string of the client
 * @property metadata - Additional metadata about the action (free-form JSON)
 * @property createdAt - ISO 8601 datetime string when the log was created
 * 
 * @example
 * ```ts
 * const log: ActivityLog = {
 *   id: 1,
 *   userId: 123,
 *   actionType: 'CREATE',
 *   resourceType: 'candidate',
 *   resourceId: 456,
 *   method: 'POST',
 *   statusCode: 201,
 *   ipAddress: '192.168.1.1',
 *   userAgent: 'Mozilla/5.0...',
 *   metadata: { notes: 'Created via API' },
 *   createdAt: '2025-12-11T14:30:00Z'
 * };
 * ```
 */
export interface ActivityLog {
  id: number;
  userId?: number | null;
  actionType: ActionType | string;
  resourceType?: string | null;
  resourceId?: number | null;
  method?: string | null;
  statusCode?: number | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  [key: string]: unknown;
}

/**
 * Filter criteria for querying activity logs.
 * 
 * @interface ActivityLogFilter
 * 
 * @property page - Page number for pagination (1-based)
 * @property pageSize - Number of items per page
 * @property userId - Filter by user ID
 * @property actionType - Filter by action type
 * @property resourceType - Filter by resource type
 * @property resourceId - Filter by resource ID
 * @property method - Filter by HTTP method
 * @property statusCode - Filter by HTTP status code
 * 
 * @example
 * ```ts
 * const filter: ActivityLogFilter = {
 *   userId: 123,
 *   actionType: 'CREATE',
 *   resourceType: 'candidate',
 *   page: 1,
 *   pageSize: 20
 * };
 * ```
 */
export interface ActivityLogFilter {
  page?: number;
  pageSize?: number;
  userId?: number | null;
  actionType?: ActionType | string | null;
  resourceType?: string | null;
  resourceId?: number | null;
  method?: string | null;
  statusCode?: number | null;
}

/**
 * Paginated response structure for activity logs.
 * 
 * @interface PaginatedActivityLogsResponse
 * 
 * @property items - Array of activity log entries for the current page
 * @property total - Total number of matching items across all pages
 * @property page - Current page number (1-based)
 * @property pageSize - Number of items per page
 * @property totalPages - Total number of pages available
 * 
 * @example
 * ```ts
 * const response: PaginatedActivityLogsResponse = {
 *   items: [/* array of ActivityLog objects *\/],
 *   total: 100,
 *   page: 1,
 *   pageSize: 20,
 *   totalPages: 5
 * };
 * ```
 */
export interface PaginatedActivityLogsResponse {
  items: ActivityLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}