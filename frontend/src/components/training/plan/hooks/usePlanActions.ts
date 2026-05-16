import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { deletePlanEntry } from '../../../../store/slices/trainingPlanSlice';
import { useSnackbar } from 'notistack';
import { DEFAULT_START_TIME, HARD_END_TIME } from '../utils/planConstants';
import { parseTimeValue, formatTime12h } from '../utils/planFormatters';
import type { TrainingBatchPlan } from '../../../../models/training';

export const usePlanActions = (
	dispatch: any,
	canEdit: boolean,
	dailyPlans: Record<string, TrainingBatchPlan[]>,
	weeklyPlan: TrainingBatchPlan[]
) => {
	const { enqueueSnackbar } = useSnackbar();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedEntry, setSelectedEntry] = useState<Partial<TrainingBatchPlan> | null>(null);
	const [formLoading, setFormLoading] = useState(false);
	const [formErrors, setFormErrors] = useState<Record<string, string>>({});
	const [confirmDialog, setConfirmDialog] = useState({
		open: false,
		title: '',
		message: '',
		onConfirm: () => { },
		loading: false
	});

	const validatePlan = useCallback((entry: Partial<TrainingBatchPlan>) => {
		const errors: Record<string, string> = {};

		if (!entry.activity_type) errors.activity_type = 'Activity Type is required';
		if (!entry.activity_name) errors.activity_name = 'Activity Name is required';
		if (!entry.start_time) errors.start_time = 'Start Time is required';
		if (!entry.end_time) errors.end_time = 'End Time is required';

		if (['course', 'hr_session'].includes(entry.activity_type || '') && !entry.trainer) {
			errors.trainer = 'Trainer selection is required';
		}

		if (entry.activity_type === 'course') {
			const dayEntries = weeklyPlan.filter((p: TrainingBatchPlan) => p.date === entry.date && p.public_id !== entry.public_id);
			let totalHours = 0;
			if (entry.start_time && entry.end_time) {
				totalHours += parseTimeValue(entry.end_time) - parseTimeValue(entry.start_time);
			}
			dayEntries.forEach((p: TrainingBatchPlan) => {
				if (p.activity_type === 'course' && p.activity_name === entry.activity_name) {
					totalHours += parseTimeValue(p.end_time) - parseTimeValue(p.start_time);
				}
			});
			if (totalHours > 2.01) {
				errors.activity_name = `Course limit exceeded (Max 2h/day). Current: ${totalHours.toFixed(1)}h`;
			}
		}

		if (entry.start_time && entry.end_time && entry.start_time >= entry.end_time) {
			errors.end_time = 'End time must be after start time';
		}

		if (entry.end_time && entry.end_time > HARD_END_TIME) {
			errors.end_time = `Activities cannot end after ${formatTime12h(HARD_END_TIME)}`;
		}

		return Object.keys(errors).length > 0 ? errors : null;
	}, [weeklyPlan]);

	const handleOpenDialog = useCallback((date: Date) => {
		if (!canEdit) return;
		setFormErrors({});

		const dateStr = format(date, 'yyyy-MM-dd');
		const dayEntries = dailyPlans[dateStr] || [];
		let startTime = DEFAULT_START_TIME;
		if (dayEntries.length > 0) {
			startTime = dayEntries[dayEntries.length - 1].end_time.split(':').slice(0, 2).join(':');
		}

		if (startTime >= HARD_END_TIME) {
			enqueueSnackbar('Schedule is full for this day (ends at 5:30 PM)', { variant: 'info' });
			return;
		}

		let [h, m] = startTime.split(':').map(Number);
		let endH = h + 1;
		let endM = m;
		if (endH > 17 || (endH === 17 && endM > 30)) {
			endH = 17;
			endM = 30;
		}
		const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

		setSelectedEntry({
			date: dateStr,
			start_time: startTime,
			end_time: endTime,
			activity_type: 'course',
		});
		setDialogOpen(true);
	}, [canEdit, dailyPlans, enqueueSnackbar]);

	const handleEditEntry = useCallback((entry: TrainingBatchPlan) => {
		if (!canEdit) return;
		const normalizedEntry = {
			...entry,
			trainer_user_public_id: entry.trainer_user_public_id || entry.trainer_user?.public_id || null
		};
		setSelectedEntry(normalizedEntry);
		setDialogOpen(true);
	}, [canEdit]);

	const handleDeleteConfirm = async (publicId: string) => {
		setConfirmDialog(prev => ({ ...prev, loading: true }));
		try {
			await dispatch(deletePlanEntry(publicId)).unwrap();
			enqueueSnackbar('Entry deleted successfully', { variant: 'success' });
			setConfirmDialog(prev => ({ ...prev, open: false }));
		} catch (error: any) {
			enqueueSnackbar(error || 'Failed to delete entry', { variant: 'error' });
			setConfirmDialog(prev => ({ ...prev, loading: false }));
		}
	};

	const handleDeleteClick = useCallback((publicId: string) => {
		if (!canEdit) return;
		setConfirmDialog({
			open: true,
			title: 'Delete Plan Entry',
			message: 'Are you sure you want to delete this plan entry? This action cannot be undone.',
			onConfirm: () => handleDeleteConfirm(publicId),
			loading: false
		});
	}, [canEdit]);

	return {
		dialogOpen,
		setDialogOpen,
		selectedEntry,
		setSelectedEntry,
		formLoading,
		setFormLoading,
		formErrors,
		setFormErrors,
		confirmDialog,
		setConfirmDialog,
		handleOpenDialog,
		handleEditEntry,
		handleDeleteClick,
		validatePlan
	};
};
