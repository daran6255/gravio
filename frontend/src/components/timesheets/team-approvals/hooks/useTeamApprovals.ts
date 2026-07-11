import { useState, useMemo, useEffect } from 'react';
import type { ProjectTimeLog } from '../../../../models/timesheet';
import { computeWeekStatus } from '../../shared/weekStatus';

interface UserGroupedTimesheet {
	userId: number;
	userName: string;
	userEmail: string;
	totalHours: number;
	status: 'draft' | 'submitted' | 'approved' | 'rejected';
	rejectionNote?: string;
	logs: ProjectTimeLog[];
	isMyDirectReport: boolean;
}

interface UseTeamApprovalsArgs {
	logs: ProjectTimeLog[];
	onReject: (userId: number, reason: string) => void;
	onUnapprove: (userId: number) => void;
	currentUserId?: number;
}

export const useTeamApprovals = ({ logs, onReject, onUnapprove, currentUserId }: UseTeamApprovalsArgs) => {
	const [expandedUser, setExpandedUser] = useState<number | null>(null);
	const [rejectUserId, setRejectUserId] = useState<number | null>(null);
	const [rejectionReason, setRejectionReason] = useState('');
	const [revokeTarget, setRevokeTarget] = useState<UserGroupedTimesheet | null>(null);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);

	// Group logs by user
	const groupedTimesheets = useMemo(() => {
		const groups: Record<number, UserGroupedTimesheet> = {};

		logs.forEach((log) => {
			const uId = log.user_id;
			if (!groups[uId]) {
				groups[uId] = {
					userId: uId,
					userName: log.user?.full_name || log.user?.email || `User #${uId}`,
					userEmail: log.user?.email || '',
					totalHours: 0,
					status: 'draft',
					logs: [],
					isMyDirectReport: log.user?.reporting_manager_id === currentUserId
				};
			}

			groups[uId].logs.push(log);
			groups[uId].totalHours += Number(log.hours);
		});

		// compute status
		Object.values(groups).forEach((g) => {
			g.status = computeWeekStatus(g.logs);
			if (g.status === 'rejected') {
				g.rejectionNote = g.logs.find((l) => l.status === 'rejected')?.rejection_note;
			}
		});

		return Object.values(groups);
	}, [logs, currentUserId]);

	const paginatedTimesheets = useMemo(
		() => groupedTimesheets.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
		[groupedTimesheets, page, rowsPerPage]
	);

	// Clamp back to the last valid page if the list shrinks
	useEffect(() => {
		const maxPage = Math.max(0, Math.ceil(groupedTimesheets.length / rowsPerPage) - 1);
		if (page > maxPage) setPage(maxPage);
	}, [groupedTimesheets.length, rowsPerPage, page]);

	const handleOpenRejectDialog = (userId: number) => {
		setRejectUserId(userId);
		setRejectionReason('');
	};

	const handleCloseRejectDialog = () => {
		setRejectUserId(null);
		setRejectionReason('');
	};

	const handleConfirmReject = () => {
		if (rejectUserId && rejectionReason.trim()) {
			onReject(rejectUserId, rejectionReason);
			handleCloseRejectDialog();
		}
	};

	const handleConfirmRevoke = () => {
		if (revokeTarget) {
			onUnapprove(revokeTarget.userId);
			setRevokeTarget(null);
		}
	};

	return {
		expandedUser, setExpandedUser,
		rejectUserId, setRejectUserId,
		rejectionReason, setRejectionReason,
		revokeTarget, setRevokeTarget,
		page, setPage,
		rowsPerPage, setRowsPerPage,
		groupedTimesheets,
		paginatedTimesheets,
		handleOpenRejectDialog,
		handleCloseRejectDialog,
		handleConfirmReject,
		handleConfirmRevoke
	};
};
