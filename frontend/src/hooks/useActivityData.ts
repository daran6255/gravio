/**
 * useActivityData Hook
 * 
 * Custom hook for fetching activity logs based on user role with pagination support.
 * - Admin users: Fetches all activity logs
 * - Regular users: Fetches only their own activity logs
 * 
 * @module useActivityData
 */

import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store/store';
import {
    fetchAllActivityLogs,
    fetchMyActivityLogs,
} from '../store/slices/activityLogSlice';

/**
 * Configuration options for the activity data hook
 */
interface UseActivityDataOptions {
    /** Number of items to fetch per page */
    limit?: number;
    /** Auto-refresh interval in milliseconds (null to disable) */
    autoRefreshMs?: number | null;
    /** Whether to fetch on mount */
    fetchOnMount?: boolean;
    /** Initial page number */
    initialPage?: number;
}

/**
 * Custom hook for role-based activity log fetching with pagination
 * 
 * @param options - Configuration options
 * @returns Object containing activity logs, loading state, error, pagination controls, and refresh function
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { logs, loading, error, pagination, handlePageChange, refresh } = useActivityData({ limit: 10 });
 *   
 *   if (loading) return <Spinner />;
 *   if (error) return <Error message={error} />;
 *   
 *   return (
 *     <>
 *       <Table data={logs} />
 *       <Pagination 
 *         page={pagination.page} 
 *         count={pagination.totalPages} 
 *         onChange={handlePageChange}
 *       />
 *     </>
 *   );
 * }
 * ```
 */
export const useActivityData = (options: UseActivityDataOptions = {}) => {
    const {
        limit = 10,
        autoRefreshMs = null,
        fetchOnMount = true,
        initialPage = 1,
    } = options;

    const dispatch = useDispatch<AppDispatch>();

    // Get auth state to determine user role
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

    // Get activity logs state
    const { logs, loading, error, pagination } = useSelector(
        (state: RootState) => state.activityLogs
    );

    // Local state for current page and page size
    const [currentPage, setCurrentPage] = React.useState(initialPage);
    const [pageSize, setPageSize] = React.useState(limit);

    /**
     * Determine if the current user is an admin
     */
    const isAdmin = useCallback(() => {
        if (!user) return false;
        // Check if user has admin role
        return user.role === 'admin' || user.role === 'Admin' || user.role === 'ADMIN';
    }, [user]);

    /**
     * Fetch activity logs based on user role
     */
    const fetchData = useCallback((page: number = currentPage, size: number = pageSize) => {
        if (!isAuthenticated) {
            return;
        }

        if (isAdmin()) {
            // Admin: fetch all activity logs
            dispatch(fetchAllActivityLogs({ page, pageSize: size }));
        } else {
            // Regular user: fetch only their own activity logs
            dispatch(fetchMyActivityLogs({ page, pageSize: size }));
        }
    }, [dispatch, isAuthenticated, isAdmin, currentPage, pageSize]);

    /**
     * Handle page change
     */
    const handlePageChange = useCallback((_event: React.ChangeEvent<unknown>, page: number) => {
        setCurrentPage(page);
        fetchData(page, pageSize);
    }, [fetchData, pageSize]);

    /**
     * Handle page size change
     */
    const handlePageSizeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const newPageSize = parseInt(event.target.value, 10);
        setPageSize(newPageSize);
        setCurrentPage(1); // Reset to first page when changing page size
        fetchData(1, newPageSize);
    }, [fetchData]);

    /**
     * Manual refresh function
     */
    const refresh = useCallback(() => {
        fetchData(currentPage, pageSize);
    }, [fetchData, currentPage, pageSize]);

    // Fetch on mount if enabled
    useEffect(() => {
        if (fetchOnMount && isAuthenticated) {
            fetchData(currentPage, pageSize);
        }
    }, [fetchOnMount, isAuthenticated, fetchData, currentPage, pageSize]);

    // Auto-refresh if enabled
    useEffect(() => {
        if (autoRefreshMs && autoRefreshMs > 0 && isAuthenticated) {
            const intervalId = setInterval(() => {
                fetchData(currentPage, pageSize);
            }, autoRefreshMs);

            return () => clearInterval(intervalId);
        }
    }, [autoRefreshMs, isAuthenticated, fetchData, currentPage, pageSize]);

    return {
        /** Activity log entries */
        logs,
        /** Loading state */
        loading,
        /** Error message if any */
        error,
        /** Pagination information */
        pagination,
        /** Current page number */
        currentPage,
        /** Current page size */
        pageSize,
        /** Whether the current user is an admin */
        isAdmin: isAdmin(),
        /** Manual refresh function */
        refresh,
        /** Whether user is authenticated */
        isAuthenticated,
        /** Page change handler for pagination component */
        handlePageChange,
        /** Page size change handler */
        handlePageSizeChange,
    };
};

export default useActivityData;
