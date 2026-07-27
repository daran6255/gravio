import React from 'react';
import { Box, Container, Stack, Typography, alpha } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { FormatQuote as FormatQuoteIcon } from '@mui/icons-material';
import Reveal from './Reveal';

// Illustrative sample content — not real customer quotes yet. Each card is
// clearly labeled "Illustrative example" so this reads honestly on its own.
const SAMPLE_QUOTES = [
	{
		quote: 'We were paying for a CRM, a project tool, and a time tracker separately — and still copying data between them by hand. Having one system cuts that busywork out entirely.',
		role: 'Operations Lead',
		company: '30-person IT services firm',
	},
	{
		quote: 'The idea of one AI that can see sales, delivery, and HR data at once — instead of three separate AI add-ons — is exactly the kind of consolidation we\'re looking for.',
		role: 'Managing Partner',
		company: 'Boutique consultancy',
	},
	{
		quote: 'Staffing firms live and die by how fast you can move a candidate through the pipeline. Fewer tools to context-switch between means less friction per placement.',
		role: 'Delivery Manager',
		company: 'IT staffing agency',
	},
];

const TestimonialsSection: React.FC = () => {
	const theme = useTheme();

	return (
		<Box component="section" sx={{ bgcolor: theme.palette.background.paper, py: { xs: 9, md: 12 } }}>
			<Container maxWidth="lg">
				<Reveal>
					<Typography component="h2" variant="h2" sx={{ color: theme.palette.text.primary, textAlign: 'center', mb: { xs: 6, md: 7 } }}>
						Fewer tools. Less admin. More delivery time.
					</Typography>
				</Reveal>

				<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
					{SAMPLE_QUOTES.map((item, i) => (
						<Reveal key={item.role} delay={i * 80}>
							<Box
								sx={{
									height: '100%',
									p: 3.5,
									borderRadius: theme.layout.radius.card,
									border: `1px solid ${theme.palette.divider}`,
									bgcolor: theme.palette.background.default,
									display: 'flex',
									flexDirection: 'column',
								}}
							>
								<FormatQuoteIcon sx={{ fontSize: 28, color: alpha(theme.palette.primary.main, 0.35), mb: 1.5 }} />
								<Typography sx={{ color: theme.palette.text.primary, fontSize: theme.typography.body1.fontSize, lineHeight: 1.65, mb: 3, flex: 1 }}>
									&ldquo;{item.quote}&rdquo;
								</Typography>
								<Stack spacing={0.25}>
									<Typography sx={{ fontWeight: 700, fontSize: theme.typography.body2.fontSize, color: theme.palette.text.primary }}>{item.role}</Typography>
									<Typography sx={{ fontSize: theme.typography.caption.fontSize, color: theme.palette.text.secondary }}>{item.company}</Typography>
									<Typography sx={{ fontSize: theme.typography.caption.fontSize, color: alpha(theme.palette.text.secondary, 0.7), fontStyle: 'italic', mt: 0.75 }}>
										Illustrative example
									</Typography>
								</Stack>
							</Box>
						</Reveal>
					))}
				</Box>
			</Container>
		</Box>
	);
};

export default TestimonialsSection;
