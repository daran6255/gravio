import React from 'react';
import { Box, Stack, TextField, useTheme } from '@mui/material';
import { TuneOutlined, HelpOutline } from '@mui/icons-material';
import SectionHeader from './SectionHeader';
import PremiumTooltip from '../../common/PremiumTooltip';

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

const ACCENT = '#10b981';

const fieldLabelSx = { color: 'text.secondary', fontWeight: 700, display: 'block' as const, mb: 0.75, fontSize: '0.7rem', textTransform: 'uppercase' as const, letterSpacing: '0.04em' };

const FieldLabel: React.FC<{ label: string; help: string }> = ({ label, help }) => (
	<Stack direction="row" spacing={0.4} alignItems="center" sx={{ mb: 0.75 }}>
		<Box component="span" sx={{ ...fieldLabelSx, mb: 0 }}>{label}</Box>
		<PremiumTooltip title={help} arrow placement="top">
			<HelpOutline sx={{ fontSize: 12, color: 'text.secondary', cursor: 'help', opacity: 0.6, '&:hover': { opacity: 1 } }} />
		</PremiumTooltip>
	</Stack>
);

const SchedulingControlsCard: React.FC<SchedulingControlsCardProps> = ({
	bufferBefore, setBufferBefore, bufferAfter, setBufferAfter,
	minNoticeMinutes, setMinNoticeMinutes, maxBookingsPerDay, setMaxBookingsPerDay,
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const cardSx = {
		p: { xs: 2.5, sm: 3 }, borderRadius: '20px',
		bgcolor: 'background.paper',
		border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)',
		boxShadow: isDark ? '0 1px 2px rgba(0,0,0,0.4), 0 8px 20px rgba(0,0,0,0.2)' : '0 1px 2px rgba(15,23,42,0.04), 0 8px 20px rgba(15,23,42,0.05)',
	};

	return (
		<Box sx={cardSx}>
			<SectionHeader
				icon={<TuneOutlined sx={{ fontSize: 16 }} />}
				title="Scheduling Controls"
				color={ACCENT}
				helpText="Fine-tune the booking experience: padding around meetings, how much notice you need, and daily limits."
			/>
			<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
				<Box>
					<FieldLabel label="Buffer Before (min)" help="No one can book a slot starting less than this many minutes after your previous meeting ends." />
					<TextField fullWidth size="small" type="number" value={bufferBefore} onChange={(e) => setBufferBefore(Number(e.target.value))} inputProps={{ min: 0 }} />
				</Box>
				<Box>
					<FieldLabel label="Minimum Notice (min)" help="How far in advance a client must book — e.g. 60 means the earliest bookable slot is always at least an hour from now." />
					<TextField fullWidth size="small" type="number" value={minNoticeMinutes} onChange={(e) => setMinNoticeMinutes(Number(e.target.value))} inputProps={{ min: 0 }} />
				</Box>
				<Box>
					<FieldLabel label="Buffer After (min)" help="Padding time reserved right after each meeting, so back-to-back bookings can't be made." />
					<TextField fullWidth size="small" type="number" value={bufferAfter} onChange={(e) => setBufferAfter(Number(e.target.value))} inputProps={{ min: 0 }} />
				</Box>
				<Box>
					<FieldLabel label="Max Bookings/Day" help="Caps how many meetings can be booked through this page on any single day. Leave blank for no limit." />
					<TextField
						fullWidth size="small" type="number" placeholder="No limit"
						value={maxBookingsPerDay}
						onChange={(e) => setMaxBookingsPerDay(e.target.value === '' ? '' : Number(e.target.value))}
						inputProps={{ min: 1 }}
					/>
				</Box>
			</Box>
		</Box>
	);
};

export default SchedulingControlsCard;
