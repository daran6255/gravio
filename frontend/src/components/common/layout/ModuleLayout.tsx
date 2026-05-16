import React from 'react';
import { Box, Container, Paper, Typography, CircularProgress, alpha, useTheme } from '@mui/material';
import ModuleHeader from '../header';

interface ModuleLayoutProps {
	title: React.ReactNode;
	subtitle?: React.ReactNode;
	headerExtra?: React.ReactNode;
	headerChildren?: React.ReactNode;
	children: React.ReactNode;
	isEmpty?: boolean;
	emptyTitle?: string;
	emptyMessage?: string;
	loading?: boolean;
}

/**
 * Enterprise Grade Module Layout
 * Standardized container and empty state handling.
 */
const ModuleLayout: React.FC<ModuleLayoutProps> = ({
	title,
	subtitle,
	headerExtra,
	headerChildren,
	children,
	isEmpty = false,
	emptyTitle = "No Data Available",
	emptyMessage = "There is currently no information to display for this section.",
	loading = false
}) => {
	const theme = useTheme();

	return (
		<Box
			sx={{
				bgcolor: 'background.default',
				minHeight: '100vh',
				display: 'flex',
				flexDirection: 'column',
			}}
		>
			<ModuleHeader
				title={title}
				subtitle={subtitle}
				extra={headerExtra}
			>
				{headerChildren}
			</ModuleHeader>

			<Container maxWidth="xl" sx={{ py: { xs: 3, sm: 4 }, flexGrow: 1 }}>
				{isEmpty ? (
					<Paper
						elevation={0}
						sx={{
							p: { xs: 6, sm: 12 },
							textAlign: 'center',
							border: '1px solid',
							borderColor: alpha(theme.palette.divider, 0.6),
							borderRadius: 3,
							bgcolor: 'background.paper',
							maxWidth: 700,
							mx: 'auto',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							gap: 3,
							boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)',
							mt: 4
						}}
					>
						{loading ? (
							<CircularProgress size={56} thickness={2} sx={{ color: 'primary.main', mb: 2 }} />
						) : (
							<Box
								sx={{
									width: 80,
									height: 80,
									bgcolor: alpha(theme.palette.primary.main, 0.05),
									borderRadius: '24px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									mb: 2,
									transform: 'rotate(10deg)',
									border: '1px solid',
									borderColor: alpha(theme.palette.primary.main, 0.1)
								}}
							>
								<Typography variant="h3" sx={{ opacity: 0.2, color: 'primary.main', fontWeight: 700 }}>?</Typography>
							</Box>
						)}
						<Box>
							<Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mb: 1, letterSpacing: '-0.01em' }}>
								{emptyTitle}
							</Typography>
							<Typography
								variant="body1"
								color="text.secondary"
								sx={{
									maxWidth: 450,
									mx: 'auto',
									lineHeight: 1.6,
									fontWeight: 450
								}}
							>
								{emptyMessage}
							</Typography>
						</Box>
					</Paper>
				) : (
					<Box
						sx={{
							animation: 'contentEntrance 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
							'@keyframes contentEntrance': {
								from: { opacity: 0, transform: 'translateY(20px)' },
								to: { opacity: 1, transform: 'translateY(0)' }
							}
						}}
					>
						{children}
					</Box>
				)}
			</Container>
		</Box>
	);
};

export default ModuleLayout;
