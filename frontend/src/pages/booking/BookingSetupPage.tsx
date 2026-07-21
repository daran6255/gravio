import React, { useEffect, useMemo, useState } from 'react';
import {
	Box,
	Card,
	Stack,
	Typography,
	TextField,
	MenuItem,
	Switch,
	FormControlLabel,
	Button,
	Divider,
	Chip,
	IconButton,
	InputAdornment,
	CircularProgress,
} from '@mui/material';
import { ContentCopyOutlined, CloudSyncOutlined, LinkOutlined } from '@mui/icons-material';
import PageHeader from '../../components/common/page-header';
import useToast from '../../hooks/useToast';
import bookingService from '../../services/bookingService';
import googleIntegrationService from '../../services/googleIntegrationService';
import type { BookingPage, BookingLocationType, WeeklyAvailability, TimeRange } from '../../models/booking/bookingPage';
import type { GoogleConnectionStatusResponse } from '../../models/booking/googleIntegration';

const DAYS: { key: keyof WeeklyAvailability; label: string }[] = [
	{ key: 'mon', label: 'Monday' },
	{ key: 'tue', label: 'Tuesday' },
	{ key: 'wed', label: 'Wednesday' },
	{ key: 'thu', label: 'Thursday' },
	{ key: 'fri', label: 'Friday' },
	{ key: 'sat', label: 'Saturday' },
	{ key: 'sun', label: 'Sunday' },
];

const DEFAULT_RANGE: TimeRange = ['09:00', '17:00'];
const BROWSER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

const BookingSetupPage: React.FC = () => {
	const toast = useToast();
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [page, setPage] = useState<BookingPage | null>(null);

	const [slug, setSlug] = useState('');
	const [title, setTitle] = useState('15 Minute Discovery Call');
	const [description, setDescription] = useState('');
	const [durationMinutes, setDurationMinutes] = useState(30);
	const [locationType, setLocationType] = useState<BookingLocationType>('google_meet');
	const [offlineAddress, setOfflineAddress] = useState('');
	const [fallbackNote, setFallbackNote] = useState('');
	const [timezone, setTimezone] = useState(BROWSER_TZ);
	const [bufferBefore, setBufferBefore] = useState(0);
	const [bufferAfter, setBufferAfter] = useState(0);
	const [minNoticeMinutes, setMinNoticeMinutes] = useState(60);
	const [maxAdvanceDays, setMaxAdvanceDays] = useState(60);
	const [enabledDays, setEnabledDays] = useState<Record<string, boolean>>({ mon: true, tue: true, wed: true, thu: true, fri: true });
	const [dayRanges, setDayRanges] = useState<Record<string, TimeRange>>(
		Object.fromEntries(DAYS.map((d) => [d.key, DEFAULT_RANGE]))
	);

	const [googleStatus, setGoogleStatus] = useState<GoogleConnectionStatusResponse | null>(null);
	const [connectingGoogle, setConnectingGoogle] = useState(false);

	useEffect(() => {
		(async () => {
			try {
				const pages = await bookingService.listMyBookingPages();
				if (pages.length > 0) {
					applyPage(pages[0]);
				}
			} catch {
				toast.error('Failed to load your booking page.');
			} finally {
				setLoading(false);
			}
		})();
		// Query param comes back from the Google OAuth redirect (see backend
		// /integrations/google/callback) — surface it as a toast once.
		const params = new URLSearchParams(window.location.search);
		const result = params.get('google_calendar');
		if (result === 'connected') toast.success('Google Calendar connected.');
		else if (result === 'exchange_failed') toast.error('Could not connect Google Calendar. Please try again.');
		else if (result === 'invalid_state') toast.error('Google Calendar connection expired. Please try again.');
		if (result) window.history.replaceState({}, '', window.location.pathname);

		refreshGoogleStatus();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const refreshGoogleStatus = async () => {
		try {
			setGoogleStatus(await googleIntegrationService.getStatus());
		} catch {
			// Non-fatal — the page still works fully without Google connected.
		}
	};

	const applyPage = (p: BookingPage) => {
		setPage(p);
		setSlug(p.slug);
		setTitle(p.title);
		setDescription(p.description || '');
		setDurationMinutes(p.duration_minutes);
		setLocationType(p.location_type);
		setOfflineAddress(p.offline_address || '');
		setFallbackNote(p.fallback_meeting_note || '');
		setTimezone(p.timezone);
		setBufferBefore(p.buffer_before_minutes);
		setBufferAfter(p.buffer_after_minutes);
		setMinNoticeMinutes(p.min_notice_minutes);
		setMaxAdvanceDays(p.max_advance_days);
		const enabled: Record<string, boolean> = {};
		const ranges: Record<string, TimeRange> = { ...dayRanges };
		for (const d of DAYS) {
			const dayRanges2 = p.availability[d.key];
			enabled[d.key] = !!(dayRanges2 && dayRanges2.length > 0);
			if (dayRanges2 && dayRanges2.length > 0) ranges[d.key] = dayRanges2[0];
		}
		setEnabledDays(enabled);
		setDayRanges(ranges);
	};

	const availability: WeeklyAvailability = useMemo(() => {
		const result: WeeklyAvailability = {};
		for (const d of DAYS) {
			if (enabledDays[d.key]) result[d.key] = [dayRanges[d.key]];
		}
		return result;
	}, [enabledDays, dayRanges]);

	const publicUrl = `${window.location.origin}/book/${slug || '{your-link}'}`;

	const handleCopyLink = () => {
		navigator.clipboard.writeText(publicUrl);
		toast.success('Link copied to clipboard.');
	};

	const handleSave = async () => {
		if (!slug.trim() || !title.trim()) {
			toast.error('Please provide a link and a title.');
			return;
		}
		if (locationType === 'offline' && !offlineAddress.trim()) {
			toast.error('Please provide an address for offline meetings.');
			return;
		}
		setSaving(true);
		try {
			const shared = {
				title,
				description: description || undefined,
				duration_minutes: durationMinutes,
				location_type: locationType,
				offline_address: locationType === 'offline' ? offlineAddress : undefined,
				fallback_meeting_note: fallbackNote || undefined,
				timezone,
				availability,
				buffer_before_minutes: bufferBefore,
				buffer_after_minutes: bufferAfter,
				min_notice_minutes: minNoticeMinutes,
				max_advance_days: maxAdvanceDays,
			};
			if (page) {
				const updated = await bookingService.updateMyBookingPage(page.public_id, shared);
				applyPage(updated);
			} else {
				const created = await bookingService.createBookingPage({ slug, ...shared });
				applyPage(created);
			}
			toast.success('Booking page saved.');
		} catch (err: any) {
			toast.error(err?.response?.data?.error?.message || 'Failed to save booking page.');
		} finally {
			setSaving(false);
		}
	};

	const handleConnectGoogle = async () => {
		setConnectingGoogle(true);
		try {
			const url = await googleIntegrationService.getAuthorizationUrl();
			window.location.href = url;
		} catch (err: any) {
			toast.error(err?.response?.data?.error?.message || 'Google Calendar integration is not available right now.');
			setConnectingGoogle(false);
		}
	};

	const handleDisconnectGoogle = async () => {
		try {
			await googleIntegrationService.disconnect();
			toast.success('Google Calendar disconnected.');
			refreshGoogleStatus();
		} catch {
			toast.error('Failed to disconnect Google Calendar.');
		}
	};

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box>
			<PageHeader
				title="Booking Page"
				subtitle="Configure your public scheduling link, availability, and video call integration."
			/>

			<Stack spacing={3} sx={{ maxWidth: 820 }}>
				{/* Public link */}
				<Card variant="outlined" sx={{ p: 3 }}>
					<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
						<LinkOutlined fontSize="small" color="action" />
						<Typography variant="subtitle1" fontWeight={600}>Your booking link</Typography>
					</Stack>
					<Stack direction="row" spacing={1} alignItems="center">
						<TextField
							size="small"
							fullWidth
							value={slug}
							onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
							disabled={!!page}
							helperText={page ? 'The link cannot be changed after creation.' : 'Lowercase letters, numbers, and hyphens only.'}
							InputProps={{
								startAdornment: <InputAdornment position="start">/book/</InputAdornment>,
							}}
						/>
						<IconButton onClick={handleCopyLink} title="Copy link">
							<ContentCopyOutlined fontSize="small" />
						</IconButton>
					</Stack>
				</Card>

				{/* Meeting details */}
				<Card variant="outlined" sx={{ p: 3 }}>
					<Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Meeting details</Typography>
					<Stack spacing={2}>
						<TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth />
						<TextField
							label="Description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							fullWidth
							multiline
							minRows={2}
						/>
						<Stack direction="row" spacing={2}>
							<TextField
								label="Duration (minutes)"
								type="number"
								value={durationMinutes}
								onChange={(e) => setDurationMinutes(Number(e.target.value))}
								sx={{ width: 200 }}
							/>
							<TextField
								select
								label="Meeting type"
								value={locationType}
								onChange={(e) => setLocationType(e.target.value as BookingLocationType)}
								sx={{ width: 260 }}
							>
								<MenuItem value="google_meet">Online (Google Meet)</MenuItem>
								<MenuItem value="offline">In person</MenuItem>
								<MenuItem value="phone">Phone call</MenuItem>
							</TextField>
						</Stack>
						{locationType === 'offline' && (
							<TextField
								label="Address"
								value={offlineAddress}
								onChange={(e) => setOfflineAddress(e.target.value)}
								fullWidth
								helperText="Shown to the client along with a Google Maps link — no API key required."
							/>
						)}
						{locationType === 'google_meet' && (
							<TextField
								label="Fallback note (shown if a Meet link isn't ready yet)"
								value={fallbackNote}
								onChange={(e) => setFallbackNote(e.target.value)}
								fullWidth
								placeholder="e.g. your personal Meet room link, or 'I'll send the link shortly'"
							/>
						)}
						{locationType === 'phone' && (
							<TextField
								label="Phone number"
								value={fallbackNote}
								onChange={(e) => setFallbackNote(e.target.value)}
								fullWidth
							/>
						)}
					</Stack>
				</Card>

				{/* Availability */}
				<Card variant="outlined" sx={{ p: 3 }}>
					<Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Weekly availability</Typography>
					<TextField
						select
						label="Timezone"
						value={timezone}
						onChange={(e) => setTimezone(e.target.value)}
						sx={{ width: 320, mb: 2 }}
						helperText="All hours below are in this timezone."
					>
						{Intl.supportedValuesOf?.('timeZone')?.map((tz: string) => (
							<MenuItem key={tz} value={tz}>{tz}</MenuItem>
						)) || <MenuItem value={BROWSER_TZ}>{BROWSER_TZ}</MenuItem>}
					</TextField>
					<Stack spacing={1.5}>
						{DAYS.map((d) => (
							<Stack key={d.key} direction="row" spacing={2} alignItems="center">
								<FormControlLabel
									sx={{ width: 160 }}
									control={
										<Switch
											checked={!!enabledDays[d.key]}
											onChange={(e) => setEnabledDays((prev) => ({ ...prev, [d.key]: e.target.checked }))}
										/>
									}
									label={d.label}
								/>
								<TextField
									type="time"
									size="small"
									disabled={!enabledDays[d.key]}
									value={dayRanges[d.key][0]}
									onChange={(e) => setDayRanges((prev) => ({ ...prev, [d.key]: [e.target.value, prev[d.key][1]] }))}
								/>
								<Typography variant="body2">to</Typography>
								<TextField
									type="time"
									size="small"
									disabled={!enabledDays[d.key]}
									value={dayRanges[d.key][1]}
									onChange={(e) => setDayRanges((prev) => ({ ...prev, [d.key]: [prev[d.key][0], e.target.value] }))}
								/>
							</Stack>
						))}
					</Stack>
					<Divider sx={{ my: 2 }} />
					<Stack direction="row" spacing={2} flexWrap="wrap">
						<TextField
							label="Buffer before (min)" type="number" size="small" sx={{ width: 170 }}
							value={bufferBefore} onChange={(e) => setBufferBefore(Number(e.target.value))}
						/>
						<TextField
							label="Buffer after (min)" type="number" size="small" sx={{ width: 170 }}
							value={bufferAfter} onChange={(e) => setBufferAfter(Number(e.target.value))}
						/>
						<TextField
							label="Minimum notice (min)" type="number" size="small" sx={{ width: 170 }}
							value={minNoticeMinutes} onChange={(e) => setMinNoticeMinutes(Number(e.target.value))}
						/>
						<TextField
							label="Bookable window (days)" type="number" size="small" sx={{ width: 170 }}
							value={maxAdvanceDays} onChange={(e) => setMaxAdvanceDays(Number(e.target.value))}
						/>
					</Stack>
				</Card>

				{/* Google Calendar */}
				<Card variant="outlined" sx={{ p: 3 }}>
					<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
						<CloudSyncOutlined fontSize="small" color="action" />
						<Typography variant="subtitle1" fontWeight={600}>Google Calendar</Typography>
					</Stack>
					<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
						Connect your Google account to auto-generate a Meet link and add every booking straight to your
						calendar. Not connected yet? Bookings still work — clients get a calendar invite by email either way.
					</Typography>
					{googleStatus?.status === 'connected' ? (
						<Stack direction="row" spacing={2} alignItems="center">
							<Chip color="success" label={`Connected as ${googleStatus.google_email}`} />
							<Button variant="outlined" color="error" onClick={handleDisconnectGoogle}>Disconnect</Button>
						</Stack>
					) : googleStatus?.status === 'error' ? (
						<Stack direction="row" spacing={2} alignItems="center">
							<Chip color="error" label="Connection needs attention" />
							<Button variant="contained" onClick={handleConnectGoogle} disabled={connectingGoogle}>Reconnect</Button>
						</Stack>
					) : (
						<Button variant="contained" onClick={handleConnectGoogle} disabled={connectingGoogle} startIcon={<CloudSyncOutlined />}>
							Connect Google Calendar
						</Button>
					)}
				</Card>

				<Box>
					<Button variant="contained" size="large" onClick={handleSave} disabled={saving}>
						{saving ? 'Saving…' : 'Save Booking Page'}
					</Button>
				</Box>
			</Stack>
		</Box>
	);
};

export default BookingSetupPage;
