import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container, Box, Typography, CircularProgress, Paper, Stack, useTheme, Fade } from '@mui/material';
import {
	ErrorOutline as ErrorIcon,
	EventBusyOutlined,
	HourglassEmptyOutlined,
	CalendarMonthOutlined,
	CheckCircleOutline,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import bookingService from '../../../services/bookingService';
import JitsiEmbed from '../../../components/booking/meetings/JitsiEmbed';
import { useColorMode } from '../../../theme/ThemeContext';
import type { MeetingJoinInfo, MeetingJoinReason } from '../../../models/booking/meeting';

const NOT_JOINABLE_COPY: Record<MeetingJoinReason, { icon: React.ReactElement; title: string; describe: (info: MeetingJoinInfo) => string }> = {
	not_started: {
		icon: <HourglassEmptyOutlined sx={{ fontSize: 64 }} />,
		title: "It's Not Time Yet",
		describe: (info) => `This call opens 15 minutes before the scheduled start — ${dayjs(info.start_time).format('dddd, MMMM D [at] h:mm A')}.`,
	},
	ended: {
		icon: <EventBusyOutlined sx={{ fontSize: 64 }} />,
		title: 'This Meeting Has Ended',
		describe: () => "This link was only active for the meeting's scheduled time, which has now passed.",
	},
	cancelled: {
		icon: <EventBusyOutlined sx={{ fontSize: 64 }} />,
		title: 'This Meeting Was Cancelled',
		describe: () => 'The host cancelled this meeting, so the video call is no longer available.',
	},
	no_video_link: {
		icon: <ErrorIcon sx={{ fontSize: 64 }} />,
		title: 'No Video Call Here',
		describe: () => "This meeting doesn't have a video call link to join.",
	},
};

const JoinMeetingPage: React.FC = () => {
	const theme = useTheme();
	const { mode: colorMode } = useColorMode();
	const [searchParams] = useSearchParams();
	const token = searchParams.get('token');

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [info, setInfo] = useState<MeetingJoinInfo | null>(null);
	const [hasLeft, setHasLeft] = useState(false);

	useEffect(() => {
		if (!token) {
			setError('This meeting link is missing its token.');
			setLoading(false);
			return;
		}
		bookingService.publicGetMeetingJoinInfo(token)
			.then(setInfo)
			.catch((err: any) => {
				setError(err?.response?.data?.error?.message || 'This meeting link is invalid or has expired.');
			})
			.finally(() => setLoading(false));
	}, [token]);

	if (!loading && !hasLeft && info?.joinable && info.jitsi_domain && info.jitsi_room) {
		return (
			<Box component="main" sx={{ width: '100vw', height: '100dvh', bgcolor: '#000' }}>
				<JitsiEmbed
					domain={info.jitsi_domain}
					room={info.jitsi_room}
					subject={info.meeting_title}
					onLoadError={() => setError('Failed to load the video call.')}
					onMeetingEnded={() => setHasLeft(true)}
				/>
			</Box>
		);
	}

	if (hasLeft) {
		return (
			<Box
				component="main"
				sx={{
					minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
					backgroundColor: theme.palette.background.default,
					backgroundImage: `radial-gradient(circle at 50% 50%, ${theme.palette.background.default} 0%, ${theme.palette.secondary.dark}20 100%)`,
					py: 6,
				}}
			>
				<Container maxWidth="sm">
					<Box sx={{ mb: 4, textAlign: 'center' }}>
						<Box
							component="img"
							src={colorMode === 'dark' ? '/assets/img/logo/gravit-dark.svg' : '/assets/img/logo/gravit-light.svg'}
							alt="Gravit Logo"
							sx={{ height: 48, mb: 1.5 }}
						/>
					</Box>
					<Fade in timeout={400}>
						<Paper
							elevation={1}
							sx={{
								p: { xs: 3, sm: 5 }, borderRadius: 2, textAlign: 'center',
								backgroundColor: theme.palette.background.paper,
								border: `1px solid ${theme.palette.divider}`,
							}}
						>
							<Stack alignItems="center" spacing={2} sx={{ py: 2 }}>
								<CheckCircleOutline sx={{ fontSize: 64, color: theme.palette.success.main }} />
								<Typography variant="h6" fontWeight={700}>You've Left the Meeting</Typography>
								<Typography variant="body2" color="text.secondary">
									You can safely close this tab now.
								</Typography>
							</Stack>
						</Paper>
					</Fade>
				</Container>
			</Box>
		);
	}

	const reasonCopy = info?.reason ? NOT_JOINABLE_COPY[info.reason] : null;

	return (
		<Box
			component="main"
			sx={{
				minHeight: '100vh',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				backgroundColor: theme.palette.background.default,
				backgroundImage: `radial-gradient(circle at 50% 50%, ${theme.palette.background.default} 0%, ${theme.palette.secondary.dark}20 100%)`,
				position: 'relative',
				overflow: 'hidden',
				py: 6,
			}}
		>
			<Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
				<Box sx={{ mb: 4, textAlign: 'center' }}>
					<Box
						component="img"
						src={colorMode === 'dark' ? '/assets/img/logo/gravit-dark.svg' : '/assets/img/logo/gravit-light.svg'}
						alt="Gravit Logo"
						sx={{ height: 48, mb: 1.5 }}
					/>
				</Box>

				<Fade in timeout={600}>
					<Paper
						elevation={1}
						sx={{
							p: { xs: 3, sm: 5 },
							borderRadius: 2,
							backgroundColor: theme.palette.background.paper,
							border: `1px solid ${theme.palette.divider}`,
							textAlign: 'center',
						}}
					>
						{loading && (
							<Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
								<CircularProgress size={32} />
								<Typography color="text.secondary">Checking the meeting…</Typography>
							</Stack>
						)}

						{!loading && error && (
							<Stack alignItems="center" spacing={2} sx={{ py: 2 }}>
								<ErrorIcon sx={{ fontSize: 64, color: theme.palette.error.main }} />
								<Typography variant="h6" fontWeight={700}>Link Invalid</Typography>
								<Typography variant="body2" color="text.secondary">{error}</Typography>
							</Stack>
						)}

						{!loading && !error && info && reasonCopy && (
							<Stack alignItems="center" spacing={2} sx={{ py: 2 }}>
								<Box sx={{ color: 'text.disabled' }}>{reasonCopy.icon}</Box>
								<Typography variant="h6" fontWeight={700}>{reasonCopy.title}</Typography>
								{info.meeting_title && (
									<Typography variant="body2" fontWeight={600}>
										{info.meeting_title}{info.host_name ? ` — hosted by ${info.host_name}` : ''}
									</Typography>
								)}
								<Typography variant="body2" color="text.secondary">{reasonCopy.describe(info)}</Typography>
								<Stack direction="row" spacing={1.25} alignItems="center" sx={{ mt: 1, p: 1.5, borderRadius: 1.5, bgcolor: 'action.hover' }}>
									<CalendarMonthOutlined sx={{ color: 'text.secondary', fontSize: 20 }} />
									<Typography variant="body2" color="text.secondary">
										{dayjs(info.start_time).format('dddd, MMM D · h:mm A')} – {dayjs(info.end_time).format('h:mm A')}
									</Typography>
								</Stack>
							</Stack>
						)}
					</Paper>
				</Fade>
			</Container>
		</Box>
	);
};

export default JoinMeetingPage;
