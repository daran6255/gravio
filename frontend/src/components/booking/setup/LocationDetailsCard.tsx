import React from 'react';
import { Box, Stack, TextField, Typography, useTheme } from '@mui/material';
import { PlaceOutlined, VideocamOutlined, PhoneOutlined } from '@mui/icons-material';
import SectionHeader from './SectionHeader';
import StatusBadge from '../../common/badge/StatusBadge';
import { SubmitButton, CancelButton } from '../../common/button';
import type { BookingLocationType } from '../../../models/booking/bookingPage';
import type { GoogleConnectionStatusResponse } from '../../../models/booking/googleIntegration';

interface LocationDetailsCardProps {
	locationType: BookingLocationType;
	offlineAddress: string;
	setOfflineAddress: (v: string) => void;
	fallbackNote: string;
	setFallbackNote: (v: string) => void;
	googleStatus: GoogleConnectionStatusResponse | null;
	connectingGoogle: boolean;
	onConnectGoogle: () => void;
	onDisconnectGoogle: () => void;
}

const ACCENT = '#4EA8FF';

const GOOGLE_STATUS_LABEL: Record<string, string> = {
	connected: 'Connected',
	error: 'Needs Attention',
	disconnected: 'Not Connected',
};

const fieldLabelSx = { color: 'text.secondary', fontWeight: 700, display: 'block' as const, mb: 0.75, fontSize: '0.7rem', textTransform: 'uppercase' as const, letterSpacing: '0.04em' };

const LocationDetailsCard: React.FC<LocationDetailsCardProps> = ({
	locationType, offlineAddress, setOfflineAddress, fallbackNote, setFallbackNote,
	googleStatus, connectingGoogle, onConnectGoogle, onDisconnectGoogle,
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const cardSx = {
		p: { xs: 2.5, sm: 3 }, borderRadius: '20px',
		bgcolor: 'background.paper',
		border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)',
		boxShadow: isDark ? '0 1px 2px rgba(0,0,0,0.4), 0 8px 20px rgba(0,0,0,0.2)' : '0 1px 2px rgba(15,23,42,0.04), 0 8px 20px rgba(15,23,42,0.05)',
	};

	const mapsUrl = offlineAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(offlineAddress)}` : null;
	const status = googleStatus?.status || 'disconnected';

	return (
		<Box sx={cardSx}>
			<SectionHeader
				icon={<PlaceOutlined sx={{ fontSize: 16 }} />}
				title="Location Details"
				color={ACCENT}
				helpText="Where the meeting actually happens, based on the meeting type you chose in General Information."
			/>

			{locationType === 'google_meet' && (
				<Stack spacing={2}>
					<Stack
						direction="row" spacing={1.5} alignItems="center" justifyContent="space-between"
						sx={{ p: 1.75, borderRadius: '12px', border: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}
					>
						<Stack direction="row" spacing={1.5} alignItems="center">
							<Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(78,168,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
								<VideocamOutlined sx={{ fontSize: 18, color: '#4EA8FF' }} />
							</Box>
							<Box>
								<Typography variant="body2" fontWeight={700}>Google Meet Integration</Typography>
								<Typography variant="caption" color="text.secondary">
									A video link is generated automatically for each booking
								</Typography>
							</Box>
						</Stack>
						<StatusBadge type="googleSync" status={status} label={GOOGLE_STATUS_LABEL[status]} />
					</Stack>

					{status === 'connected' ? (
						<Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
							<Typography variant="caption" color="text.secondary">Signed in as {googleStatus?.google_email}</Typography>
							<CancelButton size="small" color="error" onClick={onDisconnectGoogle}>Disconnect</CancelButton>
						</Stack>
					) : (
						<Box>
							<SubmitButton size="small" onClick={onConnectGoogle} loading={connectingGoogle}>
								{status === 'error' ? 'Reconnect Google Calendar' : 'Connect Google Calendar'}
							</SubmitButton>
							<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
								Not connected yet? Bookings still work fully — clients always get a calendar invite by email either way.
							</Typography>
						</Box>
					)}

					<Box>
						<Box component="span" sx={fieldLabelSx}>Fallback note (shown if the link isn't ready yet)</Box>
						<TextField
							fullWidth size="small" value={fallbackNote} onChange={(e) => setFallbackNote(e.target.value)}
							placeholder="e.g. your personal Meet room link"
						/>
					</Box>
				</Stack>
			)}

			{locationType === 'offline' && (
				<Stack spacing={2}>
					<Box>
						<Box component="span" sx={fieldLabelSx}>Address</Box>
						<TextField
							fullWidth size="small" value={offlineAddress} onChange={(e) => setOfflineAddress(e.target.value)}
							placeholder="123 Main Street, Suite 4, San Francisco, CA"
						/>
					</Box>
					<Typography variant="caption" color="text.secondary">
						Clients will see this address plus a{mapsUrl ? <> <a href={mapsUrl} target="_blank" rel="noreferrer">Google Maps link</a></> : ' Google Maps link'} — no API key required.
					</Typography>
				</Stack>
			)}

			{locationType === 'phone' && (
				<Box>
					<Box component="span" sx={fieldLabelSx}>Phone number</Box>
					<TextField
						fullWidth size="small" value={fallbackNote} onChange={(e) => setFallbackNote(e.target.value)}
						placeholder="+1 (555) 123-4567"
						InputProps={{ startAdornment: <PhoneOutlined sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} /> }}
					/>
				</Box>
			)}
		</Box>
	);
};

export default LocationDetailsCard;
