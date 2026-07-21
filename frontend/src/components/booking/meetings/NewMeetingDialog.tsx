import React, { useEffect, useMemo, useState } from 'react';
import {
	Box, Stack, TextField, MenuItem, Typography, Button, CircularProgress, Divider,
	Autocomplete, Chip,
} from '@mui/material';
import { EventOutlined, VideocamOutlined, PlaceOutlined, PhoneOutlined, GroupsOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import BaseDialog from '../../common/dialogbox/BaseDialog';
import { SubmitButton, CancelButton } from '../../common/button';
import RichTextEditor from '../../common/form/RichTextEditor';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { searchContactOptions } from '../../../store/slices/crmSlice';
import bookingService from '../../../services/bookingService';
import useToast from '../../../hooks/useToast';
import type { BookingPage, BookingLocationType } from '../../../models/booking/bookingPage';
import type { AvailableSlot, ScheduledMeetingHost, OrgMemberOption } from '../../../models/booking/meeting';
import type { Contact } from '../../../models/crm/contact';

interface NewMeetingDialogProps {
	open: boolean;
	onClose: () => void;
	bookingPages: BookingPage[];
	onCreated: (meeting: ScheduledMeetingHost) => void;
	/** Pre-select a date (YYYY-MM-DD) — e.g. when opened from a calendar day click. */
	initialDate?: string;
	/** Auto-select the slot closest to this "HH:MM" time once loaded — e.g. when
	 * opened by clicking a specific spot in the week grid. */
	initialTime?: string;
}

const BROWSER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LOCATION_INFO: Record<BookingLocationType, { icon: React.ReactElement; label: string }> = {
	google_meet: { icon: <VideocamOutlined sx={{ fontSize: 18 }} />, label: 'Google Meet — link generated automatically when this meeting is created' },
	offline: { icon: <PlaceOutlined sx={{ fontSize: 18 }} />, label: 'In person' },
	phone: { icon: <PhoneOutlined sx={{ fontSize: 18 }} />, label: 'Phone call' },
};

function timeStrToMinutes(t: string): number {
	const [h, m] = t.split(':').map(Number);
	return h * 60 + m;
}

function generateIdempotencyKey(): string {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
	return `key-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function contactLabel(contact: Contact): string {
	return `${contact.first_name} ${contact.last_name || ''}`.trim();
}

const NewMeetingDialog: React.FC<NewMeetingDialogProps> = ({ open, onClose, bookingPages, onCreated, initialDate, initialTime }) => {
	const toast = useToast();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { contactOptions, contactOptionsLoading } = useAppSelector((state) => state.crm);

	const [selectedPageId, setSelectedPageId] = useState(bookingPages[0]?.public_id || '');
	const [clientName, setClientName] = useState('');
	const [clientEmail, setClientEmail] = useState('');
	const [attendeeTimezone, setAttendeeTimezone] = useState(BROWSER_TZ);
	const [notes, setNotes] = useState('');
	const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
	const [slots, setSlots] = useState<AvailableSlot[]>([]);
	const [slotsLoading, setSlotsLoading] = useState(false);
	const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const [orgMembers, setOrgMembers] = useState<OrgMemberOption[]>([]);
	const [participants, setParticipants] = useState<OrgMemberOption[]>([]);
	const [guestEmails, setGuestEmails] = useState<string[]>([]);

	const selectedPage = bookingPages.find((p) => p.public_id === selectedPageId) || null;

	useEffect(() => {
		if (open) {
			setSelectedPageId(bookingPages[0]?.public_id || '');
			setClientName('');
			setClientEmail('');
			setNotes('');
			setParticipants([]);
			setGuestEmails([]);
			setSelectedDate(initialDate || new Date().toISOString().slice(0, 10));
			setSelectedSlot(null);
			bookingService.listOrgMembers().then(setOrgMembers).catch(() => setOrgMembers([]));
		}
	}, [open, bookingPages, initialDate]);

	useEffect(() => {
		if (!open || !selectedPage) return;
		setSlotsLoading(true);
		setSelectedSlot(null);
		bookingService.getAvailableSlots(selectedPage.slug, selectedDate, BROWSER_TZ)
			.then((res) => {
				setSlots(res.slots);
				// Auto-select the slot closest to where the user clicked in the week
				// grid, so a single click there is usually all it takes.
				if (initialTime && selectedDate === initialDate && res.slots.length > 0) {
					const targetMinutes = timeStrToMinutes(initialTime);
					const nearest = res.slots.reduce((best, s) => {
						const d = new Date(s.start_time);
						const mins = d.getHours() * 60 + d.getMinutes();
						const bestMins = best ? new Date(best.start_time).getHours() * 60 + new Date(best.start_time).getMinutes() : Infinity;
						return Math.abs(mins - targetMinutes) < Math.abs(bestMins - targetMinutes) ? s : best;
					}, res.slots[0]);
					setSelectedSlot(nearest);
				}
			})
			.catch(() => setSlots([]))
			.finally(() => setSlotsLoading(false));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, selectedPage, selectedDate]);

	const idempotencyKey = useMemo(generateIdempotencyKey, [open]);

	const handleAddGuestEmails = (raw: string[]) => {
		const valid: string[] = [];
		let hadInvalid = false;
		for (const entry of raw) {
			const email = entry.trim();
			if (!email) continue;
			if (EMAIL_RE.test(email) && !guestEmails.includes(email) && email.toLowerCase() !== clientEmail.toLowerCase()) {
				valid.push(email);
			} else if (!EMAIL_RE.test(email)) {
				hadInvalid = true;
			}
		}
		if (hadInvalid) toast.error('One or more guest emails looked invalid and were skipped.');
		if (valid.length) setGuestEmails((prev) => [...prev, ...valid]);
	};

	const handleSubmit = async () => {
		if (!selectedPage) {
			toast.error('Select a booking page first.');
			return;
		}
		if (!selectedSlot || !clientName.trim() || !clientEmail.trim()) {
			toast.error('Pick a time and fill in the client\'s name and email.');
			return;
		}
		setSubmitting(true);
		try {
			const meeting = await bookingService.hostCreateMeeting({
				booking_page_public_id: selectedPage.public_id,
				start_time: selectedSlot.start_time,
				client_name: clientName,
				client_email: clientEmail,
				attendee_timezone: attendeeTimezone,
				meeting_notes: notes || undefined,
				idempotency_key: idempotencyKey,
				participant_user_ids: participants.map((p) => p.id),
				guest_emails: guestEmails,
			});
			toast.success('Meeting created — a calendar invite has been sent.');
			onCreated(meeting);
			onClose();
		} catch (err: any) {
			toast.error(err?.response?.data?.error?.message || 'That time is no longer available. Please pick another.');
			if (selectedPage) {
				const res = await bookingService.getAvailableSlots(selectedPage.slug, selectedDate, BROWSER_TZ);
				setSlots(res.slots);
				setSelectedSlot(null);
			}
		} finally {
			setSubmitting(false);
		}
	};

	if (bookingPages.length === 0) {
		return (
			<BaseDialog open={open} onClose={onClose} title="New Meeting" maxWidth="xs">
				<Stack spacing={2} alignItems="center" sx={{ textAlign: 'center', py: 2 }}>
					<Typography variant="body2" color="text.secondary">
						You need a booking page before you can create a meeting.
					</Typography>
					<Button variant="contained" onClick={() => { onClose(); navigate('/booking/setup'); }}>
						Set Up Booking Page
					</Button>
				</Stack>
			</BaseDialog>
		);
	}

	const locationInfo = selectedPage ? LOCATION_INFO[selectedPage.location_type] : null;
	const locationDetail = selectedPage?.location_type === 'offline' ? (selectedPage.offline_address || 'Address not set') : locationInfo?.label;

	return (
		<BaseDialog
			open={open}
			onClose={onClose}
			title="New Meeting"
			subtitle="Book a meeting directly — the client still gets a calendar invite automatically"
			maxWidth="md"
			loading={submitting}
			actions={
				<>
					<CancelButton onClick={onClose} disabled={submitting} />
					<SubmitButton onClick={handleSubmit} loading={submitting} disabled={!selectedSlot}>Create Meeting</SubmitButton>
				</>
			}
		>
			<Stack spacing={2.5}>
				{bookingPages.length > 1 && (
					<TextField
						select label="Booking page" fullWidth size="small"
						value={selectedPageId} onChange={(e) => setSelectedPageId(e.target.value)}
					>
						{bookingPages.map((p) => <MenuItem key={p.public_id} value={p.public_id}>{p.title}</MenuItem>)}
					</TextField>
				)}

				{/* Client — pick from CRM contacts, or type a brand-new client's name */}
				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
					<Autocomplete
						freeSolo
						fullWidth
						options={contactOptions}
						getOptionLabel={(option) => (typeof option === 'string' ? option : contactLabel(option))}
						filterOptions={(x) => x}
						loading={contactOptionsLoading}
						inputValue={clientName}
						onInputChange={(_e, value, reason) => {
							setClientName(value);
							if (reason === 'input') dispatch(searchContactOptions({ search: value || undefined }));
						}}
						onChange={(_e, value) => {
							if (value && typeof value !== 'string') {
								setClientName(contactLabel(value));
								if (value.email) setClientEmail(value.email);
							}
						}}
						renderInput={(params) => (
							<TextField
								{...params}
								label="Client name"
								size="small"
								placeholder="Search your clients or type a new name"
								InputProps={{
									...params.InputProps,
									endAdornment: (
										<>
											{contactOptionsLoading && <CircularProgress color="inherit" size={16} />}
											{params.InputProps.endAdornment}
										</>
									),
								}}
							/>
						)}
					/>
					<TextField
						label="Client email" type="email" fullWidth size="small"
						value={clientEmail} onChange={(e) => setClientEmail(e.target.value)}
					/>
				</Stack>

				<Divider />

				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
					<TextField
						label="Date" type="date" fullWidth size="small" value={selectedDate}
						onChange={(e) => setSelectedDate(e.target.value)}
						InputLabelProps={{ shrink: true }}
						inputProps={{ min: new Date().toISOString().slice(0, 10) }}
					/>
					<TextField
						select label="Client timezone" fullWidth size="small"
						value={attendeeTimezone} onChange={(e) => setAttendeeTimezone(e.target.value)}
					>
						{(Intl.supportedValuesOf?.('timeZone') || [BROWSER_TZ]).map((tz: string) => (
							<MenuItem key={tz} value={tz}>{tz}</MenuItem>
						))}
					</TextField>
				</Stack>

				<Box>
					<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>
						AVAILABLE TIMES
					</Typography>
					{slotsLoading ? (
						<CircularProgress size={22} />
					) : slots.length === 0 ? (
						<Typography variant="body2" color="text.secondary">No open times on this date.</Typography>
					) : (
						<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
							{slots.map((s) => (
								<Button
									key={s.start_time}
									size="small"
									variant={selectedSlot?.start_time === s.start_time ? 'contained' : 'outlined'}
									onClick={() => setSelectedSlot(s)}
									sx={{ borderRadius: 2, textTransform: 'none' }}
								>
									{new Date(s.start_time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
								</Button>
							))}
						</Box>
					)}
				</Box>

				{selectedSlot && (
					<Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main', fontWeight: 700 }}>
						<EventOutlined sx={{ fontSize: 14 }} />
						{new Date(selectedSlot.start_time).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}
					</Typography>
				)}

				{/* Location — informational, driven by the selected booking page's own setup */}
				{locationInfo && (
					<Stack
						direction="row" spacing={1.25} alignItems="center"
						sx={{ p: 1.25, borderRadius: '10px', bgcolor: 'action.hover', color: 'text.secondary' }}
					>
						{locationInfo.icon}
						<Typography variant="caption" sx={{ fontWeight: 600 }}>{locationDetail}</Typography>
					</Stack>
				)}

				{/* Participants — invite teammates (their own calendar gets the invite too) and any extra external guests */}
				<Box>
					<Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
						<GroupsOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
						<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>PARTICIPANTS</Typography>
					</Stack>
					<Stack spacing={1.5}>
						{orgMembers.length > 0 && (
							<Autocomplete
								multiple
								size="small"
								options={orgMembers}
								getOptionLabel={(o) => o.full_name || o.email}
								isOptionEqualToValue={(o, v) => o.id === v.id}
								value={participants}
								onChange={(_e, value) => setParticipants(value)}
								renderTags={(value, getTagProps) =>
									value.map((option, index) => (
										<Chip label={option.full_name || option.email} size="small" {...getTagProps({ index })} />
									))
								}
								renderInput={(params) => (
									<TextField {...params} label="Invite teammates (optional)" placeholder="Add a colleague" size="small" />
								)}
							/>
						)}
						<Autocomplete
							multiple
							freeSolo
							size="small"
							options={[]}
							value={guestEmails}
							onChange={(_e, value) => handleAddGuestEmails(value as string[])}
							renderTags={(value, getTagProps) =>
								value.map((option, index) => (
									<Chip label={option} size="small" {...getTagProps({ index })} />
								))
							}
							renderInput={(params) => (
								<TextField {...params} label="Additional guests (optional)" placeholder="Type an email and press Enter" size="small" />
							)}
						/>
					</Stack>
				</Box>

				<Box>
					<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>
						NOTES (OPTIONAL)
					</Typography>
					<RichTextEditor
						value={notes}
						onChange={setNotes}
						placeholder="Add context for this meeting…"
						minHeight={100}
						variant="simple"
						error={false}
					/>
				</Box>
			</Stack>
		</BaseDialog>
	);
};

export default NewMeetingDialog;
