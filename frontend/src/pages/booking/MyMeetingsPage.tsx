import React, { useEffect, useState } from 'react';
import { Box, Container, Button, TextField } from '@mui/material';
import PageHeader from '../../components/common/page-header';
import { responsiveStyles } from '../../theme';
import ConfirmationDialog from '../../components/common/dialogbox/ConfirmationDialog';
import { NewMeetingDialog, RescheduleMeetingDialog, WeekCalendarView, UpcomingMeetingsPanel } from '../../components/booking';
import useToast from '../../hooks/useToast';
import bookingService from '../../services/bookingService';
import type { ScheduledMeetingHost } from '../../models/booking/meeting';
import type { BookingPage, BookingAvailabilityException } from '../../models/booking/bookingPage';

const MyMeetingsPage: React.FC = () => {
	const toast = useToast();

	const [bookingPages, setBookingPages] = useState<BookingPage[]>([]);
	const [calendarMeetings, setCalendarMeetings] = useState<ScheduledMeetingHost[]>([]);
	const [exceptions, setExceptions] = useState<BookingAvailabilityException[]>([]);
	const [newMeetingOpen, setNewMeetingOpen] = useState(false);
	const [newMeetingDate, setNewMeetingDate] = useState<string | undefined>(undefined);
	const [newMeetingTime, setNewMeetingTime] = useState<string | undefined>(undefined);
	const [rescheduleTarget, setRescheduleTarget] = useState<ScheduledMeetingHost | null>(null);
	const [cancelTarget, setCancelTarget] = useState<ScheduledMeetingHost | null>(null);
	const [cancelReason, setCancelReason] = useState('');
	const [cancelling, setCancelling] = useState(false);

	const primaryPage = bookingPages[0] || null;

	const loadCalendarMeetings = async () => {
		try {
			const response = await bookingService.listMyMeetings({ status: 'scheduled', pageSize: 100 });
			setCalendarMeetings(response.items);
		} catch {
			// Non-fatal — the calendar just shows no events until the next refresh.
		}
	};

	const loadExceptions = () => {
		if (!primaryPage) return;
		bookingService.listMyBookingPageExceptions(primaryPage.public_id).then(setExceptions).catch(() => {});
	};

	useEffect(() => {
		bookingService.listMyBookingPages().then(setBookingPages).catch(() => {});
		loadCalendarMeetings();
	}, []);

	useEffect(() => {
		loadExceptions();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [primaryPage]);

	const handleCancelConfirm = async () => {
		if (!cancelTarget) return;
		setCancelling(true);
		try {
			await bookingService.hostCancelMeeting(cancelTarget.public_id, cancelReason || undefined);
			toast.success('Meeting cancelled.');
			setCancelTarget(null);
			setCancelReason('');
			loadCalendarMeetings();
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
			toast.error(err?.response?.data?.error?.message || 'That time is no longer available. Please pick another.');
		}
	};

	const handleToggleBlockDay = async (dateStr: string, currentlyBlocked: boolean) => {
		if (!primaryPage) return;
		try {
			if (currentlyBlocked) {
				const existing = exceptions.find((e) => e.date === dateStr);
				if (existing) await bookingService.deleteMyBookingPageException(primaryPage.public_id, existing.id);
				toast.success('Day unblocked.');
			} else {
				await bookingService.createMyBookingPageException(primaryPage.public_id, { date: dateStr, is_blocked: true });
				toast.success('Day blocked — no new bookings can land here.');
			}
			loadExceptions();
		} catch {
			toast.error('Failed to update this date.');
		}
	};

	return (
		<Box component="main" sx={{ bgcolor: 'background.default' }}>
			<Container maxWidth={false} sx={responsiveStyles.pageContainer}>
			<PageHeader
				title="Meetings Overview"
				subtitle="Manage your upcoming and past bookings, calendar sync, and client interactions."
				action={
					<Button
						variant="contained" onClick={() => { setNewMeetingDate(undefined); setNewMeetingTime(undefined); setNewMeetingOpen(true); }}
						sx={{ background: (t) => t.gradients.brandDiagonal, textTransform: 'none', fontWeight: 700, borderRadius: 2, whiteSpace: 'nowrap' }}
					>
						+ New Meeting
					</Button>
				}
			/>

			<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '3fr 1fr' }, gap: 3, alignItems: 'start' }}>
				<WeekCalendarView
					bookingPage={primaryPage}
					meetings={calendarMeetings}
					exceptions={exceptions}
					onSlotClick={(dateStr, timeStr) => { setNewMeetingDate(dateStr); setNewMeetingTime(timeStr); setNewMeetingOpen(true); }}
					onToggleBlockDay={handleToggleBlockDay}
					onReschedule={setRescheduleTarget}
					onCancel={setCancelTarget}
					onMoveMeeting={handleMoveMeeting}
				/>
				<UpcomingMeetingsPanel
					meetings={calendarMeetings}
					onReschedule={setRescheduleTarget}
					onCancel={setCancelTarget}
				/>
			</Box>

			<NewMeetingDialog
				open={newMeetingOpen}
				onClose={() => setNewMeetingOpen(false)}
				bookingPages={bookingPages}
				onCreated={() => loadCalendarMeetings()}
				initialDate={newMeetingDate}
				initialTime={newMeetingTime}
			/>

			<RescheduleMeetingDialog
				open={!!rescheduleTarget}
				onClose={() => setRescheduleTarget(null)}
				meeting={rescheduleTarget}
				bookingPages={bookingPages}
				onRescheduled={() => loadCalendarMeetings()}
			/>

			<ConfirmationDialog
				open={!!cancelTarget}
				onClose={() => { setCancelTarget(null); setCancelReason(''); }}
				onConfirm={handleCancelConfirm}
				title="Cancel this meeting?"
				subtitle={cancelTarget ? `With ${cancelTarget.client_name}` : undefined}
				message="The client will be notified by email and their calendar invite will be cancelled automatically."
				severity="error"
				confirmLabel="Cancel Meeting"
				cancelLabel="Back"
				loading={cancelling}
			>
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
