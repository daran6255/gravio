import { useMemo } from 'react';
import { parseTimeValue } from '../utils/planFormatters';
import type { TrainingBatchPlan } from '../../../../models/training';

export const usePlanMetrics = (weeklyPlan: TrainingBatchPlan[], allPlans: TrainingBatchPlan[], activeTab: number) => {
	const hoursBreakdown = useMemo(() => {
		const breakdown = {
			course: 0,
			hr_session: 0,
			mock_interview: 0,
			training_total: 0,
			unassigned_total: 0,
			break: 0,
			total: 0,
			details: {
				course: {} as Record<string, number>,
				hr_session: {} as Record<string, number>,
				mock_interview: {} as Record<string, number>,
				trainer: {} as Record<string, { total: number; sessions: Record<string, { hours: number; type: string }> }>,
				unassigned: {} as Record<string, { hours: number; type: string }>
			}
		};

		const plansToProcess = activeTab === 1 ? allPlans : weeklyPlan;

		plansToProcess.forEach(entry => {
			const duration = parseTimeValue(entry.end_time) - parseTimeValue(entry.start_time);

			if (entry.activity_type === 'course') breakdown.course += duration;
			if (entry.activity_type === 'hr_session') breakdown.hr_session += duration;
			if (entry.activity_type === 'mock_interview') breakdown.mock_interview += duration;
			if (entry.activity_type === 'break') breakdown.break += duration;

			if (entry.activity_type !== 'break') {
				const isCoreTraining = ['course', 'hr_session', 'mock_interview'].includes(entry.activity_type);
				const type = entry.activity_type as 'course' | 'hr_session' | 'mock_interview';
				const trainerName = entry.trainer;

				if (isCoreTraining) {
					// Add to training totals regardless of trainer assignment
					breakdown.training_total += duration;

					// Add to specific type details
					if (breakdown.details[type]) {
						breakdown.details[type][entry.activity_name] = (breakdown.details[type][entry.activity_name] || 0) + duration;
					}

					// Add to trainer stats with detailed breakdown ONLY if trainer is assigned
					if (trainerName) {
						if (!breakdown.details.trainer[trainerName]) {
							breakdown.details.trainer[trainerName] = { total: 0, sessions: {} };
						}
						const trainerData = breakdown.details.trainer[trainerName];
						trainerData.total += duration;
						
						const currentSession = trainerData.sessions[entry.activity_name] || { hours: 0, type: entry.activity_type };
						trainerData.sessions[entry.activity_name] = {
							hours: currentSession.hours + duration,
							type: entry.activity_type
						};
					}
				} else {
					// 'other' or 'event' sessions
					breakdown.training_total += duration; // Add to grand total as requested
					breakdown.unassigned_total += duration;
					const current = breakdown.details.unassigned[entry.activity_name] || { hours: 0, type: entry.activity_type };
					breakdown.details.unassigned[entry.activity_name] = {
						hours: current.hours + duration,
						type: entry.activity_type
					};
				}
			}

			breakdown.total += duration;
		});

		return breakdown;
	}, [weeklyPlan, allPlans, activeTab]);

	return { hoursBreakdown };
};
