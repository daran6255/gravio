import { useCallback } from 'react';
import { format, addDays, parseISO } from 'date-fns';
import { createPlanEntry, fetchWeeklyPlan } from '../../../../store/slices/trainingPlanSlice';
import { useSnackbar } from 'notistack';
import trainingPlanService from '../../../../services/trainingPlanService';
import type { TrainingBatch, TrainingBatchPlan, TrainingBatchEvent } from '../../../../models/training';

export const usePlanCopy = (
	dispatch: any,
	canEdit: boolean,
	selectedBatch: TrainingBatch,
	maxDate: Date,
	weekStart: Date,
	weeklyPlan: TrainingBatchPlan[],
	batchEvents: TrainingBatchEvent[],
	setFormLoading: (v: boolean) => void
) => {
	const { enqueueSnackbar } = useSnackbar();

	const handleReplicateEntry = useCallback(async (entry: TrainingBatchPlan) => {
		if (!canEdit) return;
		let nextDay = addDays(parseISO(entry.date), 1);

		const dayOfWeek = nextDay.getDay();
		if (dayOfWeek === 6) {
			nextDay = addDays(nextDay, 2);
		} else if (dayOfWeek === 0) {
			nextDay = addDays(nextDay, 1);
		}

		if (nextDay > maxDate) {
			enqueueSnackbar('Cannot replicate beyond batch end date', { variant: 'warning' });
			return;
		}
		const nextDayStr = format(nextDay, 'yyyy-MM-dd');
		try {
			await dispatch(createPlanEntry({
				...entry,
				date: nextDayStr,
				batch_public_id: selectedBatch.public_id,
				public_id: undefined
			})).unwrap();
			enqueueSnackbar(`Replicated to ${format(nextDay, 'MMM d')}`, { variant: 'success' });
		} catch (error: any) {
			enqueueSnackbar(error || 'Failed to replicate entry', { variant: 'error' });
		}
	}, [canEdit, maxDate, dispatch, selectedBatch.public_id, enqueueSnackbar]);

	const handleCopyPreviousWeek = useCallback(async () => {
		if (!canEdit) return;
		const prevWeekStart = addDays(weekStart, -7);
		const prevWeekStartStr = format(prevWeekStart, 'yyyy-MM-dd');

		try {
			setFormLoading(true);
			const prevWeekPlans = await trainingPlanService.getWeeklyPlan(selectedBatch.public_id, prevWeekStartStr);

			if (prevWeekPlans.length === 0) {
				enqueueSnackbar('No plans found in the previous week', { variant: 'info' });
				return;
			}

			if (weeklyPlan.length > 0) {
				const confirm = window.confirm('Current week already has plans. This will add copied plans to existing ones. Continue?');
				if (!confirm) return;
			}

			const isHoliday = (d: Date) => {
				const dStr = format(d, 'yyyy-MM-dd');
				return batchEvents.some(e => e.date === dStr && e.event_type === 'holiday');
			};

			const prevWorkingDays: Date[] = [];
			for (let i = 0; i < 7; i++) {
				const d = addDays(prevWeekStart, i);
				if (!isHoliday(d)) prevWorkingDays.push(d);
			}

			const currWorkingDays: Date[] = [];
			for (let i = 0; i < 14; i++) {
				const d = addDays(weekStart, i);
				if (!isHoliday(d)) currWorkingDays.push(d);
			}

			const entriesByPrevDate: Record<string, TrainingBatchPlan[]> = {};
			prevWeekPlans.forEach(p => {
				if (!entriesByPrevDate[p.date]) entriesByPrevDate[p.date] = [];
				entriesByPrevDate[p.date].push(p);
			});

			let count = 0;
			prevWorkingDays.forEach((prevDate, idx) => {
				const prevDateStr = format(prevDate, 'yyyy-MM-dd');
				const dayPlans = entriesByPrevDate[prevDateStr];
				
				if (dayPlans && idx < currWorkingDays.length) {
					const targetDate = currWorkingDays[idx];
					const targetDateStr = format(targetDate, 'yyyy-MM-dd');
					
					if (targetDate <= maxDate) {
						for (const entry of dayPlans) {
							dispatch(createPlanEntry({
								...entry,
								date: targetDateStr,
								batch_public_id: selectedBatch.public_id,
								public_id: undefined
							}));
							count++;
						}
					}
				}
			});

			enqueueSnackbar(`Successfully copied ${count} entries based on working-day sequence`, { variant: 'success' });
			dispatch(fetchWeeklyPlan({
				batchPublicId: selectedBatch.public_id,
				startDate: format(weekStart, 'yyyy-MM-dd')
			}));
		} catch (error: any) {
			enqueueSnackbar(error || 'Failed to copy previous week', { variant: 'error' });
		} finally {
			setFormLoading(false);
		}
	}, [canEdit, weekStart, selectedBatch.public_id, weeklyPlan, maxDate, dispatch, enqueueSnackbar, batchEvents, setFormLoading]);

	const handleCopyDay = useCallback(async (sourceDate: Date) => {
		if (!canEdit) return;
		const sourceDateStr = format(sourceDate, 'yyyy-MM-dd');
		const sourcePlans = weeklyPlan.filter(p => p.date === sourceDateStr);

		if (sourcePlans.length === 0) {
			enqueueSnackbar('No entries found on this day to copy', { variant: 'info' });
			return;
		}

		let nextWorkingDay = addDays(sourceDate, 1);
		const isHoliday = (d: Date) => {
			const dStr = format(d, 'yyyy-MM-dd');
			return batchEvents.some(e => e.date === dStr && e.event_type === 'holiday');
		};

		while (isHoliday(nextWorkingDay)) {
			nextWorkingDay = addDays(nextWorkingDay, 1);
		}

		if (nextWorkingDay > maxDate) {
			enqueueSnackbar('Next working day is beyond batch end date', { variant: 'warning' });
			return;
		}

		try {
			setFormLoading(true);
			let count = 0;
			for (const entry of sourcePlans) {
				await dispatch(createPlanEntry({
					...entry,
					date: format(nextWorkingDay, 'yyyy-MM-dd'),
					batch_public_id: selectedBatch.public_id,
					public_id: undefined
				})).unwrap();
				count++;
			}
			enqueueSnackbar(`Successfully copied ${count} entries to ${format(nextWorkingDay, 'EEEE, MMM d')}`, { variant: 'success' });
		} catch (error: any) {
			enqueueSnackbar(error || 'Failed to copy day', { variant: 'error' });
		} finally {
			setFormLoading(false);
		}
	}, [canEdit, weeklyPlan, batchEvents, maxDate, selectedBatch.public_id, dispatch, enqueueSnackbar, setFormLoading]);

	return {
		handleReplicateEntry,
		handleCopyPreviousWeek,
		handleCopyDay
	};
};
