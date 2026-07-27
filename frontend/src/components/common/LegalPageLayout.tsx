import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import LandingNavbar from '../layout/LandingNavbar';
import LandingFooter from '../layout/LandingFooter';

interface LegalPageLayoutProps {
	pageTitle: string;
	metaDescription: string;
	content: string;
}

/**
 * Shared shell for markdown-authored legal pages (Privacy Policy, Terms, etc.) —
 * same Navbar/Footer chrome and the same prose styling (headings, GFM tables,
 * blockquotes, lists) so every legal page reads consistently. Reads the ambient
 * theme (from the app-wide ColorModeProvider) rather than forcing a fixed mode,
 * so the light/dark toggle in LandingNavbar actually works here.
 */
const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({ pageTitle, metaDescription, content }) => {
	const theme = useTheme();

	return (
		<>
			<title>{pageTitle}</title>
			<meta name="description" content={metaDescription} />
			<meta name="robots" content="noindex, follow" />

			<Box component="main" sx={{ bgcolor: theme.palette.background.paper, minHeight: '100vh' }}>
				<LandingNavbar />

				<Box component="article" sx={{ py: { xs: 7, md: 10 } }}>
					<Container maxWidth="md">
						<Box
							sx={{
								color: theme.palette.text.secondary,
								fontSize: '1rem',
								lineHeight: 1.75,
								wordBreak: 'break-word',

								'& > *:first-of-type': { mt: 0 },

								'& h1': {
									color: theme.palette.text.primary,
									fontWeight: 800,
									letterSpacing: '-0.02em',
									fontSize: { xs: '2rem', md: '2.5rem' },
									mt: 0,
									mb: 1.5,
								},
								'& h2': {
									color: theme.palette.text.primary,
									fontWeight: 700,
									letterSpacing: '-0.01em',
									fontSize: { xs: '1.35rem', md: '1.5rem' },
									mt: 5,
									mb: 2,
									pb: 1.5,
									borderBottom: `1px solid ${theme.palette.divider}`,
								},
								'& h3': {
									color: theme.palette.text.primary,
									fontWeight: 700,
									fontSize: '1.1rem',
									mt: 3,
									mb: 1.5,
								},
								'& p': { m: 0, mb: 2 },
								'& strong': { color: theme.palette.text.primary, fontWeight: 700 },
								'& a': { color: theme.palette.primary.main, fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },

								'& ul, & ol': { pl: 3, mb: 2, mt: 0 },
								'& li': { mb: 1 },
								'& li > p': { mb: 0.5 },

								'& hr': { border: 'none', borderTop: `1px solid ${theme.palette.divider}`, my: 4 },

								'& blockquote': {
									m: 0,
									mb: 3,
									px: 2.5,
									py: 2,
									borderLeft: `3px solid ${theme.palette.accent.main}`,
									borderRadius: theme.layout.radius.card,
									bgcolor: theme.palette.background.default,
									color: theme.palette.text.secondary,
									fontSize: '0.92rem',
									'& p:last-child': { mb: 0 },
								},

								'& code': {
									bgcolor: theme.palette.background.default,
									border: `1px solid ${theme.palette.divider}`,
									px: 0.6,
									py: 0.1,
									borderRadius: 1,
									fontSize: '0.85em',
									fontFamily: 'monospace',
									color: theme.palette.text.primary,
								},

								// GFM tables can run wide — scroll the table itself rather than
								// letting it force horizontal scroll on the page.
								'& table': {
									display: 'block',
									overflowX: 'auto',
									width: '100%',
									borderCollapse: 'collapse',
									fontSize: '0.85rem',
									mb: 3,
									border: `1px solid ${theme.palette.divider}`,
									borderRadius: theme.layout.radius.card,
								},
								'& th, & td': {
									border: `1px solid ${theme.palette.divider}`,
									px: 1.5,
									py: 1.25,
									textAlign: 'left',
									verticalAlign: 'top',
									lineHeight: 1.55,
								},
								'& th': {
									bgcolor: theme.palette.background.default,
									color: theme.palette.text.primary,
									fontWeight: 700,
									whiteSpace: 'nowrap',
								},
								'& tr:nth-of-type(even) td': { bgcolor: theme.palette.background.default },

								'& em': { fontStyle: 'italic' },
							}}
						>
							<ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
						</Box>

						<Typography sx={{ mt: 6, fontSize: '0.85rem', color: theme.palette.text.secondary }}>
							Questions about this page? Reach out from our{' '}
							<Box component="a" href="/#contact" sx={{ color: theme.palette.primary.main, fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
								Contact section
							</Box>.
						</Typography>
					</Container>
				</Box>

				<LandingFooter />
			</Box>
		</>
	);
};

export default LegalPageLayout;
