import React, { useEffect, useMemo, useState } from 'react';
import { Box, Stack, Switch, CircularProgress } from '@mui/material';
import { SaveOutlined, CalendarMonthOutlined } from '@mui/icons-material';
import PageHeader from '../common/page-header';
import { SubmitButton, HelpGuideButton } from '../common/button';
import { WelcomeBanner } from '../common/guide';
import HelpGuideDrawer from '../common/guide/HelpGuideDrawer';
import StatusBadge from '../common/badge/StatusBadge';
import useToast from '../../hooks/useToast';
import { useDismissibleBanner } from '../../hooks/useDismissibleBanner';
import { useAppSelector } from '../../store/hooks';
import bookingService from '../../services/bookingService';
import googleIntegrationService from '../../services/googleIntegrationService';
import { BOOKING_GUIDE_CONTENT } from '../../data/bookingGuideData';
import {
	GeneralInfoCard,
	LocationDetailsCard,
	SchedulingControlsCard,
	WeeklyHoursCard,
	ExceptionsCard,
	PublicPreviewCard,
	AmbientGlow,
} from '../booking';
import type { BookingPage, BookingLocationType, WeeklyAvailability, TimeRange, BookingAvailabilityException } from '../../models/booking/bookingPage';
import type { GoogleConnectionStatusResponse } from '../../models/booking/googleIntegration';

const DAY_KEYS: (keyof WeeklyAvailability)[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DEFAULT_RANGE: TimeRange = ['09:00', '17:00'];

const BookingTab: React.FC = () => {
	const toast = useToast();
	const user = useAppSelector((state) => state.auth.user);
	const { show: showWelcome, dismiss: dismissWelcome } = useDismissibleBanner('booking_setup_welcome_dismissed');
	const [guideOpen, setGuideOpen] = useState(false);

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [page, setPage] = useState<BookingPage | null>(null);
	const [isActive, setIsActive] = useState(true);
	const [togglingActive, setTogglingActive] = useState(false);

	const [slug, setSlug] = useState('');
	const [title, setTitle] = useState('15 Minute Discovery Call');
	const [description, setDescription] = useState('');
	const [durationMinutes, setDurationMinutes] = useState(30);
	const [locationType, setLocationType] = useState<BookingLocationType>('google_meet');
	const [offlineAddress, setOfflineAddress] = useState('');
	const [fallbackNote, setFallbackNote] = useState('');
	const [bufferBefore, setBufferBefore] = useState(0);
	const [bufferAfter, setBufferAfter] = useState(0);
	const [minNoticeMinutes, setMinNoticeMinutes] = useState(60);
	const [maxBookingsPerDay, setMaxBookingsPerDay] = useState<number | ''>('');

	const [enabledDays, setEnabledDays] = useState<Record<string, boolean>>({ mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false });
	const [dayRanges, setDayRanges] = useState<Record<string, TimeRange>>(
		Object.fromEntries(DAY_KEYS.map((d) => [d, DEFAULT_RANGE])) as Record<string, TimeRange>
	);

	const [exceptions, setExceptions] = useState<BookingAvailabilityException[]>([]);

	const [googleStatus, setGoogleStatus] = useState<GoogleConnectionStatusResponse | null>(null);
	const [connectingGoogle, setConnectingGoogle] = useState(false);

	useEffect(() => {
		(async () => {
			try {
				const pages = await bookingService.listMyBookingPages();
				if (pages.length > 0) {
					applyPage(pages[0]);
					const exc = await bookingService.listMyBookingPageExceptions(pages[0].public_id);
					setExceptions(exc);
				}
			} catch {
				toast.error('Failed to load your booking page.');
			} finally {
				setLoading(false);
			}
		})();

		// Query param comes back from the Google OAuth redirect (backend
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
		setIsActive(p.is_active);
		setSlug(p.slug);
		setTitle(p.title);
		setDescription(p.description || '');
		setDurationMinutes(p.duration_minutes);
		setLocationType(p.location_type);
		setOfflineAddress(p.offline_address || '');
		setFallbackNote(p.fallback_meeting_note || '');
		setBufferBefore(p.buffer_before_minutes);
		setBufferAfter(p.buffer_after_minutes);
		setMinNoticeMinutes(p.min_notice_minutes);
		setMaxBookingsPerDay(p.max_bookings_per_day ?? '');

		const enabled: Record<string, boolean> = {};
		const ranges: Record<string, TimeRange> = { ...dayRanges };
		for (const d of DAY_KEYS) {
			const dRanges = p.availability[d];
			enabled[d] = !!(dRanges && dRanges.length > 0);
			if (dRanges && dRanges.length > 0) ranges[d] = dRanges[0];
		}
		setEnabledDays(enabled);
		setDayRanges(ranges);
	};

	const availability: WeeklyAvailability = useMemo(() => {
		const result: WeeklyAvailability = {};
		for (const d of DAY_KEYS) {
			if (enabledDays[d]) result[d] = [dayRanges[d]];
		}
		return result;
	}, [enabledDays, dayRanges]);

	const publicUrlPrefix = `${window.location.origin}/book/`;

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
				timezone: page?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
				availability,
				buffer_before_minutes: bufferBefore,
				buffer_after_minutes: bufferAfter,
				min_notice_minutes: minNoticeMinutes,
				max_advance_days: page?.max_advance_days || 60,
				max_bookings_per_day: maxBookingsPerDay === '' ? null : maxBookingsPerDay,
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

	const handleToggleActive = async (checked: boolean) => {
		setIsActive(checked);
		if (!page) return; // nothing to persist until the page is first created
		setTogglingActive(true);
		try {
			const updated = await bookingService.updateMyBookingPage(page.public_id, { is_active: checked });
			applyPage(updated);
			toast.success(checked ? 'Booking page is now active.' : 'Booking page deactivated — new bookings are paused.');
		} catch {
			setIsActive(!checked);
			toast.error('Failed to update status.');
		} finally {
			setTogglingActive(false);
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

	const handleCopyToAll = () => {
		const source = dayRanges.mon;
		setDayRanges(Object.fromEntries(DAY_KEYS.map((d) => [d, source])) as Record<string, TimeRange>);
		setEnabledDays(Object.fromEntries(DAY_KEYS.map((d) => [d, true])));
		toast.info("Monday's hours copied to every day.");
	};

	const handleAddException = async (date: string, isBlocked: boolean, customSlots?: [string, string][]) => {
		if (!page) {
			toast.error('Save your booking page first before adding exceptions.');
			return;
		}
		try {
			const created = await bookingService.createMyBookingPageException(page.public_id, {
				date, is_blocked: isBlocked, custom_slots: customSlots,
			});
			setExceptions((prev) => [...prev.filter((e) => e.date !== date), created]);
			toast.success('Rule added.');
		} catch (err: any) {
			toast.error(err?.response?.data?.error?.message || 'Failed to add rule.');
		}
	};

	const handleDeleteException = async (id: number) => {
		if (!page) return;
		try {
			await bookingService.deleteMyBookingPageException(page.public_id, id);
			setExceptions((prev) => prev.filter((e) => e.id !== id));
		} catch {
			toast.error('Failed to remove rule.');
		}
	};

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
				<CircularProgress />
			</Box>
		);
	}

	const publicUrl = page ? `${publicUrlPrefix}${page.slug}` : null;

	return (
		<Box sx={{ position: 'relative' }}>
			<AmbientGlow />
			<Box sx={{ position: 'relative', zIndex: 1 }}>
			{showWelcome && (
				<WelcomeBanner
					icon={CalendarMonthOutlined}
					title={BOOKING_GUIDE_CONTENT.banner.title}
					description={BOOKING_GUIDE_CONTENT.banner.description}
					onExplore={() => setGuideOpen(true)}
					onDismiss={dismissWelcome}
				/>
			)}

			<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
				<PageHeader
					title="Booking Page Settings"
					subtitle="Configure how clients schedule time with you."
					mb={0}
					titleGradient
				/>
				<Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
					<Stack direction="row" spacing={1} alignItems="center">
						<StatusBadge type="booking" status={isActive ? 'active' : 'inactive'} label={isActive ? 'Active' : 'Inactive'} />
						<Switch
							checked={isActive}
							disabled={togglingActive}
							onChange={(e) => handleToggleActive(e.target.checked)}
							inputProps={{ 'aria-label': 'Toggle booking page active status' }}
						/>
					</Stack>
					<HelpGuideButton compact onClick={() => setGuideOpen(true)} />
					<SubmitButton
						onClick={handleSave}
						loading={saving}
						startIcon={<SaveOutlined />}
						sx={{
							background: (t) => t.gradients.brandDiagonal,
							boxShadow: (t) => `0 4px 14px 0 ${t.palette.primary.main}66`,
							'&:hover': { background: (t) => t.gradients.brandDiagonalHover },
						}}
					>
						Save Changes
					</SubmitButton>
				</Stack>
			</Stack>

			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: { xs: '1fr', lg: '1.4fr 1fr' },
					gap: 3,
					alignItems: 'start',
				}}
			>
				{/* Left column */}
				<Stack spacing={3}>
					<GeneralInfoCard
						slug={slug} setSlug={setSlug} slugLocked={!!page} publicUrlPrefix={publicUrlPrefix}
						title={title} setTitle={setTitle}
						description={description} setDescription={setDescription}
						durationMinutes={durationMinutes} setDurationMinutes={setDurationMinutes}
						locationType={locationType} setLocationType={setLocationType}
					/>
					<LocationDetailsCard
						locationType={locationType}
						offlineAddress={offlineAddress} setOfflineAddress={setOfflineAddress}
						fallbackNote={fallbackNote} setFallbackNote={setFallbackNote}
						googleStatus={googleStatus} connectingGoogle={connectingGoogle}
						onConnectGoogle={handleConnectGoogle} onDisconnectGoogle={handleDisconnectGoogle}
					/>
					<SchedulingControlsCard
						bufferBefore={bufferBefore} setBufferBefore={setBufferBefore}
						bufferAfter={bufferAfter} setBufferAfter={setBufferAfter}
						minNoticeMinutes={minNoticeMinutes} setMinNoticeMinutes={setMinNoticeMinutes}
						maxBookingsPerDay={maxBookingsPerDay} setMaxBookingsPerDay={setMaxBookingsPerDay}
					/>
				</Stack>

				{/* Right column */}
				<Stack spacing={3}>
					<WeeklyHoursCard
						enabledDays={enabledDays} dayRanges={dayRanges}
						onToggleDay={(day, enabled) => setEnabledDays((prev) => ({ ...prev, [day]: enabled }))}
						onChangeRange={(day, range) => setDayRanges((prev) => ({ ...prev, [day]: range }))}
						onCopyToAll={handleCopyToAll}
					/>
					<ExceptionsCard
						exceptions={exceptions}
						onAdd={handleAddException}
						onDelete={handleDeleteException}
						disabled={!page}
					/>
					<PublicPreviewCard
						hostName={user?.full_name || user?.email || 'You'}
						hostAvatar={user?.avatar || null}
						pageTitle={title}
						publicUrl={publicUrl}
					/>
				</Stack>
			</Box>
			</Box>

			<HelpGuideDrawer open={guideOpen} onClose={() => setGuideOpen(false)} content={BOOKING_GUIDE_CONTENT} />
		</Box>
	);
};

export default BookingTab;
