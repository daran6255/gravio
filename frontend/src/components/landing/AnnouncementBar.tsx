import React, { useState } from 'react';
import { Box, Container, IconButton, Stack, Typography, alpha } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Close as CloseIcon, ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Marketing can swap this copy/CTA without touching any layout or animation
// code below. TODO: actual offer terms (discount, eligible plan, and the
// cutoff date) need sign-off from the business before this goes live.
const ANNOUNCEMENT = {
	emoji: '🎉',
	message: 'Early access offer — get 3 months on Growth plan pricing when you start this quarter.',
	ctaLabel: 'Claim offer',
	ctaHref: '/auth/register',
};

const AnnouncementBar: React.FC = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const [dismissed, setDismissed] = useState(false);

	if (dismissed) return null;

	return (
		<Box
			role="note"
			aria-label="Announcement"
			sx={{
				position: 'relative',
				background: theme.gradients.brandDiagonal,
				py: 1,
			}}
		>
			<Container maxWidth="lg" sx={{ position: 'relative' }}>
				<Stack
					direction="row"
					alignItems="center"
					justifyContent="center"
					sx={{ minHeight: 28, pr: { xs: 4, sm: 5 } }}
				>
					<Stack
						component="button"
						type="button"
						onClick={() => navigate(ANNOUNCEMENT.ctaHref)}
						direction="row"
						alignItems="center"
						justifyContent="center"
						spacing={1}
						sx={{
							border: 'none',
							background: 'none',
							p: 0,
							cursor: 'pointer',
							flexWrap: 'wrap',
							rowGap: 0.25,
							'&:hover .announcement-cta': { transform: 'translateX(3px)' },
						}}
					>
						<Typography sx={{ fontSize: { xs: theme.typography.caption.fontSize, sm: theme.typography.body2.fontSize }, fontWeight: 600, color: theme.palette.common.white, textAlign: 'center' }}>
							{ANNOUNCEMENT.emoji} {ANNOUNCEMENT.message}
						</Typography>
						<Stack direction="row" alignItems="center" spacing={0.4} sx={{ flexShrink: 0 }}>
							<Typography sx={{ fontSize: { xs: theme.typography.caption.fontSize, sm: theme.typography.body2.fontSize }, fontWeight: 800, color: theme.palette.common.white, textDecoration: 'underline', textUnderlineOffset: '2px' }}>
								{ANNOUNCEMENT.ctaLabel}
							</Typography>
							<ArrowForwardIcon className="announcement-cta" sx={{ fontSize: 14, color: theme.palette.common.white, transition: 'transform 200ms ease-out' }} />
						</Stack>
					</Stack>
				</Stack>

				<IconButton
					size="small"
					onClick={() => setDismissed(true)}
					aria-label="Dismiss announcement"
					sx={{
						position: 'absolute',
						right: { xs: 8, sm: 16 },
						top: '50%',
						transform: 'translateY(-50%)',
						color: theme.palette.common.white,
						p: 0.75,
						'&:hover': { bgcolor: alpha(theme.palette.common.white, 0.16) },
					}}
				>
					<CloseIcon sx={{ fontSize: 16 }} />
				</IconButton>
			</Container>
		</Box>
	);
};

export default AnnouncementBar;
