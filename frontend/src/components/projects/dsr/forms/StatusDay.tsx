import React from 'react';
import { PickersDay, type PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { Dayjs } from 'dayjs';

interface StatusDayProps extends PickersDayProps {
	dateStatuses: Record<string, string>;
	day: Dayjs;
}

const StatusDay: React.FC<StatusDayProps> = (props) => {
	const { day, dateStatuses, selected, ...other } = props;
	const dateStr = day.format('YYYY-MM-DD');
	const status = dateStatuses[dateStr];

	let style = {};
	const statusStyles: Record<string, any> = {
		approved: { bgcolor: '#f1f8e9', color: '#2e7d32', border: '1px solid #a5d6a7' },
		submitted: { bgcolor: '#fffde7', color: '#f9a825', border: '1px solid #fff59d' },
		rejected: { bgcolor: '#ffebee', color: '#c62828', border: '1px solid #ef9a9a' },
		draft: { bgcolor: '#fafafa', color: '#616161', border: '1px dashed #bdbdbd' },
		missed: { bgcolor: '#fff5f5', color: '#d32f2f', border: 'none' },
		granted: { bgcolor: '#e3f2fd', color: '#1565c0', border: '1px solid #90caf9' },
		leave: { bgcolor: '#fff3e0', color: '#ef6c00', border: '1px solid #ffcc80' },
		holiday: { bgcolor: '#f5f5f5', color: '#9e9e9e', border: '1px solid #e0e0e0' }
	};

	if (status && statusStyles[status]) {
		style = {
			...statusStyles[status],
			'&:hover': { bgcolor: `${statusStyles[status].bgcolor}CC` }
		};
	}

	return (
		<PickersDay
			{...other}
			day={day}
			selected={selected}
			sx={{
				...style,
				fontWeight: 600,
				fontSize: '0.75rem',
				...(selected ? {
					bgcolor: '#ec7211 !important',
					color: 'white !important',
					border: 'none !important',
					zIndex: 1,
					boxShadow: '0 2px 4px rgba(236,114,17,0.3)'
				} : {})
			}}
		/>
	);
};

export default StatusDay;
