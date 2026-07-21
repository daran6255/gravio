import React from 'react';
import { Box, Stack, TextField } from '@mui/material';
import { TuneOutlined, HelpOutline } from '@mui/icons-material';
import SectionHeader from './SectionHeader';
import PremiumTooltip from '../common/PremiumTooltip';
import { useBookingCardStyles } from './bookingCardStyles';

interface SchedulingControlsCardProps {
	bufferBefore: number;
	setBufferBefore: (v: number) => void;
	bufferAfter: number;
	setBufferAfter: (v: number) => void;
	minNoticeMinutes: number;
	setMinNoticeMinutes: (v: number) => void;
	maxBookingsPerDay: number | '';
	setMaxBookingsPerDay: (v: number | '') => void;
}

const FieldLabel: React.FC<{ label: string; help: string; sx: Record<string, unknown> }> = ({ label, help, sx }) => (
	<Stack direction="row" spacing={0.4} alignItems="center" sx={{ mb: 0.75 }}>
		<Box component="span" sx={{ ...sx, mb: 0 }}>{label}</Box>
		<PremiumTooltip title={help} arrow placement="top">
			<HelpOutline sx={{ fontSize: 12, color: 'text.secondary', cursor: 'help', opacity: 0.6, '&:hover': { opacity: 1 } }} />
		</PremiumTooltip>
	</Stack>
);

const SchedulingControlsCard: React.FC<SchedulingControlsCardProps> = ({
	bufferBefore, setBufferBefore, bufferAfter, setBufferAfter,
	minNoticeMinutes, setMinNoticeMinutes, maxBookingsPerDay, setMaxBookingsPerDay,
}) => {
	const { cardSx, fieldSx, fieldLabelSx } = useBookingCardStyles();

	return (
		<Box sx={cardSx}>
			<SectionHeader
				icon={<TuneOutlined sx={{ fontSize: 16 }} />}
				title="Scheduling Controls"
				helpText="Fine-tune the booking experience: padding around meetings, how much notice you need, and daily limits."
			/>
			<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
				<Box>
					<FieldLabel label="Buffer Before (min)" help="No one can book a slot starting less than this many minutes after your previous meeting ends." sx={fieldLabelSx} />
					<TextField fullWidth size="small" type="number" value={bufferBefore} onChange={(e) => setBufferBefore(Number(e.target.value))} sx={fieldSx()} inputProps={{ min: 0 }} />
				</Box>
				<Box>
					<FieldLabel label="Minimum Notice (min)" help="How far in advance a client must book — e.g. 60 means the earliest bookable slot is always at least an hour from now." sx={fieldLabelSx} />
					<TextField fullWidth size="small" type="number" value={minNoticeMinutes} onChange={(e) => setMinNoticeMinutes(Number(e.target.value))} sx={fieldSx()} inputProps={{ min: 0 }} />
				</Box>
				<Box>
					<FieldLabel label="Buffer After (min)" help="Padding time reserved right after each meeting, so back-to-back bookings can't be made." sx={fieldLabelSx} />
					<TextField fullWidth size="small" type="number" value={bufferAfter} onChange={(e) => setBufferAfter(Number(e.target.value))} sx={fieldSx()} inputProps={{ min: 0 }} />
				</Box>
				<Box>
					<FieldLabel label="Max Bookings/Day" help="Caps how many meetings can be booked through this page on any single day. Leave blank for no limit." sx={fieldLabelSx} />
					<TextField
						fullWidth size="small" type="number" placeholder="No limit"
						value={maxBookingsPerDay}
						onChange={(e) => setMaxBookingsPerDay(e.target.value === '' ? '' : Number(e.target.value))}
						sx={fieldSx()} inputProps={{ min: 1 }}
					/>
				</Box>
			</Box>
		</Box>
	);
};

export default SchedulingControlsCard;
