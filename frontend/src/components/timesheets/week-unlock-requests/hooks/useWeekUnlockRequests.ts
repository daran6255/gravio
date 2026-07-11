import { useState, useMemo, useEffect } from 'react';
import type { TimesheetWeekUnlockRequest } from '../../../../models/timesheet';

interface UseWeekUnlockRequestsArgs {
	requests: TimesheetWeekUnlockRequest[];
	onDeny: (requestId: number, note?: string) => void;
}

export type UnlockRequestFilter = 'pending' | 'approved' | 'denied' | 'all';

export const useWeekUnlockRequests = ({ requests, onDeny }: UseWeekUnlockRequestsArgs) => {
	const [denyTarget, setDenyTarget] = useState<TimesheetWeekUnlockRequest | null>(null);
	const [denyNote, setDenyNote] = useState('');

	const [filter, setFilter] = useState<UnlockRequestFilter>('pending');
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);

	const counts = useMemo(() => ({
		pending: requests.filter((r) => r.status === 'pending').length,
		approved: requests.filter((r) => r.status === 'approved').length,
		denied: requests.filter((r) => r.status === 'denied').length,
		all: requests.length
	}), [requests]);

	const filteredRequests = useMemo(
		() => (filter === 'all' ? requests : requests.filter((r) => r.status === filter)),
		[requests, filter]
	);

	const paginatedRequests = useMemo(
		() => filteredRequests.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
		[filteredRequests, page, rowsPerPage]
	);

	// Reset to page 0 whenever the active filter changes
	useEffect(() => {
		setPage(0);
	}, [filter]);

	// Clamp back to the last valid page if the underlying list shrinks
	useEffect(() => {
		const maxPage = Math.max(0, Math.ceil(filteredRequests.length / rowsPerPage) - 1);
		if (page > maxPage) setPage(maxPage);
	}, [filteredRequests.length, rowsPerPage, page]);

	const handleOpenDeny = (req: TimesheetWeekUnlockRequest) => {
		setDenyTarget(req);
		setDenyNote('');
	};

	const handleConfirmDeny = () => {
		if (denyTarget) {
			onDeny(denyTarget.id, denyNote.trim() || undefined);
			setDenyTarget(null);
		}
	};

	return {
		denyTarget, setDenyTarget,
		denyNote, setDenyNote,
		filter, setFilter,
		counts,
		page, setPage,
		rowsPerPage, setRowsPerPage,
		filteredRequests,
		paginatedRequests,
		handleOpenDeny,
		handleConfirmDeny
	};
};
