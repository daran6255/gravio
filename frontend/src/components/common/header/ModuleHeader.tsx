import React from 'react';
import { Box, Typography, Container, useTheme, useMediaQuery, alpha } from '@mui/material';

interface ModuleHeaderProps {
	title: React.ReactNode;
	subtitle?: React.ReactNode;
	extra?: React.ReactNode;
	children?: React.ReactNode; // For info bars or secondary sections
}

/**
 * Enterprise Grade Module Header
 * High-fidelity 'Enterprise Outcome' design.
 */
const ModuleHeader: React.FC<ModuleHeaderProps> = ({
	title,
	subtitle,
	extra,
	children
}) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	return (
		<Box
			sx={{
				bgcolor: 'secondary.main',
				color: 'common.white',
				pt: { xs: 3, sm: 4 },
				pb: { xs: 3, sm: 4 },
				mb: 0,
				position: 'relative',
				overflow: 'hidden',
				// Premium Gradient
				background: `linear-gradient(160deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
				// Enterprise Blue Top Border
				borderTop: `3px solid ${theme.palette.primary.main}`,
				borderBottom: '1px solid',
				borderColor: alpha(theme.palette.common.white, 0.08),
				boxShadow: '0 4px 15px -5px rgba(0,0,0,0.3)'
			}}
		>
			{/* Decorative Accents */}
			<Box
				sx={{
					position: 'absolute',
					top: 0,
					right: 0,
					width: '35%',
					height: '100%',
					background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.02)})`,
					pointerEvents: 'none'
				}}
			/>

			<Container maxWidth="xl" sx={{ px: { xs: 2, sm: 4, md: 5 }, position: 'relative', zIndex: 1 }}>
				<Box
					sx={{
						display: 'flex',
						flexDirection: isMobile ? 'column' : 'row',
						justifyContent: 'space-between',
						alignItems: isMobile ? 'flex-start' : 'center',
						gap: { xs: 3, md: 5 }
					}}
				>
					<Box sx={{ flex: 1, minWidth: 0 }}>
						<Typography
							variant="h4"
							sx={{
								fontWeight: 500,
								mb: 0.5,
								letterSpacing: '-0.02em',
								color: 'common.white',
								fontSize: { xs: '1.5rem', sm: '2rem' },
								textShadow: '0 2px 8px rgba(0,0,0,0.15)',
								whiteSpace: 'nowrap',
								overflow: 'hidden',
								textOverflow: 'ellipsis'
							}}
						>
							{title}
						</Typography>
						{subtitle && (
							<Box sx={{ maxWidth: 650 }}>
								<Typography
									variant="body2"
									sx={{
										color: alpha(theme.palette.common.white, 0.5),
										fontWeight: 400,
										fontSize: { xs: '0.8rem', sm: '0.9rem' },
										lineHeight: 1.4
									}}
								>
									{subtitle}
								</Typography>
							</Box>
						)}
					</Box>

					{extra && (
						<Box
							sx={{
								width: isMobile ? '100%' : 'auto',
								minWidth: isMobile ? 'none' : 420, // Guaranteed width for professional input elements
								flexShrink: 0,
								bgcolor: alpha(theme.palette.common.white, 0.04),
								p: { xs: 0.5, sm: 0.75 },
								px: { xs: 1, sm: 2 },
								borderRadius: 1.5,
								backdropFilter: 'blur(12px)',
								border: '1px solid',
								borderColor: alpha(theme.palette.common.white, 0.1),
								boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: isMobile ? 'flex-start' : 'center', // Center content within the box for symmetry
								transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
								'&:hover': {
									bgcolor: alpha(theme.palette.common.white, 0.07),
									borderColor: alpha(theme.palette.common.white, 0.15),
									boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
								}
							}}
						>
							{extra}
						</Box>
					)}
				</Box>

				{children && (
					<Box
						sx={{
							mt: 3,
							pt: 2.5,
							borderTop: '1px solid',
							borderColor: alpha(theme.palette.common.white, 0.06)
						}}
					>
						{children}
					</Box>
				)}
			</Container>
		</Box>
	);
};

export default ModuleHeader;
