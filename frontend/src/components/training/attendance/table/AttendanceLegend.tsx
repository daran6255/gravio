import React from 'react';
import {
	Box,
	Paper,
	Typography,
	Stack,
	useTheme,
	alpha
} from '@mui/material';
import {
	InfoOutlined as InfoIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import type { TrainingAttendance } from '../../../../models/training';

interface AttendanceLegendProps {
	attendance: TrainingAttendance[];
	selectedDate: Date;
	statuses: Array<{ value: string; label: string; icon: React.ReactNode; color: string }>;
}

const AttendanceLegend: React.FC<AttendanceLegendProps> = ({
	attendance,
	selectedDate,
	statuses
}) => {
	const theme = useTheme();
	const dateStr = format(selectedDate, 'yyyy-MM-dd');

	const getCount = (statusValue: string) => {
		return attendance.filter(a => a.date === dateStr && a.status === statusValue).length;
	};

	return (
		<Stack spacing={4}>
			<Paper 
				elevation={0} 
				sx={{ 
					p: 3, 
					border: '1px solid',
					borderColor: 'divider', 
					borderRadius: 2,
					bgcolor: 'background.paper'
				}}
			>
				<Typography 
					variant="caption" 
					sx={{ 
						fontWeight: 800, 
						mb: 3, 
						color: 'text.secondary',
						display: 'block',
						letterSpacing: '0.1em',
						textTransform: 'uppercase'
					}}
				>
					Attendance Legend
				</Typography>
				<Stack spacing={2}>
					{statuses.map(s => (
						<Box key={s.value} sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
							<Box 
								sx={{ 
									bgcolor: s.color, 
									width: 10, 
									height: 10, 
									borderRadius: '50%',
									boxShadow: `0 0 6px ${alpha(s.color as string, 0.4)}`
								}} 
							/>
							<Typography variant="body2" sx={{ fontWeight: 600, flexGrow: 1, color: 'text.primary' }}>
								{s.label}
							</Typography>
							<Typography variant="body2" sx={{ fontWeight: 800, color: 'text.secondary', bgcolor: alpha(theme.palette.action.active, 0.05), px: 1, py: 0.2, borderRadius: 0.5, minWidth: 24, textAlign: 'center' }}>
								{getCount(s.value)}
							</Typography>
						</Box>
					))}
				</Stack>
			</Paper>

			<Paper 
				elevation={0} 
				sx={{ 
					p: 3, 
					border: '1px solid',
					borderColor: alpha(theme.palette.info.main, 0.2), 
					borderRadius: 2, 
					bgcolor: alpha(theme.palette.info.main, 0.02) 
				}}
			>
				<Stack direction="row" spacing={1.5} sx={{ mb: 2, color: 'info.main', alignItems: 'center' }}>
					<InfoIcon fontSize="small" />
					<Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
						Quick Tips
					</Typography>
				</Stack>
				<Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.8, display: 'block', fontWeight: 500 }}>
					• Attendance defaults to <strong>Present</strong> in the system.<br />
					• Marking a day as a <strong>Holiday</strong> removes it from student attendance calculations.<br />
					• You can only mark attendance within the <strong>Batch Duration</strong>.
				</Typography>
			</Paper>
		</Stack>
	);
};

export default AttendanceLegend;
