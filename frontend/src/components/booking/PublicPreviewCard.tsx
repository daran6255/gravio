import React from 'react';
import { Box, Stack, Typography, Button } from '@mui/material';
import { VisibilityOutlined, OpenInNewOutlined } from '@mui/icons-material';
import SectionHeader from './SectionHeader';
import EnterpriseAvatar from '../common/avatar/Avatar';
import { useBookingCardStyles } from './bookingCardStyles';

interface PublicPreviewCardProps {
	hostName: string;
	hostAvatar: string | null;
	pageTitle: string;
	publicUrl: string | null;
}

const PublicPreviewCard: React.FC<PublicPreviewCardProps> = ({ hostName, hostAvatar, pageTitle, publicUrl }) => {
	const { cardSx, mutedColor, cardBorder } = useBookingCardStyles();

	return (
		<Box sx={cardSx}>
			<SectionHeader
				icon={<VisibilityOutlined sx={{ fontSize: 16 }} />}
				title="Public Preview"
				helpText="Exactly what a client sees when they open your booking link, kept in sync as you edit."
			/>

			<Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
				<EnterpriseAvatar name={hostName} size={40} src={hostAvatar || undefined} />
				<Box sx={{ minWidth: 0, flex: 1 }}>
					<Typography variant="body2" fontWeight={700} noWrap>{hostName}</Typography>
					<Typography variant="caption" sx={{ color: mutedColor }} noWrap>{pageTitle}</Typography>
				</Box>
			</Stack>

			<Box
				sx={{
					borderRadius: '12px', border: `1px dashed ${cardBorder}`,
					height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center',
					overflow: 'hidden', bgcolor: 'action.hover', position: 'relative',
				}}
			>
				{publicUrl ? (
					<Box
						component="iframe"
						title="Public booking page preview"
						src={publicUrl}
						sx={{
							width: 1200, height: 800, border: 'none',
							transform: 'scale(0.28)', transformOrigin: 'top left',
							position: 'absolute', top: 0, left: 0,
						}}
					/>
				) : (
					<Stack spacing={0.5} alignItems="center" sx={{ px: 2, textAlign: 'center' }}>
						<Typography variant="caption" sx={{ color: mutedColor, fontWeight: 600 }}>No preview yet</Typography>
						<Typography variant="caption" sx={{ color: mutedColor }}>Save your booking page to see it here</Typography>
					</Stack>
				)}
			</Box>

			<Button
				variant="outlined"
				fullWidth
				disabled={!publicUrl}
				component="a"
				href={publicUrl || undefined}
				target="_blank"
				rel="noreferrer"
				startIcon={<OpenInNewOutlined sx={{ fontSize: 16 }} />}
				sx={{ mt: 2, borderRadius: 3, textTransform: 'none', fontWeight: 700 }}
			>
				Open Public Page
			</Button>
		</Box>
	);
};

export default PublicPreviewCard;
