import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { searchContactOptions } from '../../../../store/slices/crmSlice';
import bookingService from '../../../../services/bookingService';
import useToast from '../../../../hooks/useToast';
import { MEETING_PAST_GRACE_MINUTES, type ScheduledMeetingHost, type OrgMemberOption, type MeetingLocationType, type RecurrenceRule } from '../../../../models/booking/meeting';
import type { Contact } from '../../../../models/crm/contact';

export const BROWSER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function generateIdempotencyKey(): string {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
	return `key-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function randomToken(length: number): string {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, '').slice(0, length);
	return Math.random().toString(36).slice(2, 2 + length);
}

/** The next quarter-hour from right now — used as the default Start time instead of
 * a fixed '09:00', which read as "in the past" (and got rejected by the backend's
 * past-time guard) for the entire rest of the day once it was already past 9 AM. */
function nextAvailableTimeSlot(): string {
	const d = new Date();
	const roundedMinutes = Math.ceil(d.getMinutes() / 15) * 15;
	d.setMinutes(roundedMinutes, 0, 0);
	return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
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

export function contactLabel(contact: Contact): string {
	return `${contact.first_name} ${contact.last_name || ''}`.trim();
}

interface UseNewMeetingDialogParams {
	open: boolean;
	initialDate?: string;
	initialTime?: string;
	onCreated: (meeting: ScheduledMeetingHost) => void;
	onClose: () => void;
}

export const useNewMeetingDialog = ({ open, initialDate, initialTime, onCreated, onClose }: UseNewMeetingDialogParams) => {
	const toast = useToast();
	const dispatch = useAppDispatch();
	const { contactOptions, contactOptionsLoading } = useAppSelector((state) => state.crm);

	const [meetingTitle, setMeetingTitle] = useState('');
	const [clientName, setClientName] = useState('');
	const [clientEmail, setClientEmail] = useState('');
	const [attendeeTimezone, setAttendeeTimezone] = useState(BROWSER_TZ);
	const [notes, setNotes] = useState('');
	const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
	const [selectedTime, setSelectedTime] = useState(nextAvailableTimeSlot);
	const [durationMinutes, setDurationMinutes] = useState(30);
	const [locationType, setLocationType] = useState<MeetingLocationType>('google_meet');
	const [locationDetail, setLocationDetail] = useState('');
	const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | ''>('');
	const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
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
			setRecurrenceRule('');
			setRecurrenceEndDate('');
			setDurationMinutes(30);
			setSelectedDate(initialDate || new Date().toISOString().slice(0, 10));
			setSelectedTime(initialTime || nextAvailableTimeSlot());
			bookingService.listOrgMembers().then(setOrgMembers).catch(() => setOrgMembers([]));
		}
	}, [open, initialDate, initialTime]);

	const idempotencyKey = useMemo(generateIdempotencyKey, [open]);

	const searchContacts = (query: string) => {
		dispatch(searchContactOptions({ search: query || undefined }));
	};

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

	const handleGenerateVideoLink = async () => {
		const link = generateVideoMeetingLink(meetingTitle || clientName || 'meeting');
		setLocationDetail(link);
		try {
			await navigator.clipboard.writeText(link);
			toast.success('Meeting link generated and copied to clipboard.');
		} catch {
			toast.success('Meeting link generated.');
		}
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
		if (recurrenceRule && !recurrenceEndDate) {
			toast.error('Pick an end date for the repeating series.');
			return;
		}
		const startTime = buildStartTime();
		if (startTime.getTime() < Date.now() - MEETING_PAST_GRACE_MINUTES * 60000) {
			toast.error(`Meeting time can't be more than ${MEETING_PAST_GRACE_MINUTES} minutes in the past.`);
			return;
		}
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
				recurrence_rule: recurrenceRule || undefined,
				recurrence_end_date: recurrenceRule ? recurrenceEndDate : undefined,
			});
			const created = meeting.occurrences_created ?? 1;
			toast.success(
				created > 1
					? `Created ${created} occurrence${created === 1 ? '' : 's'} of this meeting — invites have been sent.`
					: 'Meeting created — a calendar invite has been sent.'
			);
			onCreated(meeting);
			onClose();
		} catch (err: any) {
			toast.error(err?.response?.data?.error?.message || 'You already have a meeting scheduled during this time.');
		} finally {
			setSubmitting(false);
		}
	};

	return {
		contactOptions,
		contactOptionsLoading,
		searchContacts,
		meetingTitle,
		setMeetingTitle,
		clientName,
		setClientName,
		clientEmail,
		setClientEmail,
		attendeeTimezone,
		setAttendeeTimezone,
		notes,
		setNotes,
		selectedDate,
		setSelectedDate,
		selectedTime,
		setSelectedTime,
		durationMinutes,
		setDurationMinutes,
		locationType,
		setLocationType,
		locationDetail,
		setLocationDetail,
		recurrenceRule,
		setRecurrenceRule,
		recurrenceEndDate,
		setRecurrenceEndDate,
		submitting,
		orgMembers,
		participants,
		setParticipants,
		guestEmails,
		handleAddGuestEmails,
		handleGenerateVideoLink,
		handleSubmit,
	};
};
