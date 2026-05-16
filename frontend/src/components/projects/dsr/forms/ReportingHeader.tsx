import React from 'react';
import { Box, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import StatusDay from './StatusDay';
import StatCard from '../../../common/stats/StatCard';

interface ReportingHeaderProps {
	reportDate: string;
	onDateChange: (date: string) => void;
	dateStatuses: Record<string, string>;
	entryId?: string | null;
	readOnly?: boolean;
	totalHours: number;
	isLeave: boolean;
}

const ReportingHeader: React.FC<ReportingHeaderProps> = ({
	reportDate,
	onDateChange,
	dateStatuses,
	entryId,
	readOnly,
	totalHours,
	isLeave
}) => {
	return (
		<Box sx={{
			display: 'grid',
			gridTemplateColumns: { xs: '1fr', md: '1fr auto' },
			gap: 3,
			mb: 3,
			alignItems: 'center',
			p: 2.5,
			bgcolor: 'white',
			borderRadius: '8px',
			border: '1px solid #e5e7eb',
			boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
		}}>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
				<Box>
					<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mb: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
						Reporting Date
					</Typography>
					<DatePicker
						value={dayjs(reportDate)}
						onChange={(newValue) => onDateChange(newValue ? newValue.format('YYYY-MM-DD') : '')}
						format="DD-MMM-YYYY"
						disabled={!!entryId || readOnly}
						maxDate={dayjs()}
						slots={{ day: (props) => <StatusDay {...props} dateStatuses={dateStatuses} /> }}
						slotProps={{
							textField: {
								size: 'small',
								variant: 'standard',
								InputProps: { disableUnderline: true },
								sx: {
									'& .MuiInputBase-input': {
										fontWeight: 700,
										fontSize: '1rem',
										color: '#111827',
										p: 0,
										cursor: (!!entryId || readOnly) ? 'default' : 'pointer'
									}
								}
							}
						}}
					/>
				</Box>

			</Box>

			<Box sx={{ justifySelf: { md: 'end' } }}>
				<StatCard
					label="Total Logged Hours"
					value={isLeave ? '0.00' : totalHours.toFixed(2)}
					unit="hrs"
					color={!isLeave && totalHours > 8 ? '#059669' : '#111827'}
				/>
			</Box>
		</Box>
	);
};

export default ReportingHeader;
