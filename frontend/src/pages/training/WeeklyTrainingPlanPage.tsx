import React, { useState, useRef } from 'react';
import { Box, Tabs, Tab, useTheme, alpha } from '@mui/material';
import { format } from 'date-fns';
import { toPng } from 'html-to-image';
import { saveAs } from 'file-saver';
import TrainingModuleLayout from '../../components/training/layout/TrainingModuleLayout';
import type { TrainingBatch } from '../../models/training';
import { useWeeklyPlanManager } from '../../components/training/plan/hooks/useWeeklyPlanManager';
import WeeklyPlanHeader from '../../components/training/plan/table/WeeklyPlanHeader';
import WeeklyPlanTable from '../../components/training/plan/table/WeeklyPlanTable';
import PlanEntryDialog from '../../components/training/plan/dialogs/PlanEntryDialog';
import WeeklyPlanStats from '../../components/training/plan/stats/WeeklyPlanStats';

import { ConfirmationDialog } from '../../components/common/dialogbox';
import BatchEventDialog from '../../components/training/plan/dialogs/BatchEventDialog';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { syncBatchWithProject } from '../../store/slices/trainingPlanSlice';
import useToast from '../../hooks/useToast';

interface WeeklyPlanManagerProps {
	selectedBatch: TrainingBatch;
}

const WeeklyPlanManager: React.FC<WeeklyPlanManagerProps> = ({ selectedBatch }) => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const { loading: sliceLoading } = useAppSelector(state => state.trainingPlan);
	const {
		weekDays,
		weekStart,
		weekNumber,
		currentDate,
		setCurrentDate,
		minDate,
		maxDate,
		canGoPrev,
		canGoNext,
		handlePrevWeek,
		handleNextWeek,
		dailyPlans,
		maxPeriods,
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
		canEdit,
		handleOpenDialog,
		handleEditEntry,
		handleReplicateEntry,
		handleDeleteClick,
		validatePlan,
		activeTab,
		setActiveTab,
		hoursBreakdown,
		batchEvents,
		handleConfirmEvent,
		handleDeleteEvent,
		handleCopyPreviousWeek,
		handleCopyDay
	} = useWeeklyPlanManager(selectedBatch);

	const [eventDialogOpen, setEventDialogOpen] = useState(false);
	const [eventTargetDate, setEventTargetDate] = useState<Date | null>(null);

	const handleOpenEventDialog = (date: Date) => {
		setEventTargetDate(date);
		setEventDialogOpen(true);
	};

	const tableRef = useRef<HTMLDivElement>(null);
	const [isExporting, setIsExporting] = useState(false);

	const theme = useTheme();
	const handleExportPNG = async () => {
		if (tableRef.current) {
			setIsExporting(true);
			// Wait a bit for the UI to update and icons to hide
			await new Promise(resolve => setTimeout(resolve, 100));
			try {
				const dataUrl = await toPng(tableRef.current, {
					backgroundColor: theme.palette.background.paper,
					style: {
						padding: '24px'
					}
				});
				const fileName = `weekly-plan-${selectedBatch.batch_name}-${format(weekStart, 'yyyy-MM-dd')}.png`;
				saveAs(dataUrl, fileName);
			} catch (error) {
				toast.error('Failed to export PNG');
			} finally {
				setIsExporting(false);
			}
		}
	};

	const handleSync = async () => {
		try {
			await dispatch(syncBatchWithProject(selectedBatch.public_id)).unwrap();
			toast.success('Batch synchronized with project successfully');
		} catch (err: any) {
			toast.error(err || 'Failed to sync batch');
		}
	};

	return (
		<Box>
			<Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4, bgcolor: 'background.paper', borderRadius: '8px 8px 0 0' }}>
				<Tabs 
					value={activeTab} 
					onChange={(_e, newValue) => setActiveTab(newValue)}
					indicatorColor="primary"
					textColor="primary"
					sx={{
						'& .MuiTab-root': {
							fontWeight: 700,
							textTransform: 'none',
							fontSize: '0.95rem',
							minHeight: 56,
							px: 4,
							color: 'text.secondary',
							transition: 'all 0.2s',
							'&.Mui-selected': {
								color: 'primary.main',
							},
							'&:hover': {
								color: 'primary.main',
								bgcolor: alpha(theme.palette.primary.main, 0.04),
							}
						},
					}}
				>
					<Tab label="Weekly Schedule" />
					<Tab label="Performance Insights" />
				</Tabs>
			</Box>

			{activeTab === 0 ? (
				<>
					<WeeklyPlanHeader
						weekNumber={weekNumber}
						weekStart={weekStart}
						weekDays={weekDays}
						canGoPrev={canGoPrev}
						canGoNext={canGoNext}
						handlePrevWeek={handlePrevWeek}
						handleNextWeek={handleNextWeek}
						minDate={minDate}
						currentDate={currentDate}
						setCurrentDate={setCurrentDate}
						canEdit={canEdit}
						onExportPNG={handleExportPNG}
						handleCopyPreviousWeek={handleCopyPreviousWeek}
						onSync={handleSync}
						loading={sliceLoading}
						isExporting={isExporting}
					/>
					<WeeklyPlanTable
						weekDays={weekDays}
						maxPeriods={maxPeriods}
						dailyPlans={dailyPlans}
						minDate={minDate}
						maxDate={maxDate}
						canEdit={canEdit}
						handleOpenDialog={handleOpenDialog}
						handleEditEntry={handleEditEntry}
						handleDeleteEntry={handleDeleteClick}
						handleReplicateEntry={handleReplicateEntry}
						batchEvents={batchEvents}
						handleOpenEventDialog={handleOpenEventDialog}
						handleDeleteEvent={handleDeleteEvent}
						handleCopyDay={handleCopyDay}
						tableRef={tableRef}
						isExporting={isExporting}
						batchName={selectedBatch.batch_name}
						weekNumber={weekNumber}
						weekStart={weekStart}
					/>
				</>
			) : (
				<WeeklyPlanStats hoursBreakdown={hoursBreakdown} />
			)}

			<PlanEntryDialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				selectedEntry={selectedEntry}
				setSelectedEntry={setSelectedEntry}
				formLoading={formLoading}
				setFormLoading={setFormLoading}
				selectedBatch={selectedBatch}
				formErrors={formErrors}
				setFormErrors={setFormErrors}
				validatePlan={validatePlan}
			/>

			<BatchEventDialog
				open={eventDialogOpen}
				onClose={() => setEventDialogOpen(false)}
				onConfirm={async (data) => {
					const success = await handleConfirmEvent({
						...data,
						date: eventTargetDate ? format(eventTargetDate, 'yyyy-MM-dd') : ''
					});
					if (success) setEventDialogOpen(false);
				}}
				selectedDate={eventTargetDate || new Date()}
			/>

			<ConfirmationDialog
				open={confirmDialog.open}
				title={confirmDialog.title}
				message={confirmDialog.message}
				onConfirm={confirmDialog.onConfirm}
				onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
				loading={confirmDialog.loading}
				severity="error"
				confirmLabel="Delete"
			/>
		</Box>
	);
};

const WeeklyTrainingPlanPage: React.FC = () => {
	return (
		<TrainingModuleLayout
			title="Weekly Training Plan"
			subtitle="Design and manage structured learning journeys with precision scheduling."
		>
			{({ selectedBatch }) => (
				selectedBatch ? (
					<WeeklyPlanManager selectedBatch={selectedBatch} />
				) : null
			)}
		</TrainingModuleLayout>
	);
};

export default WeeklyTrainingPlanPage;
