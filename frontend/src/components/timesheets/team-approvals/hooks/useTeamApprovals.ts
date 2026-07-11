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

export interface DateHoursEntry {
	logId: number;
	date: string;
	hours: number;
	billingType: ProjectTimeLog['billing_type'];
	notes?: string;
}

export interface TaskGroup {
	key: string;
	label: string;
	entries: DateHoursEntry[];
	totalHours: number;
}

export interface ProjectGroup {
	key: string;
	label: string;
	taskGroups: TaskGroup[];
	totalHours: number;
}

/** Groups a team member's logs for the week: Project -> Task (or Category, for
 * project-less general entries) -> the individual dates worked, so the expanded
 * approval row reads as a breakdown instead of one flat list of log rows. */
export const groupLogsByProject = (logs: ProjectTimeLog[]): ProjectGroup[] => {
	const projectMap = new Map<string, ProjectGroup>();

	logs.forEach((log) => {
		const projectKey = log.project_id ? `project_${log.project_id}` : 'general';
		const projectLabel = log.project?.name || 'General';

		let projectGroup = projectMap.get(projectKey);
		if (!projectGroup) {
			projectGroup = { key: projectKey, label: projectLabel, taskGroups: [], totalHours: 0 };
			projectMap.set(projectKey, projectGroup);
		}

		const taskKey = log.task_id
			? `task_${log.task_id}`
			: log.project_id
				? 'project_only'
				: `category_${log.category_id ?? 'none'}`;
		const taskLabel = log.task?.title
			|| (log.project_id ? 'Project Only (No Task)' : (log.category?.name || 'Uncategorized'));

		let taskGroup = projectGroup.taskGroups.find((t) => t.key === taskKey);
		if (!taskGroup) {
			taskGroup = { key: taskKey, label: taskLabel, entries: [], totalHours: 0 };
			projectGroup.taskGroups.push(taskGroup);
		}

		const hours = Number(log.hours);
		taskGroup.entries.push({
			logId: log.id,
			date: log.log_date,
			hours,
			billingType: log.billing_type,
			notes: log.notes
		});
		taskGroup.totalHours += hours;
		projectGroup.totalHours += hours;
	});

	const groups = Array.from(projectMap.values());
	groups.forEach((g) => g.taskGroups.forEach((t) => t.entries.sort((a, b) => a.date.localeCompare(b.date))));
	// General bucket last -- actual projects lead since they're usually what a manager is reviewing for.
	groups.sort((a, b) => (a.key === 'general' ? 1 : b.key === 'general' ? -1 : a.label.localeCompare(b.label)));
	return groups;
};

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
