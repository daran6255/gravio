import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Box, Container, Button, TextField, Tabs, Tab, RadioGroup, FormControlLabel, Radio, Typography, alpha } from '@mui/material';
import { CalendarMonthOutlined, HistoryOutlined, LinkOutlined, AutoAwesome as IrisIcon } from '@mui/icons-material';
import PageHeader from '../../components/common/page-header';
import { HelpGuideButton } from '../../components/common/button';
import { WelcomeBanner } from '../../components/common/guide';
import { useDismissibleBanner } from '../../hooks/useDismissibleBanner';
import { responsiveStyles } from '../../theme';
import ConfirmationDialog from '../../components/common/dialogbox/ConfirmationDialog';
import {
	NewMeetingDialog, RescheduleMeetingDialog, CompleteMeetingDialog,
	WeekCalendarView, UpcomingMeetingsPanel, MeetingHistoryTable, MeetingsGuideDrawer,
	AvailabilitySettingsPanel, IrisMeetingPanel,
} from '../../components/booking';
import { useMeetingHistory } from '../../components/booking/meetings/hooks/useMeetingHistory';
import { MEETINGS_GUIDE_CONTENT } from '../../data/meetingsGuideData';
import useToast from '../../hooks/useToast';
import bookingService from '../../services/bookingService';
import type { ScheduledMeetingHost } from '../../models/booking/meeting';

const MyMeetingsPage: React.FC = () => {
	const toast = useToast();

	const [guideOpen, setGuideOpen] = useState(false);
	const [irisOpen, setIrisOpen] = useState(false);
	const { show: showWelcome, dismiss: handleDismissWelcome } = useDismissibleBanner('dismissedMeetingsWelcome');

	const [activeTab, setActiveTab] = useState<'calendar' | 'history' | 'booking-page'>('calendar');

	const [calendarMeetings, setCalendarMeetings] = useState<ScheduledMeetingHost[]>([]);
	const [newMeetingOpen, setNewMeetingOpen] = useState(false);
	const [newMeetingDate, setNewMeetingDate] = useState<string | undefined>(undefined);
	const [newMeetingTime, setNewMeetingTime] = useState<string | undefined>(undefined);
	const [rescheduleTarget, setRescheduleTarget] = useState<ScheduledMeetingHost | null>(null);
	const [completeTarget, setCompleteTarget] = useState<ScheduledMeetingHost | null>(null);
	const [cancelTarget, setCancelTarget] = useState<ScheduledMeetingHost | null>(null);
	const [cancelReason, setCancelReason] = useState('');
	const [cancelScope, setCancelScope] = useState<'one' | 'series'>('one');
	const [cancelling, setCancelling] = useState(false);

	const history = useMeetingHistory({ scope: 'mine' });

	const loadCalendarMeetings = async () => {
		try {
			// No status filter — the week grid shows scheduled, completed, and cancelled
			// meetings alike. Bounded to the last 60 days onward so old history doesn't
			// crowd out the current/upcoming weeks within the page-size cap.
			const response = await bookingService.listMyMeetings({
				startAfter: dayjs().subtract(60, 'day').toISOString(),
				pageSize: 100,
			});
			setCalendarMeetings(response.items);
		} catch {
			// Non-fatal — the calendar just shows no events until the next refresh.
		}
	};

	useEffect(() => {
		loadCalendarMeetings();
	}, []);

	const refreshAll = () => {
		loadCalendarMeetings();
		history.refreshData();
	};

	const handleCancelConfirm = async () => {
		if (!cancelTarget) return;
		setCancelling(true);
		try {
			if (cancelScope === 'series' && cancelTarget.recurrence_group_id) {
				await bookingService.hostCancelMeetingSeries(cancelTarget.public_id, cancelReason || undefined);
				toast.success('This and all following meetings in the series were cancelled.');
			} else {
				await bookingService.hostCancelMeeting(cancelTarget.public_id, cancelReason || undefined);
				toast.success('Meeting cancelled.');
			}
			setCancelTarget(null);
			setCancelReason('');
			setCancelScope('one');
			refreshAll();
		} catch {
			toast.error('Failed to cancel meeting.');
		} finally {
			setCancelling(false);
		}
	};

	const handleMoveMeeting = async (meeting: ScheduledMeetingHost, newStartTimeISO: string) => {
		try {
			await bookingService.hostRescheduleMeeting(meeting.public_id, newStartTimeISO);
			toast.success('Meeting rescheduled.');
			loadCalendarMeetings();
		} catch (err: any) {
			toast.error(err?.response?.data?.error?.message || 'You already have a meeting scheduled during this time.');
		}
	};

	return (
		<Box component="main" sx={{ bgcolor: 'background.default' }}>
			<Container maxWidth={false} sx={responsiveStyles.pageContainer}>
			<PageHeader
				title="Meetings Overview"
				subtitle="Manage your upcoming and past meetings and client interactions."
				action={
					<Box sx={responsiveStyles.headerActionRow}>
						<Button
							variant="outlined"
							startIcon={<IrisIcon fontSize="small" />}
							onClick={() => setIrisOpen(true)}
							sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, whiteSpace: 'nowrap' }}
						>
							Ask IRIS
						</Button>
						<HelpGuideButton onClick={() => setGuideOpen(true)} />
						<Button
							variant="contained" onClick={() => { setNewMeetingDate(undefined); setNewMeetingTime(undefined); setNewMeetingOpen(true); }}
							sx={{ background: (t) => t.gradients.brandDiagonal, textTransform: 'none', fontWeight: 700, borderRadius: 2, whiteSpace: 'nowrap' }}
						>
							+ New Meeting
						</Button>
					</Box>
				}
			/>

			{showWelcome && (
				<WelcomeBanner
					icon={MEETINGS_GUIDE_CONTENT.icon}
					title={MEETINGS_GUIDE_CONTENT.banner.title}
					description={MEETINGS_GUIDE_CONTENT.banner.description}
					onExplore={() => setGuideOpen(true)}
					onDismiss={handleDismissWelcome}
				/>
			)}

			<Box sx={{ mb: 3 }}>
				<Tabs
					value={activeTab}
					onChange={(_e, value) => setActiveTab(value)}
					TabIndicatorProps={{ sx: { display: 'none' } }}
					sx={{
						minHeight: 'auto',
						bgcolor: 'action.hover',
						borderRadius: '12px',
						p: 0.5,
						width: 'fit-content',
						maxWidth: '100%',
						'& .MuiTabs-flexContainer': { gap: 0.5 },
						'& .MuiTab-root': {
							minHeight: 40,
							minWidth: 'auto',
							borderRadius: '9px',
							fontWeight: 700,
							fontSize: '0.8125rem',
							textTransform: 'none',
							color: 'text.secondary',
							px: 2,
							py: 1,
							transition: 'color 0.2s ease, background-color 0.2s ease',
						},
						'& .MuiTab-root .MuiTab-iconWrapper': {
							marginRight: '6px',
							fontSize: '1.1rem',
						},
						'& .MuiTab-root:hover': {
							color: 'text.primary',
							bgcolor: (theme) => alpha(theme.palette.text.primary, 0.04),
						},
						'& .Mui-selected': {
							color: 'primary.main !important',
							bgcolor: 'background.paper',
							boxShadow: (theme) => `0 1px 3px 0 ${alpha(theme.palette.common.black, theme.palette.mode === 'dark' ? 0.3 : 0.1)}`,
						},
					}}
				>
					<Tab value="calendar" label="Calendar" icon={<CalendarMonthOutlined fontSize="small" />} iconPosition="start" disableRipple />
					<Tab value="history" label="History" icon={<HistoryOutlined fontSize="small" />} iconPosition="start" disableRipple />
					<Tab value="booking-page" label="Booking Page" icon={<LinkOutlined fontSize="small" />} iconPosition="start" disableRipple />
				</Tabs>
			</Box>

			{activeTab === 'booking-page' ? (
				<AvailabilitySettingsPanel />
			) : activeTab === 'calendar' ? (
				<Box sx={responsiveStyles.contentWithSidebar}>
					<WeekCalendarView
						meetings={calendarMeetings}
						onSlotClick={(dateStr, timeStr) => { setNewMeetingDate(dateStr); setNewMeetingTime(timeStr); setNewMeetingOpen(true); }}
						onReschedule={setRescheduleTarget}
						onCancel={setCancelTarget}
						onComplete={setCompleteTarget}
						onMoveMeeting={handleMoveMeeting}
					/>
					<UpcomingMeetingsPanel
						meetings={calendarMeetings}
						onReschedule={setRescheduleTarget}
						onCancel={setCancelTarget}
					/>
				</Box>
			) : (
				<MeetingHistoryTable
					meetings={history.meetings}
					loading={history.loading}
					totalCount={history.totalCount}
					page={history.page}
					rowsPerPage={history.rowsPerPage}
					onPageChange={history.handlePageChange}
					onRowsPerPageChange={history.handleRowsPerPageChange}
					searchTerm={history.searchTerm}
					onSearchChange={history.handleSearchChange}
					statusFilter={history.statusFilter}
					onStatusFilterChange={history.handleStatusFilterChange}
					onRefresh={history.refreshData}
				/>
			)}

			<NewMeetingDialog
				open={newMeetingOpen}
				onClose={() => setNewMeetingOpen(false)}
				onCreated={() => refreshAll()}
				initialDate={newMeetingDate}
				initialTime={newMeetingTime}
			/>

			<RescheduleMeetingDialog
				open={!!rescheduleTarget}
				onClose={() => setRescheduleTarget(null)}
				meeting={rescheduleTarget}
				onRescheduled={() => refreshAll()}
			/>

			<CompleteMeetingDialog
				open={!!completeTarget}
				onClose={() => setCompleteTarget(null)}
				meeting={completeTarget}
				onCompleted={() => refreshAll()}
			/>

			<ConfirmationDialog
				open={!!cancelTarget}
				onClose={() => { setCancelTarget(null); setCancelReason(''); setCancelScope('one'); }}
				onConfirm={handleCancelConfirm}
				title="Cancel this meeting?"
				subtitle={cancelTarget ? `With ${cancelTarget.client_name}` : undefined}
				message="The client will be notified by email and their calendar invite will be cancelled automatically."
				severity="error"
				confirmLabel="Cancel Meeting"
				cancelLabel="Back"
				loading={cancelling}
			>
				{cancelTarget?.recurrence_group_id && (
					<RadioGroup
						value={cancelScope}
						onChange={(e) => setCancelScope(e.target.value as 'one' | 'series')}
						sx={{ mb: 1 }}
					>
						<FormControlLabel value="one" control={<Radio size="small" />} label={<Typography variant="body2">This meeting only</Typography>} />
						<FormControlLabel value="series" control={<Radio size="small" />} label={<Typography variant="body2">This and all following meetings</Typography>} />
					</RadioGroup>
				)}
				<TextField
					fullWidth multiline minRows={2}
					label="Reason (optional, shared with the client)"
					value={cancelReason}
					onChange={(e) => setCancelReason(e.target.value)}
				/>
			</ConfirmationDialog>

			<MeetingsGuideDrawer
				open={guideOpen}
				onClose={() => setGuideOpen(false)}
			/>

			<IrisMeetingPanel
				open={irisOpen}
				onClose={() => setIrisOpen(false)}
				onActionConfirmed={refreshAll}
			/>
			</Container>
		</Box>
	);
};

export default MyMeetingsPage;
