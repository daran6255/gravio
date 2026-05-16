import React from 'react';
import { Box, Stack, Typography, IconButton, Button, Alert } from '@mui/material';
import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, Download as DownloadIcon, ContentCopy as CopyIcon } from '@mui/icons-material';
import { format, isSameDay } from 'date-fns';

interface WeeklyPlanHeaderProps {
	weekNumber: number;
	weekStart: Date;
	weekDays: Date[];
	canGoPrev: boolean;
	canGoNext: boolean;
	handlePrevWeek: () => void;
	handleNextWeek: () => void;
	minDate: Date;
	currentDate: Date;
	setCurrentDate: (date: Date) => void;
	canEdit: boolean;
	onExportPNG: () => void;
	handleCopyPreviousWeek: () => void;
	onSync?: () => void;
	isExporting?: boolean;
	loading?: boolean;
}

const WeeklyPlanHeader: React.FC<WeeklyPlanHeaderProps> = ({
	weekNumber,
	weekStart,
	weekDays,
	canGoPrev,
	canGoNext,
	handlePrevWeek,
	handleNextWeek,
	minDate,
	currentDate,
	setCurrentDate,
	canEdit,
	onExportPNG,
	handleCopyPreviousWeek,
	onSync,
	isExporting = false,
	loading = false
}) => {
	return (
		<Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
			<Stack direction="row" spacing={1.5} alignItems="center">
				{!isExporting && (
					<IconButton onClick={handlePrevWeek} size="small" disabled={!canGoPrev} sx={{ border: '1px solid', borderColor: 'divider' }}>
						<ChevronLeftIcon />
					</IconButton>
				)}
				<Box textAlign="center" minWidth={220} sx={{ px: 2 }}>
					<Typography variant="overline" color="text.secondary" sx={{ display: 'block', fontWeight: 700, letterSpacing: 2, mb: -0.5 }}>
						WEEK {weekNumber}
					</Typography>
					<Typography variant="h6" sx={{ fontWeight: 700 }}>
						{format(weekStart, 'MMM d')} - {format(weekDays[weekDays.length - 1], 'MMM d, yyyy')}
					</Typography>
				</Box>
				{!isExporting && (
					<>
						<IconButton onClick={handleNextWeek} size="small" disabled={!canGoNext} sx={{ border: '1px solid', borderColor: 'divider' }}>
							<ChevronRightIcon />
						</IconButton>
						<Button
							variant="outlined"
							size="small"
							onClick={() => setCurrentDate(minDate)}
							disabled={isSameDay(currentDate, minDate)}
							sx={{ ml: 2 }}
						>
							Batch Start
						</Button>
						{canEdit && (
							<Button
								variant="outlined"
								size="small"
								startIcon={<CopyIcon />}
								onClick={handleCopyPreviousWeek}
								color="primary"
							>
								Copy Previous
							</Button>
						)}
						{canEdit && onSync && (
							<Button
								variant="outlined"
								size="small"
								startIcon={<CopyIcon />}
								onClick={onSync}
								color="secondary"
								disabled={loading}
							>
								{loading ? 'Syncing...' : 'Sync Project'}
							</Button>
						)}
						<Button
							variant="contained"
							size="small"
							startIcon={<DownloadIcon />}
							onClick={onExportPNG}
							color="success"
						>
							Export PNG
						</Button>
					</>
				)}
			</Stack>

			{!canEdit && !isExporting && (
				<Alert 
					severity="info" 
					variant="outlined" 
					sx={{ 
						py: 0, 
						borderRadius: 2,
						bgcolor: 'background.paper',
						fontWeight: 600
					}}
				>
					View Only Mode
				</Alert>
			)}
		</Stack>
	);
};

export default WeeklyPlanHeader;
