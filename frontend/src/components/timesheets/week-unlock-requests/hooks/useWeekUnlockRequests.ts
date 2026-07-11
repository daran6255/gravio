import { useState, useMemo, useEffect } from 'react';
import type { TimesheetWeekUnlockRequest } from '../../../../models/timesheet';

interface UseWeekUnlockRequestsArgs {
	requests: TimesheetWeekUnlockRequest[];
	onDeny: (requestId: number, note?: string) => void;
}

export const useWeekUnlockRequests = ({ requests, onDeny }: UseWeekUnlockRequestsArgs) => {
	const [denyTarget, setDenyTarget] = useState<TimesheetWeekUnlockRequest | null>(null);
	const [denyNote, setDenyNote] = useState('');

	const [pendingPage, setPendingPage] = useState(0);
	const [pendingRowsPerPage, setPendingRowsPerPage] = useState(10);
	const [resolvedPage, setResolvedPage] = useState(0);
	const [resolvedRowsPerPage, setResolvedRowsPerPage] = useState(10);

	const { pending, resolved } = useMemo(() => {
		const pending = requests.filter((r) => r.status === 'pending');
		const resolved = requests.filter((r) => r.status !== 'pending');
		return { pending, resolved };
	}, [requests]);

	const paginatedPending = useMemo(
		() => pending.slice(pendingPage * pendingRowsPerPage, pendingPage * pendingRowsPerPage + pendingRowsPerPage),
		[pending, pendingPage, pendingRowsPerPage]
	);
	const paginatedResolved = useMemo(
		() => resolved.slice(resolvedPage * resolvedRowsPerPage, resolvedPage * resolvedRowsPerPage + resolvedRowsPerPage),
		[resolved, resolvedPage, resolvedRowsPerPage]
	);

	// Clamp back to the last valid page if the underlying list shrinks
	useEffect(() => {
		const maxPage = Math.max(0, Math.ceil(pending.length / pendingRowsPerPage) - 1);
		if (pendingPage > maxPage) setPendingPage(maxPage);
	}, [pending.length, pendingRowsPerPage, pendingPage]);

	useEffect(() => {
		const maxPage = Math.max(0, Math.ceil(resolved.length / resolvedRowsPerPage) - 1);
		if (resolvedPage > maxPage) setResolvedPage(maxPage);
	}, [resolved.length, resolvedRowsPerPage, resolvedPage]);

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
		pendingPage, setPendingPage,
		pendingRowsPerPage, setPendingRowsPerPage,
		resolvedPage, setResolvedPage,
		resolvedRowsPerPage, setResolvedRowsPerPage,
		pending,
		resolved,
		paginatedPending,
		paginatedResolved,
		handleOpenDeny,
		handleConfirmDeny
	};
};
