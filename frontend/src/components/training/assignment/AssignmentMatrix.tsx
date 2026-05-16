import React, { memo } from 'react';
import {
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
} from '@mui/material';
import type { CandidateAllocation, TrainingAssignment } from '../../../models/training';
import AssignmentMatrixRow from './AssignmentMatrixRow';

interface AssignmentMatrixProps {
	allocations: CandidateAllocation[];
	assignments: TrainingAssignment[];
	activeAssignmentName: string;
	activeCourses: string[];
	activeMaxMarks: number;
	activeDate: string;
	onMarkChange: (candidateId: number, field: keyof TrainingAssignment | 'remarks' | 'course_mark', value: any, courseName?: string) => void;
}

const AssignmentMatrix: React.FC<AssignmentMatrixProps> = memo(({
	allocations,
	assignments,
	activeAssignmentName,
	activeCourses,
	activeMaxMarks,
	activeDate,
	onMarkChange
}) => {
	return (
		<TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eaeded', borderRadius: '4px', bgcolor: 'white' }}>
			<Table size="small" stickyHeader sx={{ '& .MuiTableCell-root': { borderColor: '#eaeded' } }}>
				<TableHead>
					<TableRow sx={{ bgcolor: '#f2f3f3' }}>
						<TableCell sx={{ fontWeight: 800, py: 1.5, minWidth: 200, color: '#545b64', fontSize: '0.85rem' }}>STUDENT DETAIL</TableCell>
						<TableCell sx={{ fontWeight: 800, color: '#545b64', fontSize: '0.85rem' }} align="center">SUBMISSION</TableCell>
						{activeCourses.map(course => (
							<TableCell key={course} sx={{ fontWeight: 800, color: '#545b64', fontSize: '0.85rem' }} align="center">{course.toUpperCase()}</TableCell>
						))}
						<TableCell sx={{ fontWeight: 800, color: '#545b64', fontSize: '0.85rem' }} align="center">TOTAL ({activeMaxMarks * (activeCourses.length || 1)})</TableCell>
						<TableCell sx={{ fontWeight: 800, color: '#545b64', fontSize: '0.85rem' }} align="center">PERFORMANCE</TableCell>
						<TableCell sx={{ fontWeight: 800, color: '#545b64', fontSize: '0.85rem' }}>REMARKS</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{allocations.map(allocation => {
						const record = assignments.find(a => a.candidate_id === allocation.candidate_id && a.assignment_name === activeAssignmentName);

						return (
							<AssignmentMatrixRow
								key={allocation.id}
								allocation={allocation}
								record={record}
								activeDate={activeDate}
								activeCourses={activeCourses}
								activeMaxMarks={activeMaxMarks}
								onMarkChange={onMarkChange}
							/>
						);
					})}
				</TableBody>
			</Table>
		</TableContainer>
	);
});

AssignmentMatrix.displayName = 'AssignmentMatrix';

export default AssignmentMatrix;

