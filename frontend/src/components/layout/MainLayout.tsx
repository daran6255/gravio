import React from 'react';
import { Box, CssBaseline } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import Breadcrumbs from '../common/breadcrumb/Breadcrumbs';

const MainLayout: React.FC = () => {

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
				<Breadcrumbs />
				<Box sx={{ flexGrow: 1 }}>
					<Outlet />
				</Box>
				<Footer />
			</Box>
		</Box>
	);
};

export default MainLayout;
