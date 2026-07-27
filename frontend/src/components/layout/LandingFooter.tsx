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
			{ label: 'Platform Overview', href: '#platform' },
			{ label: 'IRIS AI Agent', href: '#iris' },
			{ label: 'Pricing Plans', href: '#pricing' },
			{ label: 'Frequently Asked', href: '#faq' },
		],
	},
	{
		heading: 'Trust & Legal',
		links: [
			{ label: 'Security Center', href: '#security' },
			{ label: 'Privacy Policy', href: '/privacy-policy' },
			{ label: 'Terms & Conditions', href: '/terms' },
			{ label: 'Cookie Settings', href: '/cookies' },
		],
	},
	{
		heading: 'Company',
		links: [
			{ label: 'Sign In', href: '/auth/login' },
			{ label: 'Create Account', href: '/auth/register' },
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
		<Box
			component="footer"
			sx={{
				bgcolor: theme.palette.background.paper,
				borderTop: `1px solid ${theme.palette.divider}`,
				pt: 8,
				pb: 5,
				position: 'relative',
				overflow: 'hidden',
			}}
		>
			<Container maxWidth="lg">
				<Box
					sx={{
						display: 'flex',
						flexDirection: { xs: 'column', md: 'row' },
						justifyContent: 'space-between',
						gap: { xs: 6, md: 4 },
						mb: 7,
					}}
				>
					{/* Left Section: Brand Column */}
					<Box sx={{ maxWidth: { xs: '100%', md: 360 } }}>
						<Box
							component="img"
							src={theme.palette.mode === 'dark' ? '/assets/img/logo/gravit-dark.svg' : '/assets/img/logo/gravit-light.svg'}
							alt="Gravit"
							sx={{
								height: 40,
								cursor: 'pointer',
								mb: 2.5,
								transition: 'opacity 150ms ease-out',
								'&:hover': { opacity: 0.85 },
							}}
							onClick={() => navigate('/')}
						/>
						<Typography
							sx={{
								color: theme.palette.text.secondary,
								fontSize: theme.typography.body2.fontSize,
								lineHeight: 1.7,
								mb: 3,
							}}
						>
							One system, one AI, instead of five separate subscriptions — built for IT services firms,
							consultancies, and staffing agencies.
						</Typography>
					</Box>

					{/* Right Section: Navigation Grid */}
					<Box
						sx={{
							display: 'grid',
							gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
							gap: { xs: 4, sm: 6, md: 8 },
							minWidth: { md: 500, lg: 600 },
						}}
					>
						{FOOTER_COLUMNS.map((col) => (
							<Box key={col.heading}>
								<Typography
									sx={{
										fontSize: theme.typography.caption.fontSize,
										fontWeight: 800,
										letterSpacing: '0.12em',
										textTransform: 'uppercase',
										color: theme.palette.text.primary,
										mb: 2.5,
									}}
								>
									{col.heading}
								</Typography>
								<Stack spacing={1.75}>
									{col.links.map((link) => (
										<Typography
											key={link.label}
											component="a"
											href={link.href}
											onClick={handleLinkClick(link.href)}
											sx={{
												fontSize: theme.typography.body2.fontSize,
												fontWeight: 500,
												color: theme.palette.text.secondary,
												textDecoration: 'none',
												cursor: 'pointer',
												display: 'inline-flex',
												transition: 'color 180ms ease-out, transform 180ms ease-out',
												'&:hover': {
													color: theme.palette.primary.main,
													transform: 'translateX(4px)',
												},
												'@media (prefers-reduced-motion: reduce)': {
													'&:hover': { transform: 'none' },
												},
											}}
										>
											{link.label}
										</Typography>
									))}
								</Stack>
							</Box>
						))}
					</Box>
				</Box>

				<Box sx={{ pt: 4, borderTop: `1px solid ${theme.palette.divider}` }}>
					<Stack
						direction={{ xs: 'column', sm: 'row' }}
						spacing={2.5}
						justifyContent="space-between"
						alignItems={{ xs: 'flex-start', sm: 'center' }}
					>
						<Typography sx={{ color: theme.palette.text.secondary, fontSize: theme.typography.caption.fontSize }}>
							© {year} Taydens. All rights reserved.
						</Typography>
						<Stack direction="row" spacing={3} flexWrap="wrap" rowGap={1}>
							{[
								{ label: 'Privacy Policy', href: '/privacy-policy' },
								{ label: 'Terms & Conditions', href: '/terms' },
								{ label: 'Cookie Policy', href: '/cookies' },
							].map((link) => (
								<Typography
									key={link.label}
									component="a"
									href={link.href}
									onClick={handleLinkClick(link.href)}
									sx={{
										fontSize: theme.typography.caption.fontSize,
										fontWeight: 500,
										color: theme.palette.text.secondary,
										textDecoration: 'none',
										cursor: 'pointer',
										transition: 'color 150ms ease-out',
										'&:hover': { color: theme.palette.primary.main },
									}}
								>
									{link.label}
								</Typography>
							))}
						</Stack>
					</Stack>
				</Box>
			</Container>
		</Box>
	);
};

export default LandingFooter;
