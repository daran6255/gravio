import React from 'react';
import { Box, Stack, Typography, Button, useTheme, type SvgIconProps } from '@mui/material';

interface WelcomeBannerProps {
	icon: React.ElementType<SvgIconProps>;
	title: string;
	description: string;
	onExplore: () => void;
	onDismiss: () => void;
	exploreLabel?: string;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
	icon: Icon,
	title,
	description,
	onExplore,
	onDismiss,
	exploreLabel = 'Explore Guide',
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	return (
		<Box
			sx={{
				borderRadius: '16px',
				p: 3,
				mb: 3,
				position: 'relative',
				overflow: 'hidden',
				background: isDark
					? 'linear-gradient(135deg, #111b27 0%, #0e1622 100%)'
					: 'linear-gradient(135deg, #f5f9ff 0%, #eef5ff 100%)',
				border: '1px solid',
				borderColor: isDark ? 'rgba(33, 150, 243, 0.25)' : 'rgba(33, 150, 243, 0.15)',
				boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.05)',
				'&::before': {
					content: '""',
					position: 'absolute',
					top: '-50%',
					right: '-20%',
					width: '300px',
					height: '300px',
					borderRadius: '50%',
					background: isDark
						? 'radial-gradient(circle, rgba(33,150,243,0.15) 0%, transparent 70%)'
						: 'radial-gradient(circle, rgba(33,150,243,0.1) 0%, transparent 70%)',
				}
			}}
		>
			<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems="center" justifyContent="space-between">
				<Stack direction="row" spacing={2} alignItems="center">
					<Box
						sx={{
							width: 48,
							height: 48,
							borderRadius: '12px',
							bgcolor: 'primary.main',
							color: 'white',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							boxShadow: '0 4px 14px 0 rgba(33, 150, 243, 0.4)',
							flexShrink: 0,
						}}
					>
						<Icon sx={{ fontSize: 24 }} />
					</Box>
					<Box>
						<Typography variant="body1" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
							{title}
						</Typography>
						<Typography variant="body2" color="text.secondary" sx={{ maxWidth: '600px', fontSize: '0.875rem', lineHeight: 1.5 }}>
							{description}
						</Typography>
					</Box>
				</Stack>
				<Stack direction="row" spacing={1.5} sx={{ width: { xs: '100%', sm: 'auto' }, flexShrink: 0, justifyContent: { xs: 'flex-end', sm: 'flex-start' } }}>
					<Button
						variant="contained"
						size="small"
						onClick={onExplore}
						sx={{
							textTransform: 'none',
							fontWeight: 700,
							borderRadius: '8px',
							boxShadow: '0 4px 12px 0 rgba(33, 150, 243, 0.2)',
						}}
					>
						{exploreLabel}
					</Button>
					<Button
						variant="text"
						size="small"
						onClick={onDismiss}
						sx={{
							textTransform: 'none',
							fontWeight: 600,
							color: 'text.secondary',
						}}
					>
						Dismiss
					</Button>
				</Stack>
			</Stack>
		</Box>
	);
};

export default WelcomeBanner;
