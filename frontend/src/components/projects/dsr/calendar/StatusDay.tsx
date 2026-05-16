import React from 'react';
import { Tooltip, useTheme, alpha } from '@mui/material';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import type { PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import type { CalendarStatusTheme } from './calendarUtils';

// Note: PickersDayProps is not generic in this version of MUI X
interface StatusDayProps extends PickersDayProps {
	dateStatuses: Record<string, string>;
	statusTheme: Record<string, CalendarStatusTheme>;
}

const StatusDay: React.FC<StatusDayProps> = (props) => {
	const {
		dateStatuses,
		statusTheme,
		day,
		outsideCurrentMonth,
		selected,
		onDaySelect,
		isFirstVisibleCell,
		isLastVisibleCell,
		...other
	} = props;

	const theme = useTheme();
	const dateStr = day.format('YYYY-MM-DD');
	const status = dateStatuses[dateStr];
	const sTheme = statusTheme[status as keyof typeof statusTheme];

	if (outsideCurrentMonth) {
		return (
			<PickersDay
				{...other}
				day={day}
				outsideCurrentMonth={outsideCurrentMonth}
				onDaySelect={onDaySelect}
				isFirstVisibleCell={isFirstVisibleCell}
				isLastVisibleCell={isLastVisibleCell}
			/>
		);
	}

	return (
		<Tooltip title={sTheme?.label || ''} arrow disableHoverListener={!status}>
			<PickersDay
				{...other}
				day={day}
				selected={selected}
				onDaySelect={onDaySelect}
				outsideCurrentMonth={outsideCurrentMonth}
				isFirstVisibleCell={isFirstVisibleCell}
				isLastVisibleCell={isLastVisibleCell}
				sx={{
					transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
					fontWeight: 600,
					fontSize: '0.75rem',
					borderRadius: '4px',
					...(status && !selected ? {
						bgcolor: `${sTheme.bg} !important`,
						color: `${sTheme.color} !important`,
						border: `1px solid ${sTheme.border}`,
						zIndex: 1,
						'&:hover': {
							bgcolor: alpha(sTheme.bg, 0.8),
							transform: 'translateY(-1px)',
							boxShadow: `0 2px 4px ${alpha(sTheme.color, 0.2)}`
						}
					} : {}),
					...(selected ? {
						bgcolor: `${theme.palette.accent.main} !important`,
						color: `${theme.palette.common.white} !important`,
						border: 'none',
						boxShadow: `0 4px 8px ${alpha(theme.palette.accent.main, 0.4)}`,
						zIndex: 2,
						transform: 'scale(1.1)'
					} : {}),
					...(outsideCurrentMonth ? { opacity: 0.5 } : {})
				}}
			/>
		</Tooltip>
	);
};

export default StatusDay;
