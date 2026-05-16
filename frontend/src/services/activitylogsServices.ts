/**
 * Activity Log Service
 * 
 * Service layer for managing activity logs API interactions.
 * Handles fetching activity logs with various filters and pagination.
 * 
 * @module activityLogService
 */

import api from "./api";
import type {
  ActivityLog,
  ActivityLogFilter,
  PaginatedActivityLogsResponse,
} from "../models/activitylogs";

/**
 * Converts camelCase filter keys to snake_case query params expected by the backend.
 * 
 * @param filter - Filter object with camelCase keys
 * @param page - Current page number (1-based)
 * @param pageSize - Number of items per page
 * @returns Query params object with snake_case keys
 */
function buildQueryParams(
  filter: ActivityLogFilter = {},
  page = 1,
  pageSize = 20
): Record<string, unknown> {
  const params: Record<string, unknown> = {
    page,
    page_size: pageSize,
  };

  if (filter.userId !== undefined && filter.userId !== null) {
    params.user_id = filter.userId;
  }
  if (filter.actionType) {
    params.action_type = filter.actionType;
  }
  if (filter.resourceType) {
    params.resource_type = filter.resourceType;
  }
  if (filter.resourceId !== undefined && filter.resourceId !== null) {
    params.resource_id = filter.resourceId;
  }
  if (filter.method) {
    params.method = filter.method;
  }
  if (filter.statusCode !== undefined && filter.statusCode !== null) {
    params.status_code = filter.statusCode;
  }

  return params;
}

/**
 * Maps backend response item (snake_case) to frontend ActivityLog model (camelCase).
 * Handles various backend response formats for maximum compatibility.
 * 
 * @param item - Raw activity log item from backend
 * @returns Normalized ActivityLog object
 */
function mapActivityLogItem(item: any): ActivityLog {
  // Map backend 'changes' to frontend 'metadata.changes'
  // Backend sends: { changes: {before: {...}, after: {...}} }
  // Frontend expects: { metadata: {changes: {before: {...}, after: {...}}} }
  const metadata = item.metadata || (item.changes ? { changes: item.changes } : null);

  return {
    id: item.id,
    userId: item.user_id ?? item.userId ?? null,
    actionType: item.action_type ?? item.actionType ?? (item.action?.toUpperCase() ?? "OTHER"),
    resourceType: item.resource_type ?? item.resourceType ?? null,
    resourceId: item.resource_id ?? item.resourceId ?? null,
    method: item.method ?? null,
    statusCode: item.status_code ?? item.statusCode ?? null,
    ipAddress: item.ip_address ?? item.ipAddress ?? null,
    userAgent: item.user_agent ?? item.userAgent ?? null,
    metadata: metadata,
    createdAt: item.created_at ?? item.createdAt ?? "",
    // Include any extra fields as pass-through
    ...item,
  } as ActivityLog;
}

/**
 * Maps paginated backend response to typed PaginatedActivityLogsResponse.
 * Handles various response structures for maximum compatibility.
 * 
 * @param resp - Raw paginated response from backend
 * @returns Normalized paginated response
 */
function mapPaginatedResponse(resp: any): PaginatedActivityLogsResponse {
  const items = Array.isArray(resp.items ? resp.items : resp.data?.items ? resp.data.items : [])
    ? (resp.items ?? resp.data?.items ?? []).map(mapActivityLogItem)
    : [];

  const total = resp.total ?? resp.data?.total ?? 0;
  const page = resp.page ?? resp.data?.page ?? 1;
  const pageSize = resp.page_size ?? resp.data?.page_size ?? resp.data?.pageSize ?? 20;
  const totalPages = resp.total_pages ?? resp.data?.total_pages ?? Math.ceil(total / pageSize);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Activity Log Service API
 * 
 * Provides methods to interact with activity log endpoints.
 */
const activityLogService = {
  /**
   * Fetches all activity logs with optional filtering (Admin only).
   * 
   * @param filter - Filter criteria for activity logs
   * @param page - Page number (1-based, default: 1)
   * @param pageSize - Items per page (default: 20)
   * @returns Promise resolving to paginated activity logs
   * @throws {Error} If the API request fails
   * 
   * @example
   * ```ts
   * const logs = await activityLogService.getAllActivityLogs(
   *   { actionType: 'CREATE', userId: 1 },
   *   1,
   *   20
   * );
   * ```
   */
  getAllActivityLogs: async (
    filter: ActivityLogFilter = {},
    page = 1,
    pageSize = 20
  ): Promise<PaginatedActivityLogsResponse> => {
    const params = buildQueryParams(filter, page, pageSize);
    const res = await api.get("/activity-logs", { params });
    return mapPaginatedResponse(res.data ?? res);
  },

  /**
   * Fetches activity logs for the currently authenticated user.
   * 
   * @param page - Page number (1-based, default: 1)
   * @param pageSize - Items per page (default: 20)
   * @returns Promise resolving to paginated activity logs for current user
   * @throws {Error} If the API request fails
   * 
   * @example
   * ```ts
   * const myLogs = await activityLogService.getMyActivityLogs(1, 20);
   * ```
   */
  getMyActivityLogs: async (
    page = 1,
    pageSize = 20
  ): Promise<PaginatedActivityLogsResponse> => {
    const params = { page, page_size: pageSize };
    const res = await api.get("/activity-logs/me", { params });
    return mapPaginatedResponse(res.data ?? res);
  },
};

export default activityLogService;
