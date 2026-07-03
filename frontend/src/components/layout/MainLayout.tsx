import React from 'react';
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

	// Settings pages: keep Navbar and Sidebar (Sidebar dynamically loads settings menus)
	if (isSettingsRoute) {
		return (
			<Box sx={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
				<CssBaseline />
				<Navbar />
				<Sidebar />
				<Box sx={{ flexGrow: 1, width: '100%', display: 'flex', flexDirection: 'column', mt: '64px' }}>
					<Outlet />
				</Box>
			</Box>
		);
	}

	return (
		<Box sx={{ display: 'flex', minHeight: '100vh' }}>
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
					minHeight: 'calc(100vh - 64px)',
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

