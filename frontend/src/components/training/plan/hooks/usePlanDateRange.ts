import { useState, useMemo, useCallback, useEffect } from 'react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from 'date-fns';
import type { TrainingBatch, TrainingBatchPlan } from '../../../../models/training';

export const usePlanDateRange = (selectedBatch: TrainingBatch, weeklyPlan: TrainingBatchPlan[]) => {
	const { minDate, maxDate } = useMemo(() => {
		const start = selectedBatch?.start_date ? parseISO(selectedBatch.start_date) : new Date();
		const end = selectedBatch?.approx_close_date ? parseISO(selectedBatch.approx_close_date) : addDays(start, 90);
		return { minDate: start, maxDate: end };
	}, [selectedBatch]);

	const [currentDate, setCurrentDate] = useState(() => {
		if (selectedBatch?.start_date) return parseISO(selectedBatch.start_date);
		return new Date();
	});

	useEffect(() => {
		if (selectedBatch?.start_date) {
			setCurrentDate(parseISO(selectedBatch.start_date));
		}
	}, [selectedBatch?.public_id]);

	const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
	const weekEnd = useMemo(() => endOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);

	const weekDays = useMemo(() => {
		const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
		const weekdayRange = days.slice(0, 5);
		const saturday = days[5];
		const sunday = days[6];

		const hasSaturdayEntries = weeklyPlan.some(p => p.date === format(saturday, 'yyyy-MM-dd'));
		const hasSundayEntries = weeklyPlan.some(p => p.date === format(sunday, 'yyyy-MM-dd'));

		if (hasSaturdayEntries && hasSundayEntries) return days;
		if (hasSaturdayEntries) return days.slice(0, 6);
		if (hasSundayEntries) return [...weekdayRange, sunday];

		return weekdayRange;
	}, [weekStart, weekEnd, weeklyPlan]);

	const weekNumber = useMemo(() => {
		if (!selectedBatch?.start_date) return 1;
		const batchStart = startOfWeek(parseISO(selectedBatch.start_date), { weekStartsOn: 1 });
		const diffDays = Math.floor((weekStart.getTime() - batchStart.getTime()) / (1000 * 60 * 60 * 24));
		return Math.floor(diffDays / 7) + 1;
	}, [weekStart, selectedBatch?.start_date]);

	const handlePrevWeek = useCallback(() => {
		const prevWeek = addDays(currentDate, -7);
		if (prevWeek >= startOfWeek(minDate, { weekStartsOn: 1 })) {
			setCurrentDate(prevWeek);
		}
	}, [currentDate, minDate]);

	const handleNextWeek = useCallback(() => {
		const nextWeek = addDays(currentDate, 7);
		if (nextWeek <= endOfWeek(maxDate, { weekStartsOn: 1 })) {
			setCurrentDate(nextWeek);
		}
	}, [currentDate, maxDate]);

	const canGoPrev = currentDate > startOfWeek(minDate, { weekStartsOn: 1 });
	const canGoNext = currentDate < startOfWeek(maxDate, { weekStartsOn: 1 });

	return {
		currentDate,
		setCurrentDate,
		weekStart,
		weekEnd,
		weekDays,
		weekNumber,
		minDate,
		maxDate,
		handlePrevWeek,
		handleNextWeek,
		canGoPrev,
		canGoNext
	};
};
