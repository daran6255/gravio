import React, { useState } from 'react';
import { Box, Stack, Typography, IconButton, ToggleButton, ToggleButtonGroup, TextField, Tooltip } from '@mui/material';
import { EventBusyOutlined, DeleteOutline, AddOutlined, BlockOutlined, AccessTimeOutlined } from '@mui/icons-material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay, type PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import dayjs, { type Dayjs } from 'dayjs';
import SectionHeader from './SectionHeader';
import BaseDialog from '../common/dialogbox/BaseDialog';
import { SubmitButton, CancelButton } from '../common/button';
import { useBookingCardStyles } from './bookingCardStyles';
import type { BookingAvailabilityException } from '../../models/booking/bookingPage';

interface ExceptionsCardProps {
	exceptions: BookingAvailabilityException[];
	onAdd: (date: string, isBlocked: boolean, customSlots?: [string, string][]) => Promise<void> | void;
	onDelete: (id: number) => void;
	disabled?: boolean;
}

const ExceptionsCard: React.FC<ExceptionsCardProps> = ({ exceptions, onAdd, onDelete, disabled }) => {
	const { cardSx, mutedColor, fieldSx } = useBookingCardStyles();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [dialogDate, setDialogDate] = useState<Dayjs>(dayjs());
	const [ruleType, setRuleType] = useState<'blocked' | 'custom'>('blocked');
	const [customStart, setCustomStart] = useState('10:00');
	const [customEnd, setCustomEnd] = useState('14:00');
	const [saving, setSaving] = useState(false);

	const exceptionByDate = new Map(exceptions.map((e) => [e.date, e]));

	const openForDate = (date: Dayjs) => {
		setDialogDate(date);
		setRuleType('blocked');
		setDialogOpen(true);
	};

	const handleSave = async () => {
		setSaving(true);
		try {
			await onAdd(
				dialogDate.format('YYYY-MM-DD'),
				ruleType === 'blocked',
				ruleType === 'custom' ? [[customStart, customEnd]] : undefined
			);
			setDialogOpen(false);
		} finally {
			setSaving(false);
		}
	};

	const CalendarDay = (props: PickersDayProps) => {
		const dateStr = props.day.format('YYYY-MM-DD');
		const exception = exceptionByDate.get(dateStr);
		return (
			<Box sx={{ position: 'relative' }}>
				<PickersDay {...props} />
				{exception && (
					<Box
						sx={{
							position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
							width: 5, height: 5, borderRadius: '50%',
							bgcolor: exception.is_blocked ? 'error.main' : 'warning.main',
						}}
					/>
				)}
			</Box>
		);
	};

	return (
		<Box sx={cardSx}>
			<SectionHeader
				icon={<EventBusyOutlined sx={{ fontSize: 16 }} />}
				title="PTO & Exceptions"
				helpText="Override your regular weekly hours for a specific date — block it entirely (holiday, day off) or give it different hours."
				action={
					<Tooltip title={disabled ? 'Save your booking page first' : 'Add a rule for today'}>
						<span>
							<IconButton size="small" onClick={() => openForDate(dayjs())} disabled={disabled} color="primary">
								<AddOutlined sx={{ fontSize: 18 }} />
							</IconButton>
						</span>
					</Tooltip>
				}
			/>

			{disabled ? (
				<Box sx={{ p: 2, borderRadius: '10px', bgcolor: 'action.hover', textAlign: 'center' }}>
					<Typography variant="caption" sx={{ color: mutedColor }}>
						Save your booking page above to start adding dated exceptions.
					</Typography>
				</Box>
			) : (
				<>
					<Typography variant="caption" sx={{ color: mutedColor, display: 'block', mb: 1 }}>
						Click any date to block it or set custom hours.
					</Typography>
					<Box sx={{ '& .MuiDateCalendar-root': { width: '100%' } }}>
						<DateCalendar
							slots={{ day: CalendarDay }}
							onChange={(newValue) => newValue && openForDate(newValue)}
						/>
					</Box>

					<Stack spacing={0} sx={{ mt: 1 }}>
						{exceptions.length === 0 ? (
							<Typography variant="caption" sx={{ color: mutedColor }}>No blocked dates or overrides yet.</Typography>
						) : (
							[...exceptions]
								.sort((a, b) => a.date.localeCompare(b.date))
								.map((ex) => (
									<Stack
										key={ex.id} direction="row" spacing={1.5} alignItems="center"
										sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider', '&:last-of-type': { borderBottom: 'none' } }}
									>
										{ex.is_blocked
											? <BlockOutlined sx={{ fontSize: 16, color: 'error.main' }} />
											: <AccessTimeOutlined sx={{ fontSize: 16, color: 'warning.main' }} />}
										<Box sx={{ flexGrow: 1 }}>
											<Typography variant="body2" fontWeight={600}>
												{dayjs(ex.date).format('MMM D, YYYY')}
											</Typography>
											<Typography variant="caption" sx={{ color: mutedColor }}>
												{ex.is_blocked ? 'Blocked — unavailable all day' : `Custom hours: ${ex.custom_slots?.[0]?.[0]} – ${ex.custom_slots?.[0]?.[1]}`}
											</Typography>
										</Box>
										<Tooltip title="Remove this rule">
											<IconButton size="small" onClick={() => onDelete(ex.id)}>
												<DeleteOutline sx={{ fontSize: 16 }} />
											</IconButton>
										</Tooltip>
									</Stack>
								))
						)}
					</Stack>
				</>
			)}

			<BaseDialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				title={dialogDate.format('MMMM D, YYYY')}
				subtitle="Choose how this date should differ from your regular weekly hours"
				maxWidth="xs"
				loading={saving}
				actions={
					<>
						<CancelButton onClick={() => setDialogOpen(false)} disabled={saving} />
						<SubmitButton onClick={handleSave} loading={saving}>Save Rule</SubmitButton>
					</>
				}
			>
				<ToggleButtonGroup
					exclusive fullWidth value={ruleType} onChange={(_, v) => v && setRuleType(v)}
					sx={{ mb: ruleType === 'custom' ? 2 : 0 }}
				>
					<ToggleButton value="blocked" sx={{ textTransform: 'none' }}>Block entire day</ToggleButton>
					<ToggleButton value="custom" sx={{ textTransform: 'none' }}>Custom hours</ToggleButton>
				</ToggleButtonGroup>
				{ruleType === 'custom' && (
					<Stack direction="row" spacing={2}>
						<TextField
							label="Start" type="time" fullWidth size="small" value={customStart}
							onChange={(e) => setCustomStart(e.target.value)} sx={fieldSx()} InputLabelProps={{ shrink: true }}
						/>
						<TextField
							label="End" type="time" fullWidth size="small" value={customEnd}
							onChange={(e) => setCustomEnd(e.target.value)} sx={fieldSx()} InputLabelProps={{ shrink: true }}
						/>
					</Stack>
				)}
			</BaseDialog>
		</Box>
	);
};

export default ExceptionsCard;
