import { useMemo, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { format } from 'date-fns';
import { fetchWeeklyPlan, fetchAllBatchPlans, resetWeeklyPlan } from '../../../../store/slices/trainingPlanSlice';
import { fetchUsers } from '../../../../store/slices/userSlice';
import type { RootState } from '../../../../store/store';
import type { TrainingBatch, TrainingBatchPlan } from '../../../../models/training';

export const usePlanState = (selectedBatch: TrainingBatch, weekStart: Date, activeTab: number, weekDays: Date[]) => {
	const dispatch = useAppDispatch();
	const { weeklyPlan, allPlans } = useAppSelector((state: RootState) => state.trainingPlan);
	const { user } = useAppSelector((state: RootState) => state.auth);

	useEffect(() => {
		dispatch(fetchUsers({ limit: 200 }));
	}, [dispatch]);

	useEffect(() => {
		if (selectedBatch?.public_id) {
			dispatch(resetWeeklyPlan());
			dispatch(fetchWeeklyPlan({
				batchPublicId: selectedBatch.public_id,
				startDate: format(weekStart, 'yyyy-MM-dd')
			}));
		}
	}, [weekStart, selectedBatch?.public_id, dispatch]);

	useEffect(() => {
		if (selectedBatch?.public_id && activeTab === 1) {
			dispatch(fetchAllBatchPlans(selectedBatch.public_id));
		}
	}, [activeTab, selectedBatch?.public_id, dispatch]);

	const dailyPlans = useMemo(() => {
		const groups: Record<string, TrainingBatchPlan[]> = {};
		weekDays.forEach(day => {
			const dateStr = format(day, 'yyyy-MM-dd');
			groups[dateStr] = weeklyPlan
				.filter((p: TrainingBatchPlan) => p.date === dateStr)
				.sort((a, b) => a.start_time.localeCompare(b.start_time));
		});
		return groups;
	}, [weeklyPlan, weekDays]);

	const maxPeriods = useMemo(() => {
		const counts = Object.values(dailyPlans).map(entries => entries.length);
		return Math.max(...counts, 0) + 1;
	}, [dailyPlans]);

	const canEdit = useMemo(() => {
		return user?.role === 'admin' || user?.role === 'manager';
	}, [user]);

	return {
		weeklyPlan,
		allPlans,
		dailyPlans,
		maxPeriods,
		canEdit,
		dispatch
	};
};
