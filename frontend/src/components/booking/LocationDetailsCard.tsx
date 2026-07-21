import React from 'react';
import { Box, Stack, TextField, Typography } from '@mui/material';
import { PlaceOutlined, VideocamOutlined, PhoneOutlined } from '@mui/icons-material';
import SectionHeader from './SectionHeader';
import StatusBadge from '../common/badge/StatusBadge';
import { SubmitButton, CancelButton } from '../common/button';
import { useBookingCardStyles } from './bookingCardStyles';
import type { BookingLocationType } from '../../models/booking/bookingPage';
import type { GoogleConnectionStatusResponse } from '../../models/booking/googleIntegration';

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

const LocationDetailsCard: React.FC<LocationDetailsCardProps> = ({
	locationType, offlineAddress, setOfflineAddress, fallbackNote, setFallbackNote,
	googleStatus, connectingGoogle, onConnectGoogle, onDisconnectGoogle,
}) => {
	const { cardSx, glowBubbleSx, fieldSx, fieldLabelSx, mutedColor } = useBookingCardStyles(ACCENT);

	const mapsUrl = offlineAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(offlineAddress)}` : null;
	const status = googleStatus?.status || 'disconnected';

	return (
		<Box sx={cardSx}>
			<Box className="glow-bubble" sx={glowBubbleSx} />
			<Box sx={{ position: 'relative', zIndex: 1 }}>
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
									<Typography variant="caption" sx={{ color: mutedColor }}>
										A video link is generated automatically for each booking
									</Typography>
								</Box>
							</Stack>
							<StatusBadge type="googleSync" status={status} label={GOOGLE_STATUS_LABEL[status]} />
						</Stack>

						{status === 'connected' ? (
							<Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
								<Typography variant="caption" sx={{ color: mutedColor }}>Signed in as {googleStatus?.google_email}</Typography>
								<CancelButton size="small" color="error" onClick={onDisconnectGoogle}>Disconnect</CancelButton>
							</Stack>
						) : (
							<Box>
								<SubmitButton size="small" onClick={onConnectGoogle} loading={connectingGoogle}>
									{status === 'error' ? 'Reconnect Google Calendar' : 'Connect Google Calendar'}
								</SubmitButton>
								<Typography variant="caption" sx={{ color: mutedColor, display: 'block', mt: 1 }}>
									Not connected yet? Bookings still work fully — clients always get a calendar invite by email either way.
								</Typography>
							</Box>
						)}

						<Box>
							<Box component="span" sx={fieldLabelSx}>Fallback note (shown if the link isn't ready yet)</Box>
							<TextField
								fullWidth size="small" value={fallbackNote} onChange={(e) => setFallbackNote(e.target.value)}
								placeholder="e.g. your personal Meet room link"
								sx={fieldSx()}
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
								sx={fieldSx()}
							/>
						</Box>
						<Typography variant="caption" sx={{ color: mutedColor }}>
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
							InputProps={{ startAdornment: <PhoneOutlined sx={{ fontSize: 16, mr: 1, color: mutedColor }} /> }}
							sx={fieldSx()}
						/>
					</Box>
				)}
			</Box>
		</Box>
	);
};

export default LocationDetailsCard;
