import React from 'react';
import { Box, Typography, Stack, useMediaQuery, useTheme } from '@mui/material';

interface PageHeaderProps {
	title: string;
	subtitle?: string;
	action?: React.ReactNode;
	mb?: number;
}

/**
 * Common Page Header Component
 * Standardized header for all modules with consistent AWS-style typography and responsive layout.
 */
const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action, mb = 4 }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	return (
		<Box sx={{ mb }}>
			<Stack 
				direction={isMobile ? "column" : "row"} 
				justifyContent="space-between" 
				alignItems={isMobile ? "flex-start" : "center"} 
				spacing={2}
			>
				<Box>
					<Typography
						variant={isMobile ? "h5" : "h4"}
						component="h1"
						sx={{
							fontWeight: 500,
							color: 'text.primary',
							mb: 0.5,
							letterSpacing: '-0.02em'
						}}
					>
						{title}
					</Typography>
					{subtitle && (
						<Typography variant="body2" color="text.secondary">
							{subtitle}
						</Typography>
					)}
				</Box>

				{action && (
					<Box sx={{ width: isMobile ? '100%' : 'auto' }}>
						{action}
					</Box>
				)}
			</Stack>
		</Box>
	);
};

export default PageHeader;
