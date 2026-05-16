import { useState } from 'react';
import type { TrainingBatch } from '../../../../models/training';
import { usePlanDateRange } from './usePlanDateRange';
import { usePlanState } from './usePlanState';
import { usePlanActions } from './usePlanActions';
import { usePlanCopy } from './usePlanCopy';
import { usePlanEvents } from './usePlanEvents';
import { usePlanMetrics } from './usePlanMetrics';

export const useWeeklyPlanManager = (selectedBatch: TrainingBatch) => {
	// UI States that aren't tied to a specific hook
	const [activeTab, setActiveTab] = useState(0);

	// 1. Hook for Dates and Calendar navigation
	// We need any arbitrary plan to check for Sat/Sun, but we'll refine this in Composition
	// Temporary pass empty array for initialization in hook
	const dateRange = usePlanDateRange(selectedBatch, []);

	// 2. Hook for Redux State & Daily Grouping
	const planState = usePlanState(
		selectedBatch, 
		dateRange.weekStart, 
		activeTab, 
		dateRange.weekDays
	);

	// 3. Hook for CRUD Actions
	const planActions = usePlanActions(
		planState.dispatch,
		planState.canEdit,
		planState.dailyPlans,
		planState.weeklyPlan
	);

	// 4. Hook for Holidays/Events
	const planEvents = usePlanEvents(selectedBatch);

	// 5. Hook for Copy logic
	const planCopy = usePlanCopy(
		planState.dispatch,
		planState.canEdit,
		selectedBatch,
		dateRange.maxDate,
		dateRange.weekStart,
		planState.weeklyPlan,
		planEvents.batchEvents,
		planActions.setFormLoading
	);

	// 6. Hook for Metrics
	const planMetrics = usePlanMetrics(
		planState.weeklyPlan,
		planState.allPlans,
		activeTab
	);

	// Final composition of everything to match the original API
	return {
		// State
		weeklyPlan: planState.weeklyPlan,
		weekDays: dateRange.weekDays,
		weekStart: dateRange.weekStart,
		weekNumber: dateRange.weekNumber,
		currentDate: dateRange.currentDate,
		setCurrentDate: dateRange.setCurrentDate,
		minDate: dateRange.minDate,
		maxDate: dateRange.maxDate,
		canGoPrev: dateRange.canGoPrev,
		canGoNext: dateRange.canGoNext,
		handlePrevWeek: dateRange.handlePrevWeek,
		handleNextWeek: dateRange.handleNextWeek,
		dailyPlans: planState.dailyPlans,
		maxPeriods: planState.maxPeriods,
		
		// Actions UI
		dialogOpen: planActions.dialogOpen,
		setDialogOpen: planActions.setDialogOpen,
		selectedEntry: planActions.selectedEntry,
		setSelectedEntry: planActions.setSelectedEntry,
		formLoading: planActions.formLoading,
		setFormLoading: planActions.setFormLoading,
		formErrors: planActions.formErrors,
		setFormErrors: planActions.setFormErrors,
		confirmDialog: planActions.confirmDialog,
		setConfirmDialog: planActions.setConfirmDialog,
		canEdit: planState.canEdit,
		
		// Handlers
		handleOpenDialog: planActions.handleOpenDialog,
		handleEditEntry: planActions.handleEditEntry,
		handleReplicateEntry: planCopy.handleReplicateEntry,
		handleDeleteClick: planActions.handleDeleteClick,
		validatePlan: planActions.validatePlan,
		
		// Extension Features
		activeTab,
		setActiveTab,
		hoursBreakdown: planMetrics.hoursBreakdown,
		batchEvents: planEvents.batchEvents,
		handleConfirmEvent: planEvents.handleConfirmEvent,
		handleDeleteEvent: planEvents.handleDeleteEvent,
		handleCopyPreviousWeek: planCopy.handleCopyPreviousWeek,
		handleCopyDay: planCopy.handleCopyDay
	};
};
