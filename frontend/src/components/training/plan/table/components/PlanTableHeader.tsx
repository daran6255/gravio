import React from 'react';
import { TableCell, Stack, Box, Typography, IconButton, useTheme, alpha } from '@mui/material';
import { 
	CalendarMonth as CalendarIcon, 
	DeleteForever as RemoveEventIcon, 
	FileCopy as FileCopyIcon,
	EventBusy as HolidayIcon,
	EventAvailable as EventIcon
} from '@mui/icons-material';
import { format, startOfDay, endOfDay } from 'date-fns';

interface PlanTableHeaderProps {
	day: Date;
	minDate: Date;
	maxDate: Date;
	canEdit: boolean;
	isExporting: boolean;
	holiday: any;
	hasEntries: boolean;
	onCopyDay: (date: Date) => void;
	onDeleteEvent: (id: number) => void;
	onOpenEventDialog: (date: Date) => void;
}

const PlanTableHeader: React.FC<PlanTableHeaderProps> = ({
	day,
	minDate,
	maxDate,
	canEdit,
	isExporting,
	holiday,
	hasEntries,
	onCopyDay,
	onDeleteEvent,
	onOpenEventDialog
}) => {
	const theme = useTheme();
	const isWithinBatch = day >= startOfDay(minDate) && day <= endOfDay(maxDate);

	return (
		<TableCell
			align="center"
			sx={{
				bgcolor: holiday ? (holiday.event_type === 'holiday' ? alpha(theme.palette.error.main, 0.04) : alpha(theme.palette.primary.main, 0.04)) : 'inherit',
				position: 'relative',
				borderRight: '1px solid',
				borderColor: 'divider',
				py: 2,
				'&:hover .event-action': { opacity: 1 }
			}}
		>
			<Stack direction="row" justifyContent="center" alignItems="center" spacing={1} sx={{ position: 'relative' }}>
				<Box>
					<Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
						{format(day, 'EEEE')}
					</Typography>
					<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
						{format(day, 'MMM d')}
					</Typography>
				</Box>

				{canEdit && isWithinBatch && !isExporting && (
					<Stack direction="row" spacing={0.5} className="event-action" sx={{ opacity: 0, transition: 'opacity 0.2s', position: 'absolute', right: -30 }}>
						<IconButton
							size="small"
							onClick={() => onCopyDay(day)}
							title="Copy day schedule"
							sx={{ color: 'primary.main', bgcolor: 'background.paper', boxShadow: 1, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) } }}
							disabled={!hasEntries}
						>
							<FileCopyIcon sx={{ fontSize: 14 }} />
						</IconButton>
						{holiday ? (
							<IconButton
								size="small"
								color="error"
								onClick={() => onDeleteEvent(holiday.id)}
								title={`Remove ${holiday.event_type}`}
								sx={{ bgcolor: 'background.paper', boxShadow: 1, '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.05) } }}
							>
								<RemoveEventIcon sx={{ fontSize: 16 }} />
							</IconButton>
						) : (
							<IconButton
								size="small"
								onClick={() => onOpenEventDialog(day)}
								title="Mark as Holiday/Event"
								sx={{ bgcolor: 'background.paper', boxShadow: 1, '&:hover': { bgcolor: 'action.hover' } }}
							>
								<CalendarIcon sx={{ fontSize: 16 }} />
							</IconButton>
						)}
					</Stack>
				)}
			</Stack>
			{holiday && (
				<Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
					{holiday.event_type === 'holiday' ? (
						<HolidayIcon sx={{ fontSize: 14, color: 'error.main' }} />
					) : (
						<EventIcon sx={{ fontSize: 14, color: 'primary.main' }} />
					)}
					<Typography variant="caption" sx={{ fontWeight: 800, color: holiday.event_type === 'holiday' ? 'error.main' : 'primary.main', fontSize: '0.65rem', textTransform: 'uppercase' }}>
						{holiday.title}
					</Typography>
				</Box>
			)}
		</TableCell>
	);
};

export default PlanTableHeader;
