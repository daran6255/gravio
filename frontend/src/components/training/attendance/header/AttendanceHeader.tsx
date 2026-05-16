import React from 'react';
import {
	Box,
	Paper,
	Typography,
	IconButton,
	Button,
	Stack,
	CircularProgress,
	useTheme,
	alpha
} from '@mui/material';
import {
	Save as SaveIcon,
	ChevronLeft as LeftIcon,
	ChevronRight as RightIcon
} from '@mui/icons-material';
import { format, addDays, isWithinInterval, startOfDay } from 'date-fns';
import type { TrainingBatchEvent } from '../../../../models/training';

interface AttendanceHeaderProps {
	selectedDate: Date;
	onDateChange: (date: Date) => void;
	batchBounds: { start: Date; end: Date } | null;
	currentEvent?: TrainingBatchEvent;
	onSave: () => void;
	saving: boolean;
	isDateOutOfRange: boolean;
	isFutureDate: boolean;
	hasNoPlan: boolean;
}

const AttendanceHeader: React.FC<AttendanceHeaderProps> = ({
	selectedDate,
	onDateChange,
	batchBounds,
	currentEvent,
	onSave,
	saving,
	isDateOutOfRange,
	isFutureDate,
	hasNoPlan
}) => {
	const theme = useTheme();

	return (
		<Paper 
			elevation={0} 
			sx={{ 
				p: 2.5, 
				border: '1px solid',
				borderColor: 'divider', 
				borderRadius: 2, 
				bgcolor: 'background.paper' 
			}}
		>
			<Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center" justifyContent="space-between">
				<Stack direction="row" spacing={2} alignItems="center">
					<IconButton
						onClick={() => onDateChange(addDays(selectedDate, -1))}
						disabled={batchBounds ? !isWithinInterval(startOfDay(addDays(selectedDate, -1)), batchBounds) : false}
						sx={{ 
							border: '1px solid',
							borderColor: 'divider',
							'&:hover': {
								bgcolor: alpha(theme.palette.primary.main, 0.04),
								borderColor: theme.palette.primary.main,
								color: 'primary.main'
							}
						}}
					>
						<LeftIcon />
					</IconButton>
					<Box sx={{ textAlign: 'center', minWidth: 200 }}>
						<Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700, letterSpacing: '-0.01em' }}>
							{format(selectedDate, 'EEEE, MMM dd, yyyy')}
						</Typography>
						<Typography 
							variant="caption" 
							color="primary.main" 
							sx={{ 
								fontWeight: 800, 
								textTransform: 'uppercase', 
								letterSpacing: '0.1em',
								fontSize: '0.65rem',
								bgcolor: alpha(theme.palette.primary.main, 0.05),
								px: 1,
								py: 0.2,
								borderRadius: 0.5,
								mt: 0.5,
								display: 'inline-block'
							}}
						>
							{currentEvent ? currentEvent.title : 'Regular Training Day'}
						</Typography>
					</Box>
					<IconButton
						onClick={() => onDateChange(addDays(selectedDate, 1))}
						disabled={batchBounds ? !isWithinInterval(startOfDay(addDays(selectedDate, 1)), batchBounds) : false}
						sx={{ 
							border: '1px solid',
							borderColor: 'divider',
							'&:hover': {
								bgcolor: alpha(theme.palette.primary.main, 0.04),
								borderColor: theme.palette.primary.main,
								color: 'primary.main'
							}
						}}
					>
						<RightIcon />
					</IconButton>
				</Stack>

				<Stack direction="row" spacing={2}>
					<Button
						variant="contained"
						startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
						onClick={onSave}
						disabled={saving || !!currentEvent || isDateOutOfRange || isFutureDate || hasNoPlan}
						sx={{
							bgcolor: 'primary.main',
							'&:hover': { bgcolor: 'primary.dark' },
							textTransform: 'none',
							boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
							fontWeight: 700,
							px: 4,
							borderRadius: 1.5,
							minWidth: 160
						}}
					>
						{saving ? 'Saving Changes...' : 'Save Changes'}
					</Button>
				</Stack>
			</Stack>
		</Paper>
	);
};

export default AttendanceHeader;
