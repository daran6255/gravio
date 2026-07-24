import React from 'react';
import {
	Box, Grid, Paper, Stack, Typography, Switch, TextField, InputAdornment, IconButton, MenuItem,
	Tooltip, CircularProgress, alpha, useTheme,
} from '@mui/material';
import {
	ContentCopyOutlined, OpenInNewOutlined, RefreshOutlined, PublicOutlined, LockOutlined,
} from '@mui/icons-material';
import { SubmitButton } from '../../common/button';
import { useAvailabilitySettings, WEEKDAY_LABELS, shareUrlFor } from './hooks/useAvailabilitySettings';

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

const AvailabilitySettingsPanel: React.FC = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const {
		settings, loading, savingSettings, savingRules, togglingLink,
		dayRows, toggleDay, setDayTime, hasInvalidDay,
		meetingTypeName, setMeetingTypeName,
		durationMinutes, setDurationMinutes,
		bufferMinutes, setBufferMinutes,
		minNoticeHours, setMinNoticeHours,
		bookingWindowDays, setBookingWindowDays,
		locationType, setLocationType,
		locationDetail, setLocationDetail,
		handleSaveSettings, handleSaveRules, handleToggleEnabled, handleRegenerateLink, handleCopyLink,
	} = useAvailabilitySettings();

	if (loading) {
		return (
			<Stack alignItems="center" sx={{ py: 6 }}>
				<CircularProgress size={28} />
			</Stack>
		);
	}

	const url = settings?.share_token ? shareUrlFor(settings.share_token) : '';

	return (
		<Grid container spacing={3}>
			<Grid size={{ xs: 12 }}>
				<Paper sx={{ p: 2.5, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
					<Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" rowGap={1.5}>
						<Stack direction="row" spacing={1.5} alignItems="center">
							{settings?.is_enabled ? (
								<PublicOutlined sx={{ color: 'success.main' }} />
							) : (
								<LockOutlined sx={{ color: 'text.secondary' }} />
							)}
							<Box>
								<Typography variant="body1" sx={{ fontWeight: 800 }}>
									{settings?.is_enabled ? 'Your booking page is live' : 'Booking page is off'}
								</Typography>
								<Typography variant="caption" color="text.secondary">
									{settings?.is_enabled
										? 'Anyone with the link can book an open slot on your calendar'
										: 'Turn this on to get a shareable "book a slot with me" link'}
								</Typography>
							</Box>
						</Stack>
						<Switch checked={!!settings?.is_enabled} disabled={togglingLink} onChange={(e) => handleToggleEnabled(e.target.checked)} />
					</Stack>

					{settings?.is_enabled && settings.share_token && (
						<Stack spacing={1} sx={{ mt: 2 }}>
							<TextField
								value={url}
								size="small"
								fullWidth
								InputProps={{
									readOnly: true,
									endAdornment: (
										<InputAdornment position="end">
											<Tooltip title="Copy link">
												<IconButton size="small" onClick={handleCopyLink}><ContentCopyOutlined fontSize="small" /></IconButton>
											</Tooltip>
											<Tooltip title="Open in new tab">
												<IconButton size="small" onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}><OpenInNewOutlined fontSize="small" /></IconButton>
											</Tooltip>
										</InputAdornment>
									),
								}}
							/>
							<SubmitButton
								size="small"
								variant="text"
								startIcon={togglingLink ? <CircularProgress size={14} /> : <RefreshOutlined fontSize="small" />}
								disabled={togglingLink}
								onClick={handleRegenerateLink}
								sx={{ alignSelf: 'flex-start' }}
							>
								Regenerate link
							</SubmitButton>
						</Stack>
					)}
				</Paper>
			</Grid>

			<Grid size={{ xs: 12, md: 5 }}>
				<Paper sx={{ p: 2.5, borderRadius: '16px', border: '1px solid', borderColor: 'divider', height: '100%' }}>
					<Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>Meeting Settings</Typography>
					<Stack spacing={2.5}>
						<TextField
							label="Meeting Type Name"
							value={meetingTypeName}
							onChange={(e) => setMeetingTypeName(e.target.value)}
							fullWidth
							placeholder="e.g. 30 Minute Intro Call"
						/>
						<Stack direction="row" spacing={2}>
							<TextField
								select
								label="Duration"
								value={durationMinutes}
								onChange={(e) => setDurationMinutes(Number(e.target.value))}
								fullWidth
							>
								{DURATION_OPTIONS.map((m) => (
									<MenuItem key={m} value={m}>{m} minutes</MenuItem>
								))}
							</TextField>
							<TextField
								label="Buffer Between Meetings"
								type="number"
								value={bufferMinutes}
								onChange={(e) => setBufferMinutes(Math.max(0, Number(e.target.value)))}
								fullWidth
								InputProps={{ endAdornment: <InputAdornment position="end">min</InputAdornment> }}
							/>
						</Stack>
						<Stack direction="row" spacing={2}>
							<TextField
								label="Minimum Notice"
								type="number"
								value={minNoticeHours}
								onChange={(e) => setMinNoticeHours(Math.max(0, Number(e.target.value)))}
								fullWidth
								InputProps={{ endAdornment: <InputAdornment position="end">hours</InputAdornment> }}
								helperText="How soon before a slot someone can still book it"
							/>
							<TextField
								label="Booking Window"
								type="number"
								value={bookingWindowDays}
								onChange={(e) => setBookingWindowDays(Math.max(1, Number(e.target.value)))}
								fullWidth
								InputProps={{ endAdornment: <InputAdornment position="end">days</InputAdornment> }}
								helperText="How far ahead someone can book"
							/>
						</Stack>
						<TextField
							select
							label="Location"
							value={locationType}
							onChange={(e) => setLocationType(e.target.value as typeof locationType)}
							fullWidth
						>
							<MenuItem value="google_meet">Video Call</MenuItem>
							<MenuItem value="phone">Phone Call</MenuItem>
							<MenuItem value="offline">In Person</MenuItem>
						</TextField>
						{locationType !== 'google_meet' && (
							<TextField
								label={locationType === 'offline' ? 'Address' : 'Phone Number'}
								value={locationDetail}
								onChange={(e) => setLocationDetail(e.target.value)}
								fullWidth
								required
							/>
						)}
						{locationType === 'google_meet' && (
							<TextField
								label="Fixed video link (optional)"
								value={locationDetail}
								onChange={(e) => setLocationDetail(e.target.value)}
								fullWidth
								placeholder="Leave blank to auto-generate a fresh link per booking"
								helperText="e.g. your personal Zoom room. Leave blank and each booking gets its own unique video call link."
							/>
						)}
						<SubmitButton onClick={handleSaveSettings} loading={savingSettings} sx={{ alignSelf: 'flex-start' }}>
							Save Settings
						</SubmitButton>
					</Stack>
				</Paper>
			</Grid>

			<Grid size={{ xs: 12, md: 7 }}>
				<Paper sx={{ p: 2.5, borderRadius: '16px', border: '1px solid', borderColor: 'divider', height: '100%' }}>
					<Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>Weekly Hours</Typography>
					<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
						Times are in your local timezone ({settings?.timezone}).
					</Typography>
					<Stack spacing={1.25}>
						{dayRows.map((day) => {
							const invalid = day.enabled && day.startTime >= day.endTime;
							return (
								<Stack
									key={day.weekday}
									direction="row"
									alignItems="center"
									spacing={1.5}
									sx={{
										p: 1, borderRadius: '10px',
										bgcolor: invalid ? alpha(theme.palette.error.main, isDark ? 0.1 : 0.06) : 'transparent',
									}}
								>
									<Switch
										size="small"
										checked={day.enabled}
										onChange={(e) => toggleDay(day.weekday, e.target.checked)}
									/>
									<Typography variant="body2" sx={{ fontWeight: 700, width: 90, flexShrink: 0 }}>
										{WEEKDAY_LABELS[day.weekday]}
									</Typography>
									{day.enabled ? (
										<Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
											<TextField
												type="time"
												size="small"
												value={day.startTime}
												onChange={(e) => setDayTime(day.weekday, 'startTime', e.target.value)}
												error={invalid}
											/>
											<Typography variant="body2" color="text.secondary">to</Typography>
											<TextField
												type="time"
												size="small"
												value={day.endTime}
												onChange={(e) => setDayTime(day.weekday, 'endTime', e.target.value)}
												error={invalid}
											/>
										</Stack>
									) : (
										<Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
											Unavailable
										</Typography>
									)}
								</Stack>
							);
						})}
					</Stack>
					<SubmitButton onClick={handleSaveRules} loading={savingRules} disabled={hasInvalidDay} sx={{ mt: 2.5 }}>
						Save Weekly Hours
					</SubmitButton>
				</Paper>
			</Grid>
		</Grid>
	);
};

export default AvailabilitySettingsPanel;
