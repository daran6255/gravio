import React, { useMemo } from 'react';
import {
	Box,
	CircularProgress,
	Grid,
	Alert,
	Paper,
	Typography,
	Tabs,
	Tab,
	alpha,
	useTheme
} from '@mui/material';
import {
	CheckCircle as PresentIcon,
	Cancel as AbsentIcon,
	AccessTime as LateIcon,
	Contrast as HalfDayIcon,
	EventBusy as HolidayIcon,
	EventAvailable as EventIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store/store';
import type { TrainingBatch, CandidateAllocation } from '../../../models/training';
import { useAttendance } from './hooks/useAttendance';

// Sub-components
import AttendanceHeader from './header/AttendanceHeader';
import AttendanceTable from './table/AttendanceTable';
import AttendanceLegend from './table/AttendanceLegend';

import AttendanceReport from './report/AttendanceReport';

interface AttendanceTrackerProps {
	batch: TrainingBatch;
	allocations: CandidateAllocation[];
}

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({ batch, allocations }) => {
	const theme = useTheme();
	const currentUser = useSelector((state: RootState) => state.auth.user);

	// Define statuses inside to access theme
	const ATTENDANCE_STATUSES = useMemo(() => [
		{ value: 'present', label: 'Present', icon: <PresentIcon sx={{ color: 'success.main' }} />, color: theme.palette.success.main },
		{ value: 'absent', label: 'Absent', icon: <AbsentIcon sx={{ color: 'error.main' }} />, color: theme.palette.error.main },
		{ value: 'late', label: 'Late', icon: <LateIcon sx={{ color: 'warning.main' }} />, color: theme.palette.warning.main },
		{ value: 'half_day', label: 'Half Day', icon: <HalfDayIcon sx={{ color: 'info.main' }} />, color: theme.palette.info.main },
	], [theme]);

	// Filter allocations to exclude 'allocated' status candidates as they haven't started training yet
	const filteredAllocations = useMemo(() => {
		return allocations.filter(a => a.status !== 'allocated');
	}, [allocations]);

	const {
		loading,
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
		handlePeriodMarkAll,
		handleTrainerNotesChange,
		handleSave,
		isDroppedOut
	} = useAttendance(batch, filteredAllocations, currentUser);

	if (loading) {
		return (
			<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, gap: 2 }}>
				<CircularProgress thickness={4} size={48} />
				<Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.05em' }}>
					LOADING ATTENDANCE DATA...
				</Typography>
			</Box>
		);
	}

	return (
		<Box>
			<Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
				<Tabs
					value={activeTab}
					onChange={(_, v) => setActiveTab(v)}
					sx={{
						minHeight: 48,
						'& .MuiTab-root': {
							textTransform: 'none',
							fontWeight: 700,
							fontSize: '0.875rem',
							minHeight: 48,
							color: 'text.secondary',
							px: 4,
							transition: 'all 0.2s',
							'&.Mui-selected': { color: 'primary.main' },
							'&:hover': { color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.04) }
						},
						'& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' }
					}}
				>
					<Tab label="Attendance Tool" value="tracker" />
					<Tab label="Consolidated Report" value="report" />
				</Tabs>
			</Box>

			{activeTab === 'tracker' ? (
				<Box sx={{ px: isDateOutOfRange ? 0 : 0.5 }}>
					{isDateOutOfRange && (
						<Alert
							severity="warning"
							sx={{
								mb: 4,
								borderRadius: 2,
								border: '1px solid',
								borderColor: alpha(theme.palette.warning.main, 0.2),
								'& .MuiAlert-message': { fontWeight: 500 }
							}}
						>
							The selected date ({format(selectedDate, 'MMM dd, yyyy')}) is outside the training batch duration
							({batch.start_date || batch.duration?.start_date} to {batch.approx_close_date || batch.duration?.end_date}).
							Attendance tracking is restricted to the scheduled batch period.
						</Alert>
					)}

					{isFutureDate && (
						<Alert
							severity="error"
							sx={{
								mb: 4,
								borderRadius: 2,
								border: '1px solid',
								borderColor: alpha(theme.palette.error.main, 0.2),
								'& .MuiAlert-message': { fontWeight: 500 }
							}}
						>
							Cannot mark attendance for future dates. Please select today or a past date.
						</Alert>
					)}

					<Grid container spacing={4}>
						<Grid size={{ xs: 12 }}>
							<AttendanceHeader
								selectedDate={selectedDate}
								onDateChange={setSelectedDate}
								batchBounds={batchBounds}
								currentEvent={currentEvent}
								onSave={handleSave}
								saving={saving}
								isDateOutOfRange={isDateOutOfRange}
								isFutureDate={isFutureDate}
								hasNoPlan={dailyPlan.length === 0}
							/>
						</Grid>

						<Grid size={{ xs: 12, lg: 9 }}>
							{currentEvent && (
								<Box sx={{ mb: 4 }}>
									<Paper
										elevation={0}
										sx={{
											p: 4,
											textAlign: 'center',
											bgcolor: currentEvent.event_type === 'holiday'
												? alpha(theme.palette.error.main, 0.04)
												: alpha(theme.palette.info.main, 0.04),
											border: '1px solid',
											borderColor: currentEvent.event_type === 'holiday'
												? alpha(theme.palette.error.main, 0.2)
												: alpha(theme.palette.info.main, 0.2),
											borderRadius: 2
										}}
									>
										{currentEvent.event_type === 'holiday' ? (
											<HolidayIcon sx={{ fontSize: 56, color: 'error.main', mb: 2 }} />
										) : (
											<EventIcon sx={{ fontSize: 56, color: 'info.main', mb: 2 }} />
										)}
										<Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
											{currentEvent.title}
										</Typography>
										<Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 600, mx: 'auto' }}>
											{currentEvent.description || `This date has been marked as a ${currentEvent.event_type}.`}
										</Typography>
									</Paper>
								</Box>
							)}

							{dailyPlan.length === 0 && !currentEvent && (
								<Alert
									severity="info"
									sx={{
										mb: 4,
										borderRadius: 2,
										border: '1px solid',
										borderColor: alpha(theme.palette.info.main, 0.2)
									}}
								>
									No training plan configured for this date. You can still mark full-day attendance.
								</Alert>
							)}

							<AttendanceTable
								allocations={filteredAllocations}
								selectedDate={selectedDate}
								attendance={attendance}
								dailyPlan={dailyPlan}
								onStatusChange={handleStatusChange}
								onRemarkChange={handleRemarkChange}
								onPeriodStatusChange={handlePeriodStatusChange}
								onTrainerNotesChange={handleTrainerNotesChange}
								onPeriodMarkAll={handlePeriodMarkAll}
								currentEvent={currentEvent}
								isDateOutOfRange={isDateOutOfRange}
								isFutureDate={isFutureDate}
								isDroppedOut={isDroppedOut}
								statuses={ATTENDANCE_STATUSES}
								currentUser={currentUser}
							/>
						</Grid>

						<Grid size={{ xs: 12, lg: 3 }}>
							<AttendanceLegend
								attendance={attendance}
								selectedDate={selectedDate}
								statuses={ATTENDANCE_STATUSES}
							/>
						</Grid>
					</Grid>
				</Box>
			) : (
				<AttendanceReport
					attendance={attendance}
					allocations={filteredAllocations}
					batch={batch}
					batchEvents={batchEvents}
				/>
			)}
		</Box>
	);
};

export default AttendanceTracker;
