import React, { memo } from 'react';
import {
	TableRow,
	TableCell,
	Typography,
	TextField,
	Box
} from '@mui/material';
import type { CandidateAllocation, TrainingAssignment } from '../../../models/training';

interface AssignmentMatrixRowProps {
	allocation: CandidateAllocation;
	record: TrainingAssignment | undefined;
	activeDate: string;
	activeCourses: string[];
	activeMaxMarks: number;
	onMarkChange: (candidateId: number, field: keyof TrainingAssignment | 'remarks' | 'course_mark', value: any, courseName?: string) => void;
}

const AssignmentMatrixRow: React.FC<AssignmentMatrixRowProps> = memo(({
	allocation,
	record,
	activeDate,
	activeCourses,
	activeMaxMarks,
	onMarkChange
}) => {
	// Percentage = (Total Obtained / (Max Per Course * Num Courses)) * 100
	const totalMax = activeMaxMarks * (activeCourses.length || 1);
	const percentage = record ? (record.marks_obtained / (totalMax || 1)) * 100 : 0;

	return (
		<TableRow hover sx={{ '&:hover': { bgcolor: '#f1faff !important' } }}>
			<TableCell sx={{ py: 1.5 }}>
				<Typography variant="body2" sx={{ fontWeight: 700, color: '#232f3e' }}>{allocation.candidate?.name}</Typography>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					<Typography variant="body2" sx={{ color: '#545b64', fontSize: '0.75rem' }}>
						{record?.assignment_date || activeDate}
					</Typography>
				</Box>
				<Typography variant="caption" sx={{ color: '#545b64' }}>{allocation.candidate?.email}</Typography>
			</TableCell>
			<TableCell align="center">
				<TextField
					type="date"
					size="small"
					value={record?.submission_date || activeDate}
					onChange={(e) => onMarkChange(allocation.candidate_id, 'submission_date', e.target.value)}
					InputProps={{ sx: { fontSize: '0.75rem', height: 32 } }}
					sx={{ width: 130 }}
				/>
			</TableCell>
			{activeCourses.map(course => (
				<TableCell key={course} align="center">
					<TextField
						type="number"
						size="small"
						value={record?.course_marks?.[course] ?? ''}
						onChange={(e) => onMarkChange(allocation.candidate_id, 'course_mark', parseFloat(e.target.value) || 0, course)}
						sx={{ width: 70, '& input': { textAlign: 'center', height: '1.2rem', padding: '6px' } }}
					/>
				</TableCell>
			))}
			<TableCell align="center">
				<Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#16191f' }}>
					{record?.marks_obtained ? record.marks_obtained.toFixed(1) : 0}
				</Typography>
			</TableCell>
			<TableCell align="center">
				<Box
					sx={{
						px: 1,
						py: 0.25,
						borderRadius: '16px',
						display: 'inline-block',
						bgcolor: percentage >= 75 ? '#ebf5e0' : percentage >= 40 ? '#fff3e0' : '#fdedf0',
						color: percentage >= 75 ? '#318400' : percentage >= 40 ? '#c67200' : '#d91515',
						fontWeight: 800,
						fontSize: '0.7rem'
					}}
				>
					{percentage.toFixed(1)}%
				</Box>
			</TableCell>
			<TableCell>
				<TextField
					fullWidth
					size="small"
					placeholder="Add remarks..."
					value={record?.others?.remarks || ''}
					onChange={(e) => onMarkChange(allocation.candidate_id, 'remarks', e.target.value)}
					InputProps={{ sx: { fontSize: '0.75rem', height: 32 } }}
				/>
			</TableCell>
		</TableRow>
	);
});

AssignmentMatrixRow.displayName = 'AssignmentMatrixRow';

export default AssignmentMatrixRow;

