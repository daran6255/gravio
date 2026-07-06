import React, { useEffect } from 'react';
import { Box, CssBaseline } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';

const MainLayout: React.FC = () => {
	const location = useLocation();

	// Detect settings routes — they use their own SettingsLayout with a dedicated sidebar
	const isSettingsRoute =
		location.pathname === '/settings' ||
		location.pathname.startsWith('/settings/') ||
		/^\/org\/[^/]+\/settings(\/|$)/.test(location.pathname);

	useEffect(() => {
		// Store original styles
		const originalOverflow = document.body.style.overflow;
		const originalHeight = document.body.style.height;
		const originalHtmlOverflow = document.documentElement.style.overflow;
		const originalHtmlHeight = document.documentElement.style.height;

		// Set overflow hidden to body and html to avoid double/window scrollbars
		document.body.style.overflow = 'hidden';
		document.body.style.height = '100%';
		document.documentElement.style.overflow = 'hidden';
		document.documentElement.style.height = '100%';

		return () => {
			// Restore original styles on unmount (e.g. for standalone auth pages)
			document.body.style.overflow = originalOverflow;
			document.body.style.height = originalHeight;
			document.documentElement.style.overflow = originalHtmlOverflow;
			document.documentElement.style.height = originalHtmlHeight;
		};
	}, []);

	// Settings pages: keep Navbar and Sidebar (Sidebar dynamically loads settings menus)
	if (isSettingsRoute) {
		return (
			<Box sx={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden' }}>
				<CssBaseline />
				<Navbar />
				<Sidebar />
				<Box
					sx={{
						flexGrow: 1,
						width: '100%',
						display: 'flex',
						flexDirection: 'column',
						mt: '64px',
						height: 'calc(100vh - 64px)',
						overflowY: 'auto',
						overflowX: 'hidden'
					}}
				>
					<Outlet />
				</Box>
			</Box>
		);
	}

	return (
		<Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
			<CssBaseline />
			<Navbar />
			<Sidebar />
			<Box
				sx={{
					flexGrow: 1,
					display: 'flex',
					flexDirection: 'column',
					height: 'calc(100vh - 64px)',
					mt: '64px',
					overflow: 'hidden'
				}}
			>
				<Box
					component="main"
					sx={{
						flexGrow: 1,
						pt: { xs: 2, sm: 3 },
						px: { xs: 2, sm: 3 },
						pb: { xs: 2, sm: 3 },
						width: '100%', // Take full available space
						transition: (theme) => theme.transitions.create(['margin', 'width'], {
							easing: theme.transitions.easing.sharp,
							duration: theme.transitions.duration.standard,
						}),
						overflowY: 'auto',
						overflowX: 'hidden',
						display: 'flex',
						flexDirection: 'column'
					}}
				>
					<Box sx={{ flexGrow: 1 }}>
						<Outlet />
					</Box>
				</Box>
				<Footer />
			</Box>
		</Box>
	);
};

export default MainLayout;

