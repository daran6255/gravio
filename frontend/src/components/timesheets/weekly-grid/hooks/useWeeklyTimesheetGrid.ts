import { useState, useMemo } from 'react';
import type { ProjectTimeLog, OrgHoliday, TimesheetWeekUnlockRequest, TimesheetStatus } from '../../../../models/timesheet';
import { computeWeekStatus } from '../../shared/weekStatus';

interface TimesheetRow {
	id: string; // unique row id
	type: 'project_task' | 'project_only' | 'general';
	projectId?: number;
	projectName?: string;
	taskId?: number;
	taskTitle?: string;
	categoryId?: number;
	categoryName?: string;
	billingType: 'billable' | 'non_billable';
	cells: Record<string, ProjectTimeLog | undefined>; // mapped by YYYY-MM-DD
	totalHours: number;
}

interface UseWeeklyTimesheetGridArgs {
	dates: Date[];
	logs: ProjectTimeLog[];
	holidays: OrgHoliday[];
	myUnlockRequests: TimesheetWeekUnlockRequest[];
	onRequestUnlock: (reason?: string) => void;
	isCurrentWeek: boolean;
}

export const useWeeklyTimesheetGrid = ({
	dates,
	logs,
	holidays,
	myUnlockRequests,
	onRequestUnlock,
	isCurrentWeek
}: UseWeeklyTimesheetGridArgs) => {
	const [requestDialogOpen, setRequestDialogOpen] = useState(false);
	const [requestReason, setRequestReason] = useState('');

	// Format helper YYYY-MM-DD
	const getFormatDateStr = (d: Date): string => {
		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	};

	const dateStrings = useMemo(() => dates.map(getFormatDateStr), [dates]);

	// Map holidays by date string
	const holidayMap = useMemo(() => {
		const map: Record<string, OrgHoliday> = {};
		holidays.forEach((h) => {
			map[h.holiday_date] = h;
		});
		return map;
	}, [holidays]);

	// Sunday is always treated as a holiday
	const sundayDateStrings = useMemo(
		() => new Set(dates.filter((d) => d.getDay() === 0).map(getFormatDateStr)),
		[dates]
	);
	const isHolidayDate = (dateStr: string) => !!holidayMap[dateStr] || sundayDateStrings.has(dateStr);
	const holidayLabel = (dateStr: string) => holidayMap[dateStr]?.name || 'Sunday';

	// Group logs into rows
	const gridRows = useMemo(() => {
		const rowsMap: Record<string, TimesheetRow> = {};

		logs.forEach((log) => {
			let rowKey = '';
			let type: 'project_task' | 'project_only' | 'general' = 'general';
			
			if (log.project_id && log.task_id) {
				type = 'project_task';
				rowKey = `proj_${log.project_id}_task_${log.task_id}_${log.billing_type}`;
			} else if (log.project_id) {
				type = 'project_only';
				rowKey = `proj_${log.project_id}_only_${log.billing_type}`;
			} else if (log.category_id) {
				type = 'general';
				rowKey = `cat_${log.category_id}_${log.billing_type}`;
			} else {
				rowKey = `fallback_${log.id}`;
			}

			if (!rowsMap[rowKey]) {
				rowsMap[rowKey] = {
					id: rowKey,
					type,
					projectId: log.project_id,
					projectName: log.project?.name,
					taskId: log.task_id,
					taskTitle: log.task?.title,
					categoryId: log.category_id,
					categoryName: log.category?.name,
					billingType: log.billing_type,
					cells: {},
					totalHours: 0
				};
			}

			const logDateStr = log.log_date;
			rowsMap[rowKey].cells[logDateStr] = log;
			rowsMap[rowKey].totalHours += Number(log.hours);
		});

		return Object.values(rowsMap);
	}, [logs]);

	// Calculate totals per day
	const dayTotals = useMemo(() => {
		const totals: Record<string, number> = {};
		dateStrings.forEach((dateStr) => {
			totals[dateStr] = 0;
		});

		logs.forEach((log) => {
			const dStr = log.log_date;
			if (totals[dStr] !== undefined) {
				totals[dStr] += Number(log.hours);
			}
		});

		return totals;
	}, [logs, dateStrings]);

	// Weekly aggregate status
	const weeklyStatus: TimesheetStatus = useMemo(() => computeWeekStatus(logs), [logs]);
	const isWeekClosed = weeklyStatus === 'submitted' || weeklyStatus === 'approved';

	const hasUnsubmittedEntries = logs.some((l) => l.status === 'draft' || l.status === 'rejected');

	const grandTotal = Object.values(dayTotals).reduce((sum, h) => sum + h, 0);

	const weekStartStr = dateStrings[0];
	const activeGrant = myUnlockRequests.find(
		(r) => r.week_start_date === weekStartStr && r.status === 'approved' && !r.consumed_at
	);
	const pendingRequest = myUnlockRequests.find(
		(r) => r.week_start_date === weekStartStr && r.status === 'pending'
	);
	const latestDenied = myUnlockRequests
		.filter((r) => r.week_start_date === weekStartStr && r.status === 'denied')
		.sort((a, b) => (b.resolved_at || '').localeCompare(a.resolved_at || ''))[0];
	const hasApprovedOrSubmitted = useMemo(
		() => logs.some((l) => l.status === 'approved' || l.status === 'submitted'),
		[logs]
	);
	const isLocked = !isCurrentWeek && weeklyStatus === 'draft' && !activeGrant && !hasApprovedOrSubmitted;

	const handleOpenRequestDialog = () => {
		setRequestReason('');
		setRequestDialogOpen(true);
	};

	const handleSubmitUnlockRequest = () => {
		onRequestUnlock(requestReason.trim() || undefined);
		setRequestDialogOpen(false);
	};

	return {
		requestDialogOpen, setRequestDialogOpen,
		requestReason, setRequestReason,
		dateStrings,
		holidayMap,
		sundayDateStrings,
		isHolidayDate,
		holidayLabel,
		gridRows,
		dayTotals,
		weeklyStatus,
		isWeekClosed,
		hasUnsubmittedEntries,
		grandTotal,
		isLocked,
		pendingRequest,
		latestDenied,
		activeGrant,
		handleOpenRequestDialog,
		handleSubmitUnlockRequest
	};
};
