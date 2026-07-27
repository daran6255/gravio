import React from 'react';
import { Box, Container, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

const prefersReducedMotion = () =>
	typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const FOOTER_COLUMNS = [
	{
		heading: 'Product',
		links: [
			{ label: 'Platform', href: '#platform' },
			{ label: 'IRIS AI', href: '#iris' },
			{ label: 'Security', href: '#security' },
			{ label: 'Pricing', href: '#pricing' },
		],
	},
	{
		heading: 'Account',
		links: [
			{ label: 'Sign In', href: '/auth/login' },
			{ label: 'Start Free Trial', href: '/auth/register' },
		],
	},
];

const LandingFooter: React.FC = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const year = new Date().getFullYear();

	const handleLinkClick = (href: string) => (e: React.MouseEvent) => {
		e.preventDefault();
		if (href.startsWith('#')) {
			document.querySelector(href)?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
		} else {
			navigate(href);
		}
	};

	return (
		<Box component="footer" sx={{ bgcolor: theme.palette.background.paper, borderTop: `1px solid ${theme.palette.divider}`, pt: 7, pb: 4 }}>
			<Container maxWidth="lg">
				<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.4fr repeat(2, 1fr)' }, gap: { xs: 5, sm: 4 }, mb: 6 }}>
					<Box>
						<Box
							component="img"
							src={theme.palette.mode === 'dark' ? '/assets/img/logo/gravit-dark.svg' : '/assets/img/logo/gravit-light.svg'}
							alt="Gravit"
							sx={{ height: 48, cursor: 'pointer', mb: 2 }}
							onClick={() => navigate('/')}
						/>
						<Typography sx={{ color: theme.palette.text.secondary, fontSize: theme.typography.body2.fontSize, lineHeight: 1.6, maxWidth: 280 }}>
							One system, one AI, instead of five separate subscriptions — built for IT services firms,
							consultancies, and staffing agencies.
						</Typography>
					</Box>

					{FOOTER_COLUMNS.map((col) => (
						<Box key={col.heading}>
							<Typography sx={{ fontSize: theme.typography.caption.fontSize, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: theme.palette.text.secondary, mb: 2 }}>
								{col.heading}
							</Typography>
							<Stack spacing={1.5}>
								{col.links.map((link) => (
									<Typography
										key={link.label}
										component="a"
										href={link.href}
										onClick={handleLinkClick(link.href)}
										sx={{ fontSize: theme.typography.body2.fontSize, fontWeight: 500, color: theme.palette.text.primary, textDecoration: 'none', cursor: 'pointer', '&:hover': { color: theme.palette.primary.main } }}
									>
										{link.label}
									</Typography>
								))}
							</Stack>
						</Box>
					))}
				</Box>

				<Box sx={{ pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
					<Typography sx={{ color: theme.palette.text.secondary, fontSize: theme.typography.caption.fontSize }}>
						© {year} Taydens. All rights reserved.
					</Typography>
				</Box>
			</Container>
		</Box>
	);
};

export default LandingFooter;
