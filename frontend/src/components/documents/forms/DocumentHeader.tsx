import React from 'react';
import { Box, Typography, Avatar, Stack, IconButton, useTheme, useMediaQuery, alpha } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import type { Candidate } from '../../../models/candidate';

interface DocumentHeaderProps {
	candidate: Candidate | null;
	onBack: () => void;
	children?: React.ReactNode;
}

/**
 * DocumentHeader - High-fidelity header for document collection.
 * Optimized for the "Enterprise Console" look with full theme alignment.
 */
const DocumentHeader: React.FC<DocumentHeaderProps> = ({ candidate, onBack, children }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));

	return (
		<Box sx={{ 
			bgcolor: 'secondary.main', 
			pt: isMobile ? 4 : 6, 
			pb: isMobile ? 12 : 16, 
			color: 'common.white',
			px: isMobile ? 2 : 4
		}}>
			<Box sx={{ maxWidth: 1400, mx: 'auto' }}>
				<Stack
					direction={isMobile ? 'column' : 'row'}
					justifyContent="space-between"
					alignItems={isMobile ? 'flex-start' : 'center'}
					spacing={3}
				>
					<Stack direction="row" spacing={3} alignItems="center">
						{!isMobile && (
							<IconButton 
								onClick={onBack} 
								sx={{ 
									color: alpha(theme.palette.common.white, 0.7), 
									bgcolor: alpha(theme.palette.common.white, 0.05), 
									'&:hover': { 
										bgcolor: alpha(theme.palette.common.white, 0.1), 
										color: 'common.white' 
									} 
								}}
							>
								<ArrowBackIcon />
							</IconButton>
						)}
						<Avatar 
							sx={{ 
								width: isMobile ? 64 : 80, 
								height: isMobile ? 64 : 80, 
								bgcolor: 'primary.main',
								fontSize: isMobile ? '1.5rem' : '2rem',
								fontWeight: 700,
								border: `4px solid ${alpha(theme.palette.common.white, 0.1)}`
							}}
						>
							{candidate?.name?.[0] || '?'}
						</Avatar>
						<Box>
							<Typography variant={isMobile ? 'h5' : 'h4'} sx={{ fontWeight: 800, mb: 0.5, letterSpacing: '-0.02em', color: 'inherit' }}>
								{candidate?.name || 'Loading Candidate...'}
							</Typography>
							<Stack direction="row" spacing={2} alignItems="center">
								<Typography sx={{ color: alpha(theme.palette.common.white, 0.6), fontWeight: 500, fontSize: '0.9rem' }}>
									{candidate?.email || 'No email provided'}
								</Typography>
								<Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: alpha(theme.palette.common.white, 0.2) }} />
								<Typography sx={{ color: alpha(theme.palette.common.white, 0.6), fontWeight: 500, fontSize: '0.9rem' }}>
									Candidate ID: {candidate?.public_id ? candidate.public_id.split('-')[0].toUpperCase() : 'UNKNOWN'}
								</Typography>
							</Stack>
						</Box>
					</Stack>
					
					{children}
				</Stack>
			</Box>
		</Box>
	);
};

export default DocumentHeader;
