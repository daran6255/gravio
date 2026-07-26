import React, { useEffect, useState } from 'react';
import { Box, Button, Container, IconButton, Drawer, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Menu as MenuIcon, Close as CloseIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useResponsive } from '../../theme/responsive';

const NAV_LINKS = [
	{ label: 'Platform', href: '#platform' },
	{ label: 'IRIS', href: '#iris' },
	{ label: 'Pricing', href: '#pricing' },
	{ label: 'FAQ', href: '#faq' },
];

const prefersReducedMotion = () =>
	typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const LandingNavbar: React.FC = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const { isMobile } = useResponsive();
	const [scrolled, setScrolled] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 8);
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	}, []);

	const handleAnchorClick = (href: string) => {
		setMenuOpen(false);
		document.querySelector(href)?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
	};

	return (
		<Box
			component="header"
			sx={{
				position: 'sticky',
				top: 0,
				zIndex: theme.zIndex.appBar,
				borderBottom: `1px solid ${scrolled ? theme.palette.divider : 'transparent'}`,
				bgcolor: scrolled ? alpha(theme.palette.background.paper, 0.75) : 'transparent',
				backdropFilter: scrolled ? 'blur(16px)' : 'none',
				transition: 'background-color 250ms ease-out, border-color 250ms ease-out',
			}}
		>
			<Container maxWidth="lg">
				<Box sx={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
					<Box
						component="img"
						src="/assets/img/logo/gravit-light.svg"
						alt="Gravit"
						sx={{ height: 32, cursor: 'pointer' }}
						onClick={() => navigate('/')}
					/>

					{!isMobile && (
						<Stack direction="row" spacing={4} sx={{ flex: 1, justifyContent: 'center' }}>
							{NAV_LINKS.map((link) => (
								<Typography
									key={link.href}
									component="a"
									href={link.href}
									onClick={(e) => {
										e.preventDefault();
										handleAnchorClick(link.href);
									}}
									sx={{
										fontSize: '0.9rem',
										fontWeight: 600,
										color: theme.palette.text.secondary,
										textDecoration: 'none',
										cursor: 'pointer',
										transition: 'color 150ms ease-out',
										'&:hover': { color: theme.palette.text.primary },
									}}
								>
									{link.label}
								</Typography>
							))}
						</Stack>
					)}

					{!isMobile ? (
						<Stack direction="row" spacing={1.5} alignItems="center">
							<Button onClick={() => navigate('/auth/login')} sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
								Sign In
							</Button>
							<Button
								variant="contained"
								onClick={() => navigate('/auth/register')}
								sx={{
									bgcolor: theme.palette.primary.main,
									color: '#ffffff',
									fontWeight: 700,
									px: 2.5,
									borderRadius: theme.layout.radius.button,
									'&:hover': { bgcolor: theme.palette.primary.dark },
								}}
							>
								Start Free Trial
							</Button>
						</Stack>
					) : (
						<IconButton onClick={() => setMenuOpen(true)} sx={{ color: theme.palette.text.primary }} aria-label="Open menu">
							<MenuIcon />
						</IconButton>
					)}
				</Box>
			</Container>

			<Drawer
				anchor="right"
				open={menuOpen}
				onClose={() => setMenuOpen(false)}
				slotProps={{ paper: { sx: { width: '82vw', maxWidth: 340, bgcolor: theme.palette.background.paper, p: 3 } } }}
			>
				<Stack direction="row" justifyContent="flex-end">
					<IconButton onClick={() => setMenuOpen(false)} sx={{ color: theme.palette.text.primary }} aria-label="Close menu">
						<CloseIcon />
					</IconButton>
				</Stack>
				<Stack spacing={3} sx={{ mt: 2 }}>
					{NAV_LINKS.map((link) => (
						<Typography
							key={link.href}
							component="a"
							href={link.href}
							onClick={(e) => {
								e.preventDefault();
								handleAnchorClick(link.href);
							}}
							sx={{ fontSize: '1.05rem', fontWeight: 600, color: theme.palette.text.primary, textDecoration: 'none', cursor: 'pointer' }}
						>
							{link.label}
						</Typography>
					))}
					<Button
						fullWidth
						variant="outlined"
						onClick={() => navigate('/auth/login')}
						sx={{ color: theme.palette.text.primary, borderColor: theme.palette.divider }}
					>
						Sign In
					</Button>
					<Button
						fullWidth
						variant="contained"
						onClick={() => navigate('/auth/register')}
						sx={{ bgcolor: theme.palette.primary.main, color: '#ffffff', fontWeight: 700 }}
					>
						Start Free Trial
					</Button>
				</Stack>
			</Drawer>
		</Box>
	);
};

export default LandingNavbar;
