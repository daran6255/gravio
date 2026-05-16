import React from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import { InfoOutlined as InfoIcon } from '@mui/icons-material';
import { DSRStatusValues } from '../../../../models/dsr';
import type { CalendarStatusTheme } from './calendarUtils';

interface LegendItemProps {
	color: string;
	label: string;
	border: string;
}

const LegendItem: React.FC<LegendItemProps> = ({ color, label, border }) => {
	const theme = useTheme();
	return (
		<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
			<Box sx={{
				width: 10,
				height: 10,
				bgcolor: color,
				borderRadius: '3px',
				border: `1px solid ${border}`,
				flexShrink: 0
			}} />
			<Typography
				variant="caption"
				sx={{
					color: theme.palette.text.primary,
					fontWeight: 600,
					fontSize: '0.7rem',
					lineHeight: 1
				}}
			>
				{label}
			</Typography>
		</Box>
	);
};

interface CalendarLegendProps {
	statusTheme: Record<string, CalendarStatusTheme>;
}

const CalendarLegend: React.FC<CalendarLegendProps> = ({ statusTheme }) => {
	const theme = useTheme();

	return (
		<Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.default, 0.5) }}>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
				<InfoIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
				<Typography variant="awsFieldLabel" sx={{ mb: 0 }}>
					Status Indicators
				</Typography>
			</Box>

			<Box sx={{
				display: 'grid',
				gridTemplateColumns: {
					xs: 'repeat(2, 1fr)',
					sm: 'repeat(3, 1fr)',
					md: 'repeat(4, 1fr)'
				},
				gap: 2
			}}>
				<LegendItem color={statusTheme[DSRStatusValues.APPROVED].bg} border={statusTheme[DSRStatusValues.APPROVED].border} label="Approved" />
				<LegendItem color={statusTheme[DSRStatusValues.SUBMITTED].bg} border={statusTheme[DSRStatusValues.SUBMITTED].border} label="Submitted" />
				<LegendItem color={statusTheme[DSRStatusValues.REJECTED].bg} border={statusTheme[DSRStatusValues.REJECTED].border} label="Revoked" />
				<LegendItem color={statusTheme[DSRStatusValues.DRAFT].bg} border={statusTheme[DSRStatusValues.DRAFT].border} label="Draft" />
				<LegendItem color={statusTheme.leave.bg} border={statusTheme.leave.border} label="Leave" />
				<LegendItem color={statusTheme.holiday.bg} border={statusTheme.holiday.border} label="Holiday" />
				<LegendItem color={statusTheme.missing.bg} border={statusTheme.missing.border} label="Missing" />
			</Box>
		</Box>
	);
};

export default CalendarLegend;
