import React from 'react';
import { Box, Stack, Typography, TextField, IconButton, Switch, useTheme } from '@mui/material';
import { ScheduleOutlined, DeleteOutline, ContentCopyOutlined } from '@mui/icons-material';
import SectionHeader from './SectionHeader';
import PremiumTooltip from '../../common/PremiumTooltip';
import type { TimeRange, WeeklyAvailability } from '../../../models/booking/bookingPage';

const ACCENT = '#f59e0b';

const DAYS: { key: keyof WeeklyAvailability; label: string }[] = [
	{ key: 'mon', label: 'Monday' },
	{ key: 'tue', label: 'Tuesday' },
	{ key: 'wed', label: 'Wednesday' },
	{ key: 'thu', label: 'Thursday' },
	{ key: 'fri', label: 'Friday' },
	{ key: 'sat', label: 'Saturday' },
	{ key: 'sun', label: 'Sunday' },
];

interface WeeklyHoursCardProps {
	enabledDays: Record<string, boolean>;
	dayRanges: Record<string, TimeRange>;
	onToggleDay: (day: string, enabled: boolean) => void;
	onChangeRange: (day: string, range: TimeRange) => void;
	onCopyToAll: () => void;
}

const WeeklyHoursCard: React.FC<WeeklyHoursCardProps> = ({ enabledDays, dayRanges, onToggleDay, onChangeRange, onCopyToAll }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const anyEnabled = Object.values(enabledDays).some(Boolean);

	const cardSx = {
		p: { xs: 2.5, sm: 3 }, borderRadius: '20px',
		bgcolor: 'background.paper',
		border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)',
		boxShadow: isDark ? '0 1px 2px rgba(0,0,0,0.4), 0 8px 20px rgba(0,0,0,0.2)' : '0 1px 2px rgba(15,23,42,0.04), 0 8px 20px rgba(15,23,42,0.05)',
	};

	return (
		<Box sx={cardSx}>
			<SectionHeader
				icon={<ScheduleOutlined sx={{ fontSize: 16 }} />}
				title="Weekly Hours"
				color={ACCENT}
				helpText="Your recurring availability. Clients can only book slots that fall inside a day you've turned on, within the hours shown."
				action={
					<PremiumTooltip title="Apply Monday's hours to every enabled day">
						<span>
							<IconButton size="small" onClick={onCopyToAll} disabled={!enabledDays.mon}>
								<ContentCopyOutlined sx={{ fontSize: 16 }} />
							</IconButton>
						</span>
					</PremiumTooltip>
				}
			/>

			{!anyEnabled && (
				<Box sx={{ mb: 1.5, p: 1.5, borderRadius: '10px', bgcolor: 'warning.main', opacity: 0.9 }}>
					<Typography variant="caption" sx={{ color: '#000', fontWeight: 700 }}>
						Turn on at least one day, or clients won't see any bookable times.
					</Typography>
				</Box>
			)}

			<Stack spacing={0.5}>
				{DAYS.map((d) => {
					const enabled = !!enabledDays[d.key];
					const range = dayRanges[d.key];
					return (
						<Stack
							key={d.key}
							direction="row"
							spacing={1.5}
							alignItems="center"
							sx={{
								py: 1, px: 1, borderRadius: '10px',
								bgcolor: enabled ? 'action.hover' : 'transparent',
								transition: 'background-color 0.15s',
							}}
						>
							<Switch size="small" checked={enabled} onChange={(e) => onToggleDay(d.key, e.target.checked)} />
							<Typography variant="body2" sx={{ width: 84, fontWeight: 600, color: enabled ? 'text.primary' : 'text.secondary' }}>
								{d.label}
							</Typography>

							{enabled ? (
								<>
									<TextField
										type="time" size="small" variant="outlined" value={range[0]}
										onChange={(e) => onChangeRange(d.key, [e.target.value, range[1]])}
										inputProps={{ style: { fontSize: '0.8rem', padding: '6px 8px' } }}
										sx={{ width: 110 }}
									/>
									<Typography variant="caption" color="text.secondary">to</Typography>
									<TextField
										type="time" size="small" variant="outlined" value={range[1]}
										onChange={(e) => onChangeRange(d.key, [range[0], e.target.value])}
										inputProps={{ style: { fontSize: '0.8rem', padding: '6px 8px' } }}
										sx={{ width: 110 }}
									/>
									<Box sx={{ flexGrow: 1 }} />
									<PremiumTooltip title={`Turn off ${d.label}`}>
										<IconButton size="small" onClick={() => onToggleDay(d.key, false)}>
											<DeleteOutline sx={{ fontSize: 16, color: 'text.secondary' }} />
										</IconButton>
									</PremiumTooltip>
								</>
							) : (
								<Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', fontSize: '0.8rem' }}>
									Unavailable
								</Typography>
							)}
						</Stack>
					);
				})}
			</Stack>
		</Box>
	);
};

export default WeeklyHoursCard;
