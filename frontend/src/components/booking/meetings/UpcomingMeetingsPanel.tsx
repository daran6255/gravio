import React, { useMemo } from 'react';
import { Box, Stack, Typography, IconButton, Tooltip, Chip, Divider, useTheme } from '@mui/material';
import { VideocamOutlined, EditOutlined, CloseOutlined, EventBusyOutlined } from '@mui/icons-material';
import dayjs from 'dayjs';
import EnterpriseAvatar from '../../common/avatar/Avatar';
import StatusBadge from '../../common/badge/StatusBadge';
import type { ScheduledMeetingHost } from '../../../models/booking/meeting';

const SYNC_LABEL: Record<string, string> = {
	not_applicable: 'Manual Link',
	pending: 'Syncing…',
	synced: 'Synced',
	failed: 'Sync Failed',
};

interface UpcomingMeetingsPanelProps {
	meetings: ScheduledMeetingHost[];
	onReschedule: (meeting: ScheduledMeetingHost) => void;
	onCancel: (meeting: ScheduledMeetingHost) => void;
}

const UpcomingMeetingsPanel: React.FC<UpcomingMeetingsPanelProps> = ({ meetings, onReschedule, onCancel }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const cardSx = {
		p: { xs: 2.5, sm: 3 }, borderRadius: '20px', height: '100%',
		bgcolor: 'background.paper',
		border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)',
		boxShadow: isDark ? '0 1px 2px rgba(0,0,0,0.4), 0 8px 20px rgba(0,0,0,0.2)' : '0 1px 2px rgba(15,23,42,0.04), 0 8px 20px rgba(15,23,42,0.05)',
	};

	const upcoming = useMemo(() => {
		const now = dayjs();
		return meetings
			.filter((m) => m.status === 'scheduled' && dayjs(m.end_time).isAfter(now))
			.sort((a, b) => dayjs(a.start_time).diff(dayjs(b.start_time)));
	}, [meetings]);

	const nextMeeting = upcoming[0];
	const todayCount = useMemo(() => upcoming.filter((m) => dayjs(m.start_time).isSame(dayjs(), 'day')).length, [upcoming]);

	return (
		<Box sx={cardSx}>
			<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
				<Typography variant="subtitle2" fontWeight={800}>Upcoming Meetings</Typography>
				<Chip label={upcoming.length} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
			</Stack>

			<Stack direction="row" spacing={1.5} sx={{ mb: 2.5 }}>
				<Box sx={{ flex: 1, p: 1.25, borderRadius: '12px', bgcolor: 'action.hover' }}>
					<Typography variant="h6" fontWeight={800} lineHeight={1.2}>{todayCount}</Typography>
					<Typography variant="caption" color="text.secondary">Today</Typography>
				</Box>
				<Box sx={{ flex: 1, p: 1.25, borderRadius: '12px', bgcolor: 'action.hover' }}>
					<Typography variant="h6" fontWeight={800} lineHeight={1.2}>{upcoming.length}</Typography>
					<Typography variant="caption" color="text.secondary">Upcoming</Typography>
				</Box>
			</Stack>

			{nextMeeting && (
				<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
					Next up: {dayjs(nextMeeting.start_time).format('ddd, MMM D · h:mm A')} with {nextMeeting.client_name}
				</Typography>
			)}

			{upcoming.length === 0 ? (
				<Stack spacing={1} alignItems="center" sx={{ py: 4, textAlign: 'center' }}>
					<EventBusyOutlined sx={{ fontSize: 28, color: 'text.disabled' }} />
					<Typography variant="caption" color="text.secondary">No upcoming meetings scheduled.</Typography>
				</Stack>
			) : (
				<Stack divider={<Divider />} sx={{ maxHeight: 460, overflowY: 'auto' }}>
					{upcoming.slice(0, 12).map((m) => (
						<Stack key={m.public_id} direction="row" spacing={1.25} alignItems="center" sx={{ py: 1.25 }}>
							<EnterpriseAvatar name={m.client_name} size={32} />
							<Box sx={{ minWidth: 0, flex: 1 }}>
								<Typography variant="body2" fontWeight={700} noWrap>{m.client_name}</Typography>
								<Typography variant="caption" color="text.secondary" noWrap>
									{dayjs(m.start_time).format('MMM D · h:mm A')}
								</Typography>
								<Box sx={{ mt: 0.5 }}>
									<StatusBadge type="googleSync" status={m.calendar_sync_status} label={SYNC_LABEL[m.calendar_sync_status] || m.calendar_sync_status} />
								</Box>
							</Box>
							<Stack direction="row" spacing={0.25}>
								{m.google_meet_link && (
									<Tooltip title="Join meeting">
										<IconButton size="small" component="a" href={m.google_meet_link} target="_blank" rel="noreferrer">
											<VideocamOutlined sx={{ fontSize: 16 }} />
										</IconButton>
									</Tooltip>
								)}
								<Tooltip title="Reschedule">
									<IconButton size="small" onClick={() => onReschedule(m)}>
										<EditOutlined sx={{ fontSize: 16 }} />
									</IconButton>
								</Tooltip>
								<Tooltip title="Cancel">
									<IconButton size="small" color="error" onClick={() => onCancel(m)}>
										<CloseOutlined sx={{ fontSize: 16 }} />
									</IconButton>
								</Tooltip>
							</Stack>
						</Stack>
					))}
				</Stack>
			)}
		</Box>
	);
};

export default UpcomingMeetingsPanel;
