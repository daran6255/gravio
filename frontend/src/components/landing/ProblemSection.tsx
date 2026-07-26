import React from 'react';
import { Box, Container, Stack, Typography, alpha } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Close as CloseIcon } from '@mui/icons-material';
import Reveal from './Reveal';

const PAIN_POINTS = [
	'A separate login, bill, and learning curve for your CRM, project tracker, timesheets, HR system, and scheduling tool',
	'Every one of those tools now sells its own "AI" add-on — so you\'re paying five separate AI bills for five disconnected assistants',
	'None of them know what the others know: sales has no idea a client is overdue on invoices; HR has no idea a project is understaffed',
];

const ProblemSection: React.FC = () => {
	const theme = useTheme();

	return (
		<Box component="section" sx={{ bgcolor: theme.palette.background.paper, py: { xs: 9, md: 12 } }}>
			<Container maxWidth="md">
				<Reveal>
					<Typography sx={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.palette.primary.main, mb: 1.5, textAlign: 'center' }}>
						The Problem
					</Typography>
					<Typography component="h2" variant="h2" sx={{ color: theme.palette.text.primary, mb: 5, textAlign: 'center' }}>
						Running an IT services or staffing firm shouldn't mean juggling five tools
					</Typography>
				</Reveal>

				<Stack spacing={2.5}>
					{PAIN_POINTS.map((point, i) => (
						<Reveal key={point} delay={i * 80}>
							<Stack
								direction="row"
								spacing={2}
								alignItems="flex-start"
								sx={{
									p: 2.5,
									borderRadius: theme.layout.radius.card,
									border: `1px solid ${theme.palette.divider}`,
									bgcolor: theme.palette.background.default,
								}}
							>
								<Box
									sx={{
										flexShrink: 0,
										width: 28,
										height: 28,
										borderRadius: '50%',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										bgcolor: alpha(theme.palette.error.main, 0.1),
									}}
								>
									<CloseIcon sx={{ fontSize: 16, color: theme.palette.error.main }} />
								</Box>
								<Typography sx={{ color: theme.palette.text.primary, fontSize: '1.02rem', lineHeight: 1.6, pt: 0.25 }}>
									{point}
								</Typography>
							</Stack>
						</Reveal>
					))}
				</Stack>
			</Container>
		</Box>
	);
};

export default ProblemSection;
