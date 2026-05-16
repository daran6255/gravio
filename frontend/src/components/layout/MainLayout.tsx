import React from 'react';
import { Box, CssBaseline } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import Breadcrumbs from '../common/breadcrumb/Breadcrumbs';
import { useNotificationWatcher } from '../../hooks/useNotificationWatcher';
import AIChatWidget from '../ai/AIChatWidget';

const MainLayout: React.FC = () => {
	useNotificationWatcher();

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
					mt: '48px',
					display: 'flex',
					flexDirection: 'column',
					minHeight: 'calc(100vh - 48px)',
					overflowX: 'hidden'
				}}
			>
				<Breadcrumbs />
				<Box sx={{ flexGrow: 1 }}>
					<Outlet />
				</Box>
				<Footer />
			</Box>
			{/* Floating AI Coworker Widget */}
			<AIChatWidget />
		</Box>
	);
};

export default MainLayout;
