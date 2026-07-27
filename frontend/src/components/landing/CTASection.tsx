import React from 'react';
import { Box, Button, Container, Typography, alpha } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Reveal from './Reveal';

const CTASection: React.FC = () => {
	const theme = useTheme();
	const navigate = useNavigate();

	return (
		<Box component="section" sx={{ bgcolor: theme.palette.background.default, py: { xs: 9, md: 11 } }}>
			<Container maxWidth="md">
				<Reveal>
					<Box
						sx={{
							textAlign: 'center',
							position: 'relative',
							overflow: 'hidden',
							borderRadius: theme.layout.radius.card,
							background: theme.gradients.brandDiagonal,
							px: { xs: 4, sm: 8 },
							py: { xs: 6, sm: 8 },
							boxShadow: `0 24px 60px -24px ${alpha(theme.palette.primary.main, 0.45)}`,
						}}
					>
						<Typography component="h2" variant="h2" sx={{ color: theme.palette.common.white, mb: 2 }}>
							Ready to run everything from one system?
						</Typography>
						<Typography sx={{ color: alpha(theme.palette.common.white, 0.85), fontSize: theme.typography.body1.fontSize, mb: 4, maxWidth: 480, mx: 'auto' }}>
							Start a free trial and let IRIS start working across your CRM, projects, and team from day one.
						</Typography>
						<Button
							size="large"
							variant="contained"
							endIcon={<ArrowForwardIcon />}
							onClick={() => navigate('/auth/register')}
							sx={{
								bgcolor: theme.palette.common.white,
								color: theme.palette.primary.dark,
								fontWeight: 700,
								fontSize: theme.typography.button.fontSize,
								px: 4,
								py: 1.4,
								borderRadius: theme.layout.radius.button,
								'&:hover': { bgcolor: alpha(theme.palette.common.white, 0.9) },
							}}
						>
							Start Free Trial
						</Button>
					</Box>
				</Reveal>
			</Container>
		</Box>
	);
};

export default CTASection;
