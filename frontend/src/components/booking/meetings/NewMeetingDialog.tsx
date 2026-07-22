import React from 'react';
import {
	Dialog, Box, Stack, TextField, MenuItem, Typography, Alert,
	Autocomplete, Chip, CircularProgress, Button, InputAdornment, Tooltip,
} from '@mui/material';
import { VideocamOutlined, PlaceOutlined, PhoneOutlined, VideoCallOutlined } from '@mui/icons-material';
import { EnterpriseForm, RichTextEditor, type FormStep } from '../../common/form';
import { useNewMeetingDialog, BROWSER_TZ, contactLabel } from './hooks/useNewMeetingDialog';
import type { ScheduledMeetingHost, MeetingLocationType, RecurrenceRule } from '../../../models/booking/meeting';

interface NewMeetingDialogProps {
	open: boolean;
	onClose: () => void;
	onCreated: (meeting: ScheduledMeetingHost) => void;
	/** Pre-select a date (YYYY-MM-DD) — e.g. when opened from a calendar day click. */
	initialDate?: string;
	/** Pre-select a time ("HH:MM") — e.g. when opened by clicking a specific spot in the week grid. */
	initialTime?: string;
}

const DURATIONS = [15, 30, 45, 60, 90, 120];

const REPEAT_OPTIONS: { value: RecurrenceRule | ''; label: string }[] = [
	{ value: '', label: "Doesn't repeat" },
	{ value: 'daily', label: 'Daily' },
	{ value: 'weekly', label: 'Weekly' },
	{ value: 'biweekly', label: 'Every 2 weeks' },
	{ value: 'monthly', label: 'Monthly' },
];

const LOCATION_OPTIONS: { value: MeetingLocationType; label: string; icon: React.ReactElement; detailLabel: string; detailPlaceholder: string }[] = [
	{ value: 'google_meet', label: 'Video call', icon: <VideocamOutlined sx={{ fontSize: 18 }} />, detailLabel: 'Meeting link', detailPlaceholder: 'Click "Generate" for an instant link, or paste your own' },
	{ value: 'offline', label: 'In person', icon: <PlaceOutlined sx={{ fontSize: 18 }} />, detailLabel: 'Address', detailPlaceholder: '123 Main Street, Suite 4, San Francisco, CA' },
	{ value: 'phone', label: 'Phone call', icon: <PhoneOutlined sx={{ fontSize: 18 }} />, detailLabel: 'Phone number', detailPlaceholder: '+1 (555) 123-4567' },
];

const NewMeetingDialog: React.FC<NewMeetingDialogProps> = (props) => {
	const { open, onClose } = props;
	const {
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
	} = useNewMeetingDialog(props);

	const selectedLocation = LOCATION_OPTIONS.find((o) => o.value === locationType) || LOCATION_OPTIONS[0];

	const steps: FormStep[] = [
		{
			label: 'Client',
			description: 'Meeting title and who it\'s with',
			content: (
				<Stack spacing={2.5} sx={{ mt: 1 }}>
					<Alert severity="info" sx={{ borderRadius: 2 }}>
						Search your existing CRM contacts or type a brand-new client's name — either way, they'll get a calendar invite automatically once the meeting is created.
					</Alert>

					<TextField
						label="Meeting title" fullWidth
						value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)}
						placeholder={clientName ? `Meeting with ${clientName}` : 'e.g. Discovery Call'}
					/>

					{/* Pick from CRM contacts, or type a brand-new client's name */}
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
								if (reason === 'input') searchContacts(value);
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
							label="Client email" type="email" fullWidth
							value={clientEmail} onChange={(e) => setClientEmail(e.target.value)}
						/>
					</Stack>
				</Stack>
			),
		},
		{
			label: 'Schedule',
			description: 'Date, time, recurrence, and timezone',
			content: (
				<Stack spacing={2.5} sx={{ mt: 1 }}>
					<Alert severity="info" sx={{ borderRadius: 2 }}>
						Date and time are set in your own timezone — the client sees everything converted to the timezone you pick below, so the invite always shows the right local time for them.
					</Alert>

					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
						<TextField
							label="Date" type="date" fullWidth value={selectedDate}
							onChange={(e) => setSelectedDate(e.target.value)}
							InputLabelProps={{ shrink: true }}
						/>
						<TextField
							label="Start time" type="time" fullWidth value={selectedTime}
							onChange={(e) => setSelectedTime(e.target.value)}
							InputLabelProps={{ shrink: true }}
						/>
						<TextField
							select label="Duration" fullWidth
							value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))}
						>
							{DURATIONS.map((d) => <MenuItem key={d} value={d}>{d} minutes</MenuItem>)}
						</TextField>
					</Stack>

					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
						<TextField
							select label="Repeat" fullWidth
							value={recurrenceRule} onChange={(e) => setRecurrenceRule(e.target.value as RecurrenceRule | '')}
						>
							{REPEAT_OPTIONS.map((opt) => <MenuItem key={opt.value || 'none'} value={opt.value}>{opt.label}</MenuItem>)}
						</TextField>
						<TextField
							select label="Client timezone" fullWidth
							value={attendeeTimezone} onChange={(e) => setAttendeeTimezone(e.target.value)}
						>
							{(Intl.supportedValuesOf?.('timeZone') || [BROWSER_TZ]).map((tz: string) => (
								<MenuItem key={tz} value={tz}>{tz}</MenuItem>
							))}
						</TextField>
					</Stack>

					{recurrenceRule && (
						<>
							<TextField
								label="Ends on" type="date" fullWidth value={recurrenceEndDate}
								onChange={(e) => setRecurrenceEndDate(e.target.value)}
								InputLabelProps={{ shrink: true }}
							/>
							<Alert severity="info" sx={{ borderRadius: 2 }}>
								A separate meeting occurrence is created for every date in the series, each with its own invite — the client gets one email per occurrence.
							</Alert>
						</>
					)}
				</Stack>
			),
		},
		{
			label: 'Location',
			description: 'Where it happens, and who else joins',
			content: (
				<Stack spacing={2.5} sx={{ mt: 1 }}>
					<Alert severity="info" sx={{ borderRadius: 2 }}>
						Teammates you invite get their own calendar invite for this meeting; additional guests just receive the meeting details by email — no account needed for either.
					</Alert>

					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
						<TextField
							select label="Meeting type" fullWidth
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
							label={selectedLocation.detailLabel} fullWidth
							value={locationDetail} onChange={(e) => setLocationDetail(e.target.value)}
							placeholder={selectedLocation.detailPlaceholder}
							InputProps={locationType === 'google_meet' ? {
								endAdornment: (
									<InputAdornment position="end">
										<Tooltip title="Create an instant video-call link — no account or sign-in needed">
											<Button
												size="small"
												startIcon={<VideoCallOutlined sx={{ fontSize: 16 }} />}
												onClick={handleGenerateVideoLink}
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

					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
						{orgMembers.length > 0 && (
							<Autocomplete
								multiple
								fullWidth
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
									<TextField {...params} label="Invite teammates (optional)" placeholder="Add a colleague" />
								)}
							/>
						)}
						<Autocomplete
							multiple
							freeSolo
							fullWidth
							options={[]}
							value={guestEmails}
							onChange={(_e, value) => handleAddGuestEmails(value as string[])}
							renderTags={(value, getTagProps) =>
								value.map((option, index) => (
									<Chip label={option} size="small" {...getTagProps({ index })} />
								))
							}
							renderInput={(params) => (
								<TextField {...params} label="Additional guests (optional)" placeholder="Type an email and press Enter" />
							)}
						/>
					</Stack>
				</Stack>
			),
		},
		{
			label: 'Notes',
			description: 'Optional context for this meeting',
			content: (
				<Stack spacing={2.5} sx={{ mt: 1 }}>
					<Alert severity="info" sx={{ borderRadius: 2 }}>
						Anything you write here is included in the calendar invite sent to the client and any guests — a good place for an agenda or prep instructions.
					</Alert>

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
			),
		},
	];

	return (
		<Dialog
			open={open}
			onClose={submitting ? undefined : onClose}
			maxWidth="md"
			fullWidth
			PaperProps={{ sx: { borderRadius: 0, boxShadow: 'none', bgcolor: 'transparent' } }}
		>
			<EnterpriseForm
				title="New Meeting"
				subtitle="Schedule a meeting directly — the client still gets a calendar invite automatically"
				mode="create"
				steps={steps}
				onSave={handleSubmit}
				onCancel={onClose}
				isSubmitting={submitting}
				saveButtonText="Create Meeting"
			/>
		</Dialog>
	);
};

export default NewMeetingDialog;
