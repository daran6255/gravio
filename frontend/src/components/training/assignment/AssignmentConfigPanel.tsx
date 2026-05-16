import React from 'react';
import {
	Box,
	Grid,
	TextField,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Typography,
	Stack
} from '@mui/material';
import type { TrainingBatch } from '../../../models/training';
import type { User } from '../../../models/user';

interface AssignmentConfigPanelProps {
	assignmentName: string;
	date: string;
	courses: string[];
	trainerId: number | '';
	maxMarks: number;
	description: string;
	batch: TrainingBatch;
	trainers: User[];
	onDateChange: (date: string) => void;
	onCoursesChange: (courses: string[]) => void;
	onTrainerChange: (trainerId: number) => void;
	onMaxMarksChange: (maxMarks: number) => void;
	onDescriptionChange: (description: string) => void;
}

const AssignmentConfigPanel: React.FC<AssignmentConfigPanelProps> = ({
	assignmentName,
	date,
	courses,
	trainerId,
	maxMarks,
	description,
	batch,
	trainers,
	onDateChange,
	onCoursesChange,
	onTrainerChange,
	onMaxMarksChange,
	onDescriptionChange
}) => {
	return (
		<Box sx={{ mt: 3, p: 2, bgcolor: '#f2f3f3', borderRadius: '4px', border: '1px solid #eaeded' }}>
			<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
				<Typography variant="subtitle2" sx={{ color: '#232f3e', fontWeight: 800, fontSize: '0.9rem' }}>
					General settings
				</Typography>
				<Typography variant="caption" sx={{ color: '#545b64', fontWeight: 600 }}>
					Assignment: {assignmentName}
				</Typography>
			</Stack>
			<Grid container spacing={2}>
				<Grid size={{ xs: 12, md: 3 }}>
					<TextField
						fullWidth
						label="Date Given"
						type="date"
						size="small"
						value={date}
						onChange={(e) => onDateChange(e.target.value)}
						InputLabelProps={{ shrink: true }}
						sx={{ '& .MuiInputBase-root': { bgcolor: 'white' } }}
					/>
				</Grid>
				<Grid size={{ xs: 12, md: 3 }}>
					<FormControl fullWidth size="small">
						<InputLabel>Related Courses</InputLabel>
						<Select
							multiple
							value={courses}
							label="Related Courses"
							onChange={(e) => onCoursesChange(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
							renderValue={(selected) => selected.join(', ')}
							sx={{ bgcolor: 'white' }}
						>
							{batch.courses?.map(c => {
								const name = typeof c === 'string' ? c : c.name;
								return <MenuItem key={name} value={name}>{name}</MenuItem>;
							})}
						</Select>
					</FormControl>
				</Grid>
				<Grid size={{ xs: 12, md: 3 }}>
					<FormControl fullWidth size="small">
						<InputLabel>Assigned Trainer</InputLabel>
						<Select
							value={trainerId}
							label="Assigned Trainer"
							onChange={(e) => onTrainerChange(e.target.value as number)}
							sx={{ bgcolor: 'white' }}
							disabled
						>
							{trainers.map(t => <MenuItem key={t.id} value={t.id}>{t.full_name || t.username}</MenuItem>)}
						</Select>
					</FormControl>
				</Grid>
				<Grid size={{ xs: 12, md: 3 }}>
					<TextField
						fullWidth
						label="Max Marks (per course)"
						type="number"
						size="small"
						value={maxMarks}
						onChange={(e) => onMaxMarksChange(parseInt(e.target.value) || 0)}
						sx={{ '& .MuiInputBase-root': { bgcolor: 'white' } }}
						helperText={`Total Max: ${maxMarks * (courses.length || 1)} (Sum of all courses)`}
					/>
				</Grid>
				<Grid size={{ xs: 12 }}>
					<TextField
						fullWidth
						label="Description / Questions"
						multiline
						rows={1}
						size="small"
						value={description}
						onChange={(e) => onDescriptionChange(e.target.value)}
						placeholder="Describe the assignment or list questions..."
						sx={{ '& .MuiInputBase-root': { bgcolor: 'white' } }}
					/>
				</Grid>
			</Grid>
		</Box>
	);
};

export default AssignmentConfigPanel;
