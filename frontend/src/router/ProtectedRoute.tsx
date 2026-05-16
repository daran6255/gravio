import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAppSelector } from '../store/hooks';

const ProtectedRoute: React.FC = () => {
	const { isAuthenticated, isInitialized } = useAppSelector((state) => state.auth);

	// Wait for auth initialization before making routing decisions
	if (!isInitialized) {
		return (
			<Box
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					minHeight: '100vh',
				}}
			>
				<CircularProgress />
			</Box>
		);
	}

	// If not authenticated after initialization, redirect to login
	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	// User is authenticated, render protected content
	return <Outlet />;
};

export default ProtectedRoute;
