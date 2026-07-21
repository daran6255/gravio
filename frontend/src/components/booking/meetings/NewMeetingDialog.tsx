import React, { useEffect, useMemo, useState } from 'react';
import {
	Box, Stack, TextField, MenuItem, Typography, Divider,
	Autocomplete, Chip, CircularProgress, Button, InputAdornment, Tooltip,
} from '@mui/material';
import { VideocamOutlined, PlaceOutlined, PhoneOutlined, GroupsOutlined, VideoCallOutlined } from '@mui/icons-material';
import BaseDialog from '../../common/dialogbox/BaseDialog';
import { SubmitButton, CancelButton } from '../../common/button';
import RichTextEditor from '../../common/form/RichTextEditor';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { searchContactOptions } from '../../../store/slices/crmSlice';
import bookingService from '../../../services/bookingService';
import useToast from '../../../hooks/useToast';
import type { ScheduledMeetingHost, OrgMemberOption, MeetingLocationType } from '../../../models/booking/meeting';
import type { Contact } from '../../../models/crm/contact';

interface NewMeetingDialogProps {
	open: boolean;
	onClose: () => void;
	onCreated: (meeting: ScheduledMeetingHost) => void;
	/** Pre-select a date (YYYY-MM-DD) — e.g. when opened from a calendar day click. */
	initialDate?: string;
	/** Pre-select a time ("HH:MM") — e.g. when opened by clicking a specific spot in the week grid. */
	initialTime?: string;
}

const BROWSER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DURATIONS = [15, 30, 45, 60, 90, 120];

const LOCATION_OPTIONS: { value: MeetingLocationType; label: string; icon: React.ReactElement; detailLabel: string; detailPlaceholder: string }[] = [
	{ value: 'google_meet', label: 'Video call', icon: <VideocamOutlined sx={{ fontSize: 18 }} />, detailLabel: 'Meeting link', detailPlaceholder: 'Click "Generate" for an instant link, or paste your own' },
	{ value: 'offline', label: 'In person', icon: <PlaceOutlined sx={{ fontSize: 18 }} />, detailLabel: 'Address', detailPlaceholder: '123 Main Street, Suite 4, San Francisco, CA' },
	{ value: 'phone', label: 'Phone call', icon: <PhoneOutlined sx={{ fontSize: 18 }} />, detailLabel: 'Phone number', detailPlaceholder: '+1 (555) 123-4567' },
];

function generateIdempotencyKey(): string {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
	return `key-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function randomToken(length: number): string {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, '').slice(0, length);
	return Math.random().toString(36).slice(2, 2 + length);
}

/** Instant, keyless video-call room — no OAuth/account tied to any individual
 * host, no external API call, works the moment anyone opens the link. */
function generateVideoMeetingLink(seed: string): string {
	const slug = seed
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-+|-+$)/g, '')
		.slice(0, 28);
	const room = ['gravit', slug, randomToken(8)].filter(Boolean).join('-');
	return `https://meet.jit.si/${room}`;
}

function contactLabel(contact: Contact): string {
	return `${contact.first_name} ${contact.last_name || ''}`.trim();
}

const NewMeetingDialog: React.FC<NewMeetingDialogProps> = ({ open, onClose, onCreated, initialDate, initialTime }) => {
	const toast = useToast();
	const dispatch = useAppDispatch();
	const { contactOptions, contactOptionsLoading } = useAppSelector((state) => state.crm);

	const [meetingTitle, setMeetingTitle] = useState('');
	const [clientName, setClientName] = useState('');
	const [clientEmail, setClientEmail] = useState('');
	const [attendeeTimezone, setAttendeeTimezone] = useState(BROWSER_TZ);
	const [notes, setNotes] = useState('');
	const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
	const [selectedTime, setSelectedTime] = useState('09:00');
	const [durationMinutes, setDurationMinutes] = useState(30);
	const [locationType, setLocationType] = useState<MeetingLocationType>('google_meet');
	const [locationDetail, setLocationDetail] = useState('');
	const [submitting, setSubmitting] = useState(false);

	const [orgMembers, setOrgMembers] = useState<OrgMemberOption[]>([]);
	const [participants, setParticipants] = useState<OrgMemberOption[]>([]);
	const [guestEmails, setGuestEmails] = useState<string[]>([]);

	useEffect(() => {
		if (open) {
			setMeetingTitle('');
			setClientName('');
			setClientEmail('');
			setNotes('');
			setParticipants([]);
			setGuestEmails([]);
			setLocationType('google_meet');
			setLocationDetail('');
			setDurationMinutes(30);
			setSelectedDate(initialDate || new Date().toISOString().slice(0, 10));
			setSelectedTime(initialTime || '09:00');
			bookingService.listOrgMembers().then(setOrgMembers).catch(() => setOrgMembers([]));
		}
	}, [open, initialDate, initialTime]);

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

	const buildStartTime = (): Date => {
		const [h, m] = selectedTime.split(':').map(Number);
		const d = new Date(`${selectedDate}T00:00:00`);
		d.setHours(h, m, 0, 0);
		return d;
	};

	const handleSubmit = async () => {
		if (!clientName.trim() || !clientEmail.trim()) {
			toast.error('Fill in the client\'s name and email.');
			return;
		}
		if (locationType === 'offline' && !locationDetail.trim()) {
			toast.error('Add an address for an in-person meeting.');
			return;
		}
		const startTime = buildStartTime();
		const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
		setSubmitting(true);
		try {
			const meeting = await bookingService.hostCreateMeeting({
				start_time: startTime.toISOString(),
				end_time: endTime.toISOString(),
				meeting_title: meetingTitle.trim() || undefined,
				client_name: clientName,
				client_email: clientEmail,
				host_timezone: BROWSER_TZ,
				attendee_timezone: attendeeTimezone,
				meeting_notes: notes || undefined,
				location_type: locationType,
				location_detail: locationDetail.trim() || undefined,
				idempotency_key: idempotencyKey,
				participant_user_ids: participants.map((p) => p.id),
				guest_emails: guestEmails,
			});
			toast.success('Meeting created — a calendar invite has been sent.');
			onCreated(meeting);
			onClose();
		} catch (err: any) {
			toast.error(err?.response?.data?.error?.message || 'You already have a meeting scheduled during this time.');
		} finally {
			setSubmitting(false);
		}
	};

	const selectedLocation = LOCATION_OPTIONS.find((o) => o.value === locationType) || LOCATION_OPTIONS[0];

	return (
		<BaseDialog
			open={open}
			onClose={onClose}
			title="New Meeting"
			subtitle="Schedule a meeting directly — the client still gets a calendar invite automatically"
			maxWidth="md"
			loading={submitting}
			actions={
				<>
					<CancelButton onClick={onClose} disabled={submitting} />
					<SubmitButton onClick={handleSubmit} loading={submitting}>Create Meeting</SubmitButton>
				</>
			}
		>
			<Stack spacing={2.5}>
				<TextField
					label="Meeting title" fullWidth size="small"
					value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)}
					placeholder={clientName ? `Meeting with ${clientName}` : 'e.g. Discovery Call'}
				/>

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
					/>
					<TextField
						label="Start time" type="time" fullWidth size="small" value={selectedTime}
						onChange={(e) => setSelectedTime(e.target.value)}
						InputLabelProps={{ shrink: true }}
					/>
					<TextField
						select label="Duration" fullWidth size="small"
						value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))}
					>
						{DURATIONS.map((d) => <MenuItem key={d} value={d}>{d} minutes</MenuItem>)}
					</TextField>
				</Stack>

				<TextField
					select label="Client timezone" fullWidth size="small"
					value={attendeeTimezone} onChange={(e) => setAttendeeTimezone(e.target.value)}
				>
					{(Intl.supportedValuesOf?.('timeZone') || [BROWSER_TZ]).map((tz: string) => (
						<MenuItem key={tz} value={tz}>{tz}</MenuItem>
					))}
				</TextField>

				{/* Location — video calls can generate an instant, keyless meeting link; other types are filled in manually */}
				<Box>
					<Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
						{selectedLocation.icon}
						<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>LOCATION</Typography>
					</Stack>
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
						<TextField
							select label="Meeting type" fullWidth size="small"
							value={locationType} onChange={(e) => setLocationType(e.target.value as MeetingLocationType)}
						>
							{LOCATION_OPTIONS.map((opt) => (
								<MenuItem key={opt.value} value={opt.value}>
									<Stack direction="row" spacing={1} alignItems="center">
										{opt.icon}
										<span>{opt.label}</span>
									</Stack>
								</MenuItem>
							))}
						</TextField>
						<TextField
							label={selectedLocation.detailLabel} fullWidth size="small"
							value={locationDetail} onChange={(e) => setLocationDetail(e.target.value)}
							placeholder={selectedLocation.detailPlaceholder}
							InputProps={locationType === 'google_meet' ? {
								endAdornment: (
									<InputAdornment position="end">
										<Tooltip title="Create an instant video-call link — no account or sign-in needed">
											<Button
												size="small"
												startIcon={<VideoCallOutlined sx={{ fontSize: 16 }} />}
												onClick={async () => {
													const link = generateVideoMeetingLink(meetingTitle || clientName || 'meeting');
													setLocationDetail(link);
													try {
														await navigator.clipboard.writeText(link);
														toast.success('Meeting link generated and copied to clipboard.');
													} catch {
														toast.success('Meeting link generated.');
													}
												}}
												sx={{ textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}
											>
												Generate
											</Button>
										</Tooltip>
									</InputAdornment>
								),
							} : undefined}
						/>
					</Stack>
				</Box>

				{/* Participants — invite teammates (their own calendar gets the invite too) and any extra external guests */}
				<Box>
					<Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
						<GroupsOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
						<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>PARTICIPANTS</Typography>
					</Stack>
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
						{orgMembers.length > 0 && (
							<Autocomplete
								multiple
								fullWidth
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
							fullWidth
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
