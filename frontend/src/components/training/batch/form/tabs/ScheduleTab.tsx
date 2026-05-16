import React from 'react';
import {
	TextField,
	Typography,
	Stack,
	MenuItem,
	Grid,
	Select,
	FormControl,
	InputLabel,
	Autocomplete,
	Box,
	alpha,
	useTheme
} from '@mui/material';
import {
	People as PeopleIcon,
	History as HistoryIcon,
	Assessment as AssessmentIcon
} from '@mui/icons-material';
import type { TrainingBatch } from '../../../../../models/training';

interface ScheduleTabProps {
	formData: Partial<TrainingBatch>;
	onChange: (field: keyof TrainingBatch, value: any) => void;
	onDurationChange: (field: string, value: any) => void;
	allUsers: any[];
	usersLoading: boolean;
	isDatesReadOnly: boolean;
}

const ScheduleTab: React.FC<ScheduleTabProps> = ({
	formData,
	onChange,
	onDurationChange,
	allUsers,
	usersLoading,
	isDatesReadOnly
}) => {
	const theme = useTheme();

	return (
		<Grid container spacing={4}>
			<Grid size={{ xs: 12, md: 6 }}>
				<Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
					<HistoryIcon fontSize="small" color="primary" /> Timeline Schedule
				</Typography>
				<Stack spacing={3}>
					<TextField
						fullWidth
						type="date"
						label="Inauguration Date"
						value={formData.duration?.start_date || ''}
						onChange={(e) => onDurationChange('start_date', e.target.value)}
						InputProps={{ readOnly: isDatesReadOnly }}
						InputLabelProps={{ shrink: true }}
					/>
					<TextField
						fullWidth
						type="date"
						label="Estimated Conclusion"
						value={formData.duration?.end_date || ''}
						onChange={(e) => onDurationChange('end_date', e.target.value)}
						InputProps={{ readOnly: isDatesReadOnly }}
						InputLabelProps={{ shrink: true }}
					/>
					<Box sx={{ p: 3, bgcolor: alpha(theme.palette.accent.main, 0.05), borderRadius: 1, border: `1px dashed ${theme.palette.accent.main}`, textAlign: 'center' }}>
						<Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5, textTransform: 'uppercase', letterSpacing: 1 }}>Calculated Duration</Typography>
						<Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.accent.main }}>
							{formData.duration?.weeks || 0} <Typography component="span" variant="h6">Weeks</Typography>
						</Typography>
					</Box>

					<Box>
						<Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
							<AssessmentIcon fontSize="small" color="primary" /> Batch Status
						</Typography>
						<FormControl fullWidth>
							<InputLabel>Operational Status</InputLabel>
							<Select
								value={formData.status}
								label="Operational Status"
								onChange={(e) => onChange('status', e.target.value)}
							>
								<MenuItem value="planned">Planned</MenuItem>
								<MenuItem value="running">In Progress</MenuItem>
								<MenuItem value="closed">Completed</MenuItem>
							</Select>
						</FormControl>
					</Box>
				</Stack>
			</Grid>

			<Grid size={{ xs: 12, md: 6 }}>
				<Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
					<PeopleIcon fontSize="small" color="primary" /> Trainer Assignments
				</Typography>
				<Stack spacing={2}>
					{(formData.courses || []).length === 0 ? (
						<Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic', p: 2, bgcolor: theme.palette.background.default, borderRadius: 1 }}>
							No courses selected. Go back to Step 2 to add courses.
						</Typography>
					) : (
						(formData.courses || []).map((course: any, index: number) => {
							const courseName = typeof course === 'string' ? course : course.name;
							const trainerName = typeof course === 'string' ? '' : course.trainer;

							return (
								<Box key={index} sx={{ p: 2, borderRadius: 1, border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper }}>
									<Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.primary.main, display: 'block', mb: 1 }}>
										{courseName}
									</Typography>
									<Autocomplete
										size="small"
										loading={usersLoading}
										options={allUsers.map(t => t.full_name || t.username)}
										value={trainerName}
										onChange={(_e, val) => {
											const updatedCourses = [...(formData.courses || [])];
											updatedCourses[index] = {
												name: courseName,
												trainer: val || ''
											};
											onChange('courses', updatedCourses);
										}}
										renderInput={(params) => (
											<TextField {...params} placeholder="Select trainer" />
										)}
									/>
								</Box>
							);
						})
					)}
				</Stack>
			</Grid>
		</Grid>
	);
};

export default ScheduleTab;
