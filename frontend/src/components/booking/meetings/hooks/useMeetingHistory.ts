import { useCallback, useEffect, useState } from 'react';
import bookingService from '../../../../services/bookingService';
import type { MeetingStatus, ScheduledMeetingHost } from '../../../../models/booking/meeting';

interface UseMeetingHistoryParams {
	/** 'mine' hits /bookings/meetings (the current host's own meetings); 'team' hits
	 * /bookings/meetings/team (manager/admin oversight — gap 7). */
	scope: 'mine' | 'team';
}

export const useMeetingHistory = ({ scope }: UseMeetingHistoryParams) => {
	const [meetings, setMeetings] = useState<ScheduledMeetingHost[]>([]);
	const [loading, setLoading] = useState(false);
	const [totalCount, setTotalCount] = useState(0);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState<MeetingStatus | ''>('');

	const refreshData = useCallback(async () => {
		setLoading(true);
		try {
			const fetcher = scope === 'team' ? bookingService.listTeamMeetings : bookingService.listMyMeetings;
			const response = await fetcher({
				status: statusFilter || undefined,
				search: searchTerm || undefined,
				page: page + 1,
				pageSize: rowsPerPage,
			});
			setMeetings(response.items);
			setTotalCount(response.total);
		} catch {
			setMeetings([]);
			setTotalCount(0);
		} finally {
			setLoading(false);
		}
	}, [scope, statusFilter, searchTerm, page, rowsPerPage]);

	useEffect(() => {
		refreshData();
	}, [refreshData]);

	const handlePageChange = (_event: unknown, newPage: number) => setPage(newPage);
	const handleRowsPerPageChange = (newRowsPerPage: number) => {
		setRowsPerPage(newRowsPerPage);
		setPage(0);
	};
	const handleSearchChange = (value: string) => {
		setSearchTerm(value);
		setPage(0);
	};
	const handleStatusFilterChange = (value: MeetingStatus | '') => {
		setStatusFilter(value);
		setPage(0);
	};

	return {
		meetings,
		loading,
		totalCount,
		page,
		rowsPerPage,
		searchTerm,
		statusFilter,
		handlePageChange,
		handleRowsPerPageChange,
		handleSearchChange,
		handleStatusFilterChange,
		refreshData,
	};
};
