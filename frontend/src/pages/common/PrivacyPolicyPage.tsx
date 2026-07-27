import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getThemeByMode } from '../../theme/theme';
import { LandingNavbar, LandingFooter } from '../../components/landing';
import privacyPolicyContent from '../../data/privacyPolicyContent';

// Legal pages always present in light mode, same precedent as the rest of the
// marketing site (see LandingPage.tsx).
const pageTheme = getThemeByMode('light');

const PrivacyPolicyPage: React.FC = () => {
	return (
		<ThemeProvider theme={pageTheme}>
			<title>Privacy Policy | Gravit</title>
			<meta name="description" content="How Gravit collects, uses, stores, and protects personal data across CRM, Projects, Timesheets, HR & Payroll, Booking, and the IRIS AI agent." />
			<meta name="robots" content="noindex, follow" />

			<Box component="main" sx={{ bgcolor: pageTheme.palette.background.paper, minHeight: '100vh' }}>
				<LandingNavbar />

				<Box component="article" sx={{ py: { xs: 7, md: 10 } }}>
					<Container maxWidth="md">
						<Box
							sx={{
								color: pageTheme.palette.text.secondary,
								fontSize: '1rem',
								lineHeight: 1.75,
								wordBreak: 'break-word',

								'& > *:first-of-type': { mt: 0 },

								'& h1': {
									color: pageTheme.palette.text.primary,
									fontWeight: 800,
									letterSpacing: '-0.02em',
									fontSize: { xs: '2rem', md: '2.5rem' },
									mt: 0,
									mb: 1.5,
								},
								'& h2': {
									color: pageTheme.palette.text.primary,
									fontWeight: 700,
									letterSpacing: '-0.01em',
									fontSize: { xs: '1.35rem', md: '1.5rem' },
									mt: 5,
									mb: 2,
									pb: 1.5,
									borderBottom: `1px solid ${pageTheme.palette.divider}`,
								},
								'& h3': {
									color: pageTheme.palette.text.primary,
									fontWeight: 700,
									fontSize: '1.1rem',
									mt: 3,
									mb: 1.5,
								},
								'& p': { m: 0, mb: 2 },
								'& strong': { color: pageTheme.palette.text.primary, fontWeight: 700 },
								'& a': { color: pageTheme.palette.primary.main, fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },

								'& ul, & ol': { pl: 3, mb: 2, mt: 0 },
								'& li': { mb: 1 },
								'& li > p': { mb: 0.5 },

								'& hr': { border: 'none', borderTop: `1px solid ${pageTheme.palette.divider}`, my: 4 },

								'& blockquote': {
									m: 0,
									mb: 3,
									px: 2.5,
									py: 2,
									borderLeft: `3px solid ${pageTheme.palette.accent.main}`,
									borderRadius: pageTheme.layout.radius.card,
									bgcolor: pageTheme.palette.background.default,
									color: pageTheme.palette.text.secondary,
									fontSize: '0.92rem',
									'& p:last-child': { mb: 0 },
								},

								'& code': {
									bgcolor: pageTheme.palette.background.default,
									border: `1px solid ${pageTheme.palette.divider}`,
									px: 0.6,
									py: 0.1,
									borderRadius: 1,
									fontSize: '0.85em',
									fontFamily: 'monospace',
									color: pageTheme.palette.text.primary,
								},

								// GFM tables can run wide (Section 3's data map) — scroll the table
								// itself rather than letting it force horizontal scroll on the page.
								'& table': {
									display: 'block',
									overflowX: 'auto',
									width: '100%',
									borderCollapse: 'collapse',
									fontSize: '0.85rem',
									mb: 3,
									border: `1px solid ${pageTheme.palette.divider}`,
									borderRadius: pageTheme.layout.radius.card,
								},
								'& th, & td': {
									border: `1px solid ${pageTheme.palette.divider}`,
									px: 1.5,
									py: 1.25,
									textAlign: 'left',
									verticalAlign: 'top',
									lineHeight: 1.55,
								},
								'& th': {
									bgcolor: pageTheme.palette.background.default,
									color: pageTheme.palette.text.primary,
									fontWeight: 700,
									whiteSpace: 'nowrap',
								},
								'& tr:nth-of-type(even) td': { bgcolor: pageTheme.palette.background.default },

								'& em': { fontStyle: 'italic' },
							}}
						>
							<ReactMarkdown remarkPlugins={[remarkGfm]}>{privacyPolicyContent}</ReactMarkdown>
						</Box>

						<Typography sx={{ mt: 6, fontSize: '0.85rem', color: pageTheme.palette.text.secondary }}>
							Questions about this policy? Reach out from our{' '}
							<Box component="a" href="/#contact" sx={{ color: pageTheme.palette.primary.main, fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
								Contact section
							</Box>.
						</Typography>
					</Container>
				</Box>

				<LandingFooter />
			</Box>
		</ThemeProvider>
	);
};

export default PrivacyPolicyPage;
