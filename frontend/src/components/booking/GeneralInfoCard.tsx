import React from 'react';
import { Box, Stack, TextField, MenuItem, InputAdornment, IconButton } from '@mui/material';
import { InfoOutlined, LinkOutlined, ContentCopyOutlined, CheckOutlined, VideocamOutlined, PlaceOutlined, PhoneOutlined } from '@mui/icons-material';
import SectionHeader from './SectionHeader';
import PremiumTooltip from '../common/PremiumTooltip';
import { useBookingCardStyles } from './bookingCardStyles';
import type { BookingLocationType } from '../../models/booking/bookingPage';
import useToast from '../../hooks/useToast';

interface GeneralInfoCardProps {
	slug: string;
	setSlug: (v: string) => void;
	slugLocked: boolean;
	publicUrlPrefix: string;
	title: string;
	setTitle: (v: string) => void;
	description: string;
	setDescription: (v: string) => void;
	durationMinutes: number;
	setDurationMinutes: (v: number) => void;
	locationType: BookingLocationType;
	setLocationType: (v: BookingLocationType) => void;
}

const ACCENT = '#8B7CF6';
const DURATIONS = [15, 30, 45, 60, 90];

const LOCATION_OPTIONS: { value: BookingLocationType; label: string; icon: React.ReactNode }[] = [
	{ value: 'google_meet', label: 'Google Meet (online)', icon: <VideocamOutlined sx={{ fontSize: 18 }} /> },
	{ value: 'offline', label: 'In Person', icon: <PlaceOutlined sx={{ fontSize: 18 }} /> },
	{ value: 'phone', label: 'Phone Call', icon: <PhoneOutlined sx={{ fontSize: 18 }} /> },
];

const GeneralInfoCard: React.FC<GeneralInfoCardProps> = ({
	slug, setSlug, slugLocked, publicUrlPrefix,
	title, setTitle, description, setDescription,
	durationMinutes, setDurationMinutes, locationType, setLocationType,
}) => {
	const { cardSx, glowBubbleSx, fieldSx, fieldLabelSx } = useBookingCardStyles(ACCENT);
	const toast = useToast();
	const [copied, setCopied] = React.useState(false);

	const handleCopyLink = () => {
		navigator.clipboard.writeText(`${publicUrlPrefix}${slug || ''}`);
		setCopied(true);
		toast.success('Link copied to clipboard.');
		setTimeout(() => setCopied(false), 1800);
	};

	return (
		<Box sx={cardSx}>
			<Box className="glow-bubble" sx={glowBubbleSx} />
			<Box sx={{ position: 'relative', zIndex: 1 }}>
			<SectionHeader
				icon={<InfoOutlined sx={{ fontSize: 16 }} />}
				title="General Information"
				color={ACCENT}
				helpText="The basics clients see: your public link, meeting name, how long it runs, and how it happens (online, in person, or by phone)."
			/>
			<Stack spacing={2.5}>
				<Box>
					<Box component="span" sx={fieldLabelSx}>Your booking link</Box>
					<TextField
						fullWidth
						size="small"
						value={slug}
						onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
						disabled={slugLocked}
						sx={fieldSx(slugLocked)}
						placeholder="your-name-consulting"
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<Stack direction="row" spacing={0.5} alignItems="center">
										<LinkOutlined sx={{ fontSize: 16 }} />
										<Box component="span" sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap', color: 'text.secondary' }}>{publicUrlPrefix}</Box>
									</Stack>
								</InputAdornment>
							),
							endAdornment: (
								<InputAdornment position="end">
									<PremiumTooltip title={copied ? 'Copied!' : 'Copy link'}>
										<IconButton size="small" onClick={handleCopyLink} color={copied ? 'success' : 'default'}>
											{copied ? <CheckOutlined sx={{ fontSize: 16 }} /> : <ContentCopyOutlined sx={{ fontSize: 16 }} />}
										</IconButton>
									</PremiumTooltip>
								</InputAdornment>
							),
						}}
					/>
					{slugLocked && (
						<Box component="span" sx={{ fontSize: '0.7rem', color: 'text.secondary', mt: 0.5, display: 'block' }}>
							The link can't be changed after it's created — share it with confidence.
						</Box>
					)}
				</Box>

				<Box>
					<Box component="span" sx={fieldLabelSx}>Meeting title</Box>
					<TextField
						fullWidth size="small" value={title} onChange={(e) => setTitle(e.target.value)} sx={fieldSx()}
						placeholder="e.g. 30 Minute Discovery Call"
					/>
				</Box>

				<Box>
					<Box component="span" sx={fieldLabelSx}>Description</Box>
					<TextField
						fullWidth multiline minRows={2} size="small"
						value={description} onChange={(e) => setDescription(e.target.value)}
						placeholder="What should the client expect from this meeting?"
						sx={fieldSx()}
					/>
				</Box>

				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
					<Box sx={{ flex: 1 }}>
						<Box component="span" sx={fieldLabelSx}>Duration</Box>
						<TextField
							select fullWidth size="small"
							value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))}
							sx={fieldSx()}
						>
							{DURATIONS.map((d) => <MenuItem key={d} value={d}>{d} minutes</MenuItem>)}
						</TextField>
					</Box>
					<Box sx={{ flex: 1 }}>
						<Box component="span" sx={fieldLabelSx}>How the meeting happens</Box>
						<TextField
							select fullWidth size="small"
							value={locationType} onChange={(e) => setLocationType(e.target.value as BookingLocationType)}
							sx={fieldSx()}
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
					</Box>
				</Stack>
			</Stack>
		</Box>
		</Box>
	);
};

export default GeneralInfoCard;
