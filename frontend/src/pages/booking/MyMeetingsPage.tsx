import React, { useEffect, useState } from 'react';
import { Box, Container, Button, TextField, Tabs, Tab, RadioGroup, FormControlLabel, Radio, Typography } from '@mui/material';
import PageHeader from '../../components/common/page-header';
import { responsiveStyles } from '../../theme';
import ConfirmationDialog from '../../components/common/dialogbox/ConfirmationDialog';
import {
	NewMeetingDialog, RescheduleMeetingDialog, CompleteMeetingDialog,
	WeekCalendarView, UpcomingMeetingsPanel, MeetingHistoryTable,
} from '../../components/booking';
import { useMeetingHistory } from '../../components/booking/meetings/hooks/useMeetingHistory';
import useToast from '../../hooks/useToast';
import bookingService from '../../services/bookingService';
import type { ScheduledMeetingHost } from '../../models/booking/meeting';

const MyMeetingsPage: React.FC = () => {
	const toast = useToast();

	const [activeTab, setActiveTab] = useState<'calendar' | 'history'>('calendar');

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
			const response = await bookingService.listMyMeetings({ status: 'scheduled', pageSize: 100 });
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
					<Button
						variant="contained" onClick={() => { setNewMeetingDate(undefined); setNewMeetingTime(undefined); setNewMeetingOpen(true); }}
						sx={{ background: (t) => t.gradients.brandDiagonal, textTransform: 'none', fontWeight: 700, borderRadius: 2, whiteSpace: 'nowrap' }}
					>
						+ New Meeting
					</Button>
				}
			/>

			<Tabs
				value={activeTab}
				onChange={(_e, value) => setActiveTab(value)}
				sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}
			>
				<Tab value="calendar" label="Calendar" sx={{ textTransform: 'none', fontWeight: 700 }} />
				<Tab value="history" label="History" sx={{ textTransform: 'none', fontWeight: 700 }} />
			</Tabs>

			{activeTab === 'calendar' ? (
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
			</Container>
		</Box>
	);
};

export default MyMeetingsPage;
