import React, { useEffect } from 'react';
import { Box, CssBaseline } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import Breadcrumbs from '../common/breadcrumb/Breadcrumbs';
import { useAppSelector } from '../../store/hooks';

const MainLayout: React.FC = () => {
	const location = useLocation();
	const { user } = useAppSelector((state) => state.auth);
	const isOrgPage = location.pathname === '/organizations';

	const showBreadcrumbs = user?.is_superuser && !isOrgPage;

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
				component="main"
				sx={{
					flexGrow: 1,
					p: { xs: 2, sm: 3 },
					width: '100%', // Take full available space
					transition: (theme) => theme.transitions.create(['margin', 'width'], {
						easing: theme.transitions.easing.sharp,
						duration: theme.transitions.duration.standard,
					}),
					mt: '64px',
					display: 'flex',
					flexDirection: 'column',
					height: 'calc(100vh - 64px)',
					overflowY: 'auto',
					overflowX: 'hidden'
				}}
			>
				{showBreadcrumbs && <Breadcrumbs />}
				<Box sx={{ flexGrow: 1 }}>
					<Outlet />
				</Box>
				<Footer />
			</Box>
		</Box>
	);
};

export default MainLayout;

