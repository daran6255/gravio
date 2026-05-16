import React, { useState } from 'react';
import { Box, Paper, CircularProgress, Typography, Divider } from '@mui/material';
import type { TrainingBatch, CandidateAllocation } from '../../../models/training';
import { useAssignment } from './useAssignment';

// Sub-components
import AssignmentHeader from './AssignmentHeader';
import AssignmentConfigPanel from './AssignmentConfigPanel';
import AssignmentMatrix from './AssignmentMatrix';
import AssignmentFormDialog from './AssignmentFormDialog';

interface AssignmentTrackerProps {
	batch: TrainingBatch;
	allocations: CandidateAllocation[];
}

const AssignmentTracker: React.FC<AssignmentTrackerProps> = ({ batch, allocations }) => {
	const {
		loading,
		saving,
		assignments,
		trainers,
		activeAssignmentName,
		activeDate,
		activeMaxMarks,
		activeCourses,
		activeTrainerId,
		activeDescription,
		assignmentNames,
		stats,
		setActiveDate,
		setActiveCourses,
		setActiveTrainerId,
		setActiveMaxMarks,
		setActiveDescription,
		handleSelectAssignment,
		handleMarkChange,
		handleSave,
		handleDeleteAssignment,
		setActiveAssignmentName
	} = useAssignment(batch, allocations);

	const [dialogOpen, setDialogOpen] = useState(false);

	const handleCreateNew = () => {
		setActiveAssignmentName('');
		setActiveDescription('');
		setActiveCourses([]);
		setDialogOpen(true);
	};

	const handleDialogSubmit = (data: {
		assignmentName: string;
		courses: string[];
		description: string;
		date: string;
		maxMarks: number;
	}) => {
		setActiveAssignmentName(data.assignmentName);
		setActiveCourses(data.courses);
		setActiveDescription(data.description);
		setActiveDate(data.date);
		setActiveMaxMarks(data.maxMarks);
	};

	if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress thickness={2} size={40} /></Box>;

	return (
		<Box sx={{ p: 0 }}>
			{/* Stats Summary Strip */}
			<Paper
				elevation={0}
				sx={{
					p: 2,
					mb: 3,
					border: '1px solid #d5dbdb',
					borderRadius: '2px',
					bgcolor: 'white',
					display: 'flex',
					alignItems: 'center',
					gap: 6
				}}
			>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
					<Box sx={{ bgcolor: '#f1faff', p: 1, borderRadius: '50%' }}>
						<Box component="span" sx={{ display: 'block', width: 20, height: 20, bgcolor: '#007eb9', borderRadius: '4px' }} />
					</Box>
					<Box>
						<Typography variant="caption" sx={{ color: '#545b64', fontWeight: 600, display: 'block', textTransform: 'uppercase', fontSize: '0.65rem' }}>Total Assignments</Typography>
						<Typography variant="h6" sx={{ fontWeight: 800, color: '#232f3e', lineHeight: 1 }}>{stats.totalAssignments}</Typography>
					</Box>
				</Box>

				<Divider orientation="vertical" flexItem sx={{ borderColor: '#eaeded' }} />

				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
					<Box sx={{ bgcolor: '#ebf5e0', p: 1, borderRadius: '50%' }}>
						<Box component="span" sx={{ display: 'block', width: 20, height: 20, bgcolor: '#318400', borderRadius: '50%' }} />
					</Box>
					<Box>
						<Typography variant="caption" sx={{ color: '#545b64', fontWeight: 600, display: 'block', textTransform: 'uppercase', fontSize: '0.65rem' }}>Submitted</Typography>
						<Typography variant="h6" sx={{ fontWeight: 800, color: '#318400', lineHeight: 1 }}>{stats.submittedCount}</Typography>
					</Box>
				</Box>

				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
					<Box sx={{ bgcolor: '#fff3e0', p: 1, borderRadius: '50%' }}>
						<Box component="span" sx={{ display: 'block', width: 20, height: 20, bgcolor: '#c67200', borderRadius: '50%' }} />
					</Box>
					<Box>
						<Typography variant="caption" sx={{ color: '#545b64', fontWeight: 600, display: 'block', textTransform: 'uppercase', fontSize: '0.65rem' }}>Pending</Typography>
						<Typography variant="h6" sx={{ fontWeight: 800, color: '#c67200', lineHeight: 1 }}>{stats.pendingCount}</Typography>
					</Box>
				</Box>

				<Box sx={{ flexGrow: 1 }} />

				<Typography variant="caption" sx={{ color: '#879196', fontStyle: 'italic' }}>
					Showing stats for: <strong>{activeAssignmentName || 'New Assignment'}</strong>
				</Typography>
			</Paper>

			{/* Configuration Section */}
			<Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #d5dbdb', borderRadius: '2px', bgcolor: 'white' }}>
				<AssignmentHeader
					assignmentNames={assignmentNames}
					activeAssignmentName={activeAssignmentName}
					onSelectAssignment={handleSelectAssignment}
					onCreateNew={handleCreateNew}
					onSave={handleSave}
					onDelete={handleDeleteAssignment}
					saving={saving}
				/>

				{activeAssignmentName && (
					<AssignmentConfigPanel
						assignmentName={activeAssignmentName}
						date={activeDate}
						courses={activeCourses}
						trainerId={activeTrainerId}
						maxMarks={activeMaxMarks}
						description={activeDescription}
						batch={batch}
						trainers={trainers}
						onDateChange={setActiveDate}
						onCoursesChange={setActiveCourses}
						onTrainerChange={setActiveTrainerId}
						onMaxMarksChange={setActiveMaxMarks}
						onDescriptionChange={setActiveDescription}
					/>
				)}
			</Paper>

			<AssignmentMatrix
				allocations={allocations}
				assignments={assignments}
				activeAssignmentName={activeAssignmentName}
				activeCourses={activeCourses}
				activeMaxMarks={activeMaxMarks}
				activeDate={activeDate}
				onMarkChange={handleMarkChange}
			/>

			{/* New Assignment Dialog */}
			<AssignmentFormDialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				onSubmit={handleDialogSubmit}
				batch={batch}
			/>
		</Box>
	);
};

export default AssignmentTracker;
