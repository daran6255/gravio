import { useState, useEffect, useMemo, useCallback } from 'react';
import { format, parseISO, startOfDay, isWithinInterval } from 'date-fns';
import trainingExtensionService from '../../../../services/trainingExtensionService';
import type { TrainingBatch, CandidateAllocation, TrainingAttendance, TrainingBatchEvent, TrainingBatchPlan } from '../../../../models/training';
import type { User } from '../../../../models/auth';
import useToast from '../../../../hooks/useToast';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
	fetchAttendanceByBatch,
	updateBulkAttendance,
	updateAttendance as updateAttendanceAction,
	deleteAttendance as deleteAttendanceAction,
	updateLocalAttendance
} from '../../../../store/slices/attendanceSlice';

export const useAttendance = (batch: TrainingBatch, allocations: CandidateAllocation[], user: User | null) => {
	const toast = useToast();
	const dispatch = useAppDispatch();
	const { attendance, loading: attendanceLoading, saving, error } = useAppSelector(state => state.attendance);

	const [loading, setLoading] = useState(false);
	const [batchEvents, setBatchEvents] = useState<TrainingBatchEvent[]>([]);
	const [dailyPlan, setDailyPlan] = useState<TrainingBatchPlan[]>([]);
	const [activeTab, setActiveTab] = useState<'tracker' | 'report'>('tracker');

	// Calculate batch boundaries
	const batchBounds = useMemo(() => {
		const startStr = batch.start_date || batch.duration?.start_date;
		const endStr = batch.approx_close_date || batch.duration?.end_date;

		if (!startStr || !endStr) return null;

		return {
			start: startOfDay(parseISO(startStr)),
			end: startOfDay(parseISO(endStr))
		};
	}, [batch]);

	const [selectedDate, setSelectedDate] = useState<Date>(() => {
		const today = startOfDay(new Date());
		if (batchBounds) {
			if (today < batchBounds.start) return batchBounds.start;
			if (today > batchBounds.end) return batchBounds.end;
		}
		return today;
	});

	// Check if selected date is in the future
	const isFutureDate = useMemo(() => {
		const today = startOfDay(new Date());
		return selectedDate > today;
	}, [selectedDate]);

	// Check if a candidate is dropped out
	const isDroppedOut = useCallback((candidateId: number) => {
		const allocation = allocations.find(a => a.candidate_id === candidateId);
		return allocation?.is_dropout === true;
	}, [allocations]);

	const canMarkAttendance = useCallback((candidateId: number) => {
		const allocation = allocations.find(a => a.candidate_id === candidateId);
		// Cannot mark if dropped out or moved to placement
		if (allocation?.is_dropout || allocation?.status === 'moved_to_placement') return false;
		return allocation?.status === 'in_training';
	}, [allocations]);

	// Fetch attendance and events data
	const fetchData = useCallback(async () => {
		setLoading(true);
		try {
			// Fetch attendance via Redux
			dispatch(fetchAttendanceByBatch(batch.id));

			const eventData = await trainingExtensionService.getBatchEvents(batch.id);
			setBatchEvents(eventData);
		} catch (error) {
			console.error('Failed to fetch attendance data', error);
			toast.error('Failed to load attendance records');
		} finally {
			setLoading(false);
		}
	}, [batch.id, dispatch]);

	// Fetch daily plan when date changes
	const fetchDailyPlan = useCallback(async () => {
		if (!batch.public_id) return;

		try {
			const dateStr = format(selectedDate, 'yyyy-MM-dd');
			const plans = await trainingExtensionService.getDailyPlan(batch.public_id, dateStr);
			setDailyPlan(plans);
		} catch (error) {
			console.error('Failed to fetch daily plan', error);
			setDailyPlan([]);
		}
	}, [batch.public_id, selectedDate]);

	useEffect(() => {
		if (batch.id) {
			fetchData();
		}
	}, [batch.id, fetchData]);

	useEffect(() => {
		fetchDailyPlan();
	}, [fetchDailyPlan]);

	useEffect(() => {
		if (error) {
			toast.error(error);
		}
	}, [error]);

	const currentEvent = useMemo(() => {
		const dateStr = format(selectedDate, 'yyyy-MM-dd');
		return batchEvents.find(e => e.date === dateStr);
	}, [selectedDate, batchEvents]);

	// Update attendance state for a specific period
	const updatePeriodAttendance = useCallback((
		candidateId: number,
		periodId: number | null,
		data: Partial<TrainingAttendance>
	) => {
		const dateStr = format(selectedDate, 'yyyy-MM-dd');

		const existing = attendance.find(a =>
			a.candidate_id === candidateId &&
			a.date === dateStr &&
			a.period_id === periodId
		);

		const updatedData = existing
			? { ...existing, ...data }
			: {
				batch_id: batch.id,
				candidate_id: candidateId,
				date: dateStr,
				period_id: periodId,
				status: (data.status || 'present') as any,
				remarks: null,
				trainer_notes: null,
				...data
			} as TrainingAttendance;

		dispatch(updateLocalAttendance(updatedData));
	}, [selectedDate, batch.id, attendance, dispatch]);

	// Helper to check if user can edit a specific period
	const checkCanEditPeriod = useCallback((periodId: number) => {
		if (user?.is_superuser || user?.role === 'admin' || user?.role === 'manager') return true;

		const period = dailyPlan.find(p => p.id === periodId);
		if (!period) return false;

		// Primary: match by user ID
		if (period.trainer_user_id && user?.id && period.trainer_user_id === user.id) return true;

		// Fallback: match by name
		if (user?.full_name && period.trainer && user.full_name === period.trainer) return true;

		// Also check public_id
		if (period.trainer_user?.public_id && user?.public_id && period.trainer_user.public_id === user.public_id) return true;

		return false;
	}, [user, dailyPlan]);

	// Handle period-specific status change
	const handlePeriodStatusChange = useCallback((
		candidateId: number,
		periodId: number,
		status: string
	) => {
		if (isDroppedOut(candidateId)) {
			toast.warning('Cannot mark attendance for dropped out candidates');
			return;
		}
		if (isFutureDate) {
			toast.warning('Cannot mark attendance for future dates');
			return;
		}

		if (!canMarkAttendance(candidateId)) {
			const allocation = allocations.find(a => a.candidate_id === candidateId);
			toast.warning(`Attendance can only be marked for candidates who are 'In Training'. Current status: ${allocation?.status || 'Unknown'}`);
			return;
		}

		if (!checkCanEditPeriod(periodId)) {
			toast.error('You are not authorized to mark attendance for this period');
			return;
		}

		updatePeriodAttendance(candidateId, periodId, { status: status as any });
	}, [updatePeriodAttendance, isDroppedOut, isFutureDate, checkCanEditPeriod]);

	// Handle trainer notes change
	const handleTrainerNotesChange = useCallback((
		candidateId: number,
		periodId: number,
		notes: string
	) => {
		updatePeriodAttendance(candidateId, periodId, { trainer_notes: notes });
	}, [updatePeriodAttendance]);

	// Handle status change (for full-day attendance)
	const handleStatusChange = useCallback((candidateId: number, status: string) => {
		if (isDroppedOut(candidateId)) {
			toast.warning('Cannot mark attendance for dropped out candidates');
			return;
		}
		if (isFutureDate) {
			toast.warning('Cannot mark attendance for future dates');
			return;
		}

		if (!canMarkAttendance(candidateId)) {
			const allocation = allocations.find(a => a.candidate_id === candidateId);
			toast.warning(`Attendance can only be marked for candidates who are 'In Training'. Current status: ${allocation?.status || 'Unknown'}`);
			return;
		}

		updatePeriodAttendance(candidateId, null, { status: status as any });
	}, [updatePeriodAttendance, isDroppedOut, isFutureDate]);

	// Mark all candidates for a specific period as a specific status
	const handlePeriodMarkAll = useCallback((periodId: number, status: string) => {
		if (isFutureDate) {
			toast.warning('Cannot mark attendance for future dates');
			return;
		}

		if (!checkCanEditPeriod(periodId)) {
			toast.error('You are not authorized to mark all for this period');
			return;
		}

		allocations.forEach(allocation => {
			if (!isDroppedOut(allocation.candidate_id) && allocation.status !== 'moved_to_placement') {
				updatePeriodAttendance(allocation.candidate_id, periodId, { status: status as any });
			}
		});
		toast.info(`All candidates marked as ${status} for this period`);
	}, [allocations, updatePeriodAttendance, isDroppedOut, isFutureDate, checkCanEditPeriod]);

	const handleRemarkChange = useCallback((candidateId: number, remark: string) => {
		updatePeriodAttendance(candidateId, null, { remarks: remark });
	}, [updatePeriodAttendance]);

	const handleSave = async () => {
		if (isFutureDate) {
			toast.error('Cannot save attendance for future dates');
			return;
		}

		try {
			const dateStr = format(selectedDate, 'yyyy-MM-dd');

			// Collect only eligible attendance records for the selected date
			const dailyAttendance = attendance.filter(a => {
				const isDateMatch = a.date === dateStr;
				if (!isDateMatch) return false;
				
				// Only include if candidate is eligible to have attendance records updated
				return canMarkAttendance(a.candidate_id);
			});

			await dispatch(updateBulkAttendance(dailyAttendance)).unwrap();
			toast.success('Attendance saved successfully');
			fetchData();
		} catch (error: any) {
			console.error('Failed to save attendance', error);
			toast.error(error || 'Failed to save attendance');
		}
	};

	const handleUpdateSingle = async (attendanceId: number, data: Partial<TrainingAttendance>) => {
		try {
			await dispatch(updateAttendanceAction({ attendanceId, data })).unwrap();
			toast.success('Attendance updated successfully');
		} catch (error: any) {
			toast.error(error || 'Failed to update attendance');
		}
	};

	const handleDeleteSingle = async (attendanceId: number) => {
		try {
			await dispatch(deleteAttendanceAction(attendanceId)).unwrap();
			toast.success('Attendance record deleted successfully');
		} catch (error: any) {
			toast.error(error || 'Failed to delete attendance');
		}
	};

	const isDateOutOfRange = useMemo(() => {
		if (!batchBounds) return false;
		return !isWithinInterval(selectedDate, batchBounds);
	}, [selectedDate, batchBounds]);

	return {
		loading: loading || attendanceLoading,
		saving,
		attendance,
		batchEvents,
		dailyPlan,
		selectedDate,
		activeTab,
		currentEvent,
		isDateOutOfRange,
		isFutureDate,
		batchBounds,
		setSelectedDate,
		setActiveTab,
		handleStatusChange,
		handleRemarkChange,
		handlePeriodStatusChange,
		handleTrainerNotesChange,
		handlePeriodMarkAll,
		handleSave,
		handleUpdateSingle,
		handleDeleteSingle,
		isDroppedOut
	};
};
