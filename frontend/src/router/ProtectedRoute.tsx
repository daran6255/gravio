import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { Spinner } from '../components/common/spinner';

const ProtectedRoute: React.FC = () => {
	const { isAuthenticated, isInitialized, user } = useAppSelector((state) => state.auth);
	const location = useLocation();

	// Wait for auth initialization before making routing decisions
	if (!isInitialized) {
		return (
			<Spinner
				fullPage
				size={96}
				text="Initializing Gravit"
			/>
		);
	}

	// If not authenticated after initialization, redirect to login
	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	// Restrict Superadmin-only pages
	if (location.pathname === '/organizations' && !user?.is_superuser) {
		return <Navigate to="/dashboard" replace />;
	}

	// Redirect tenant users if they access a route without the /org/:orgId prefix
	if (user?.organization?.public_id) {
		const orgPrefix = `/org/${user.organization.public_id}`;
		if (!location.pathname.startsWith('/org/') && location.pathname !== '/organizations') {
			const targetPath = location.pathname === '/' ? '/dashboard' : location.pathname;
			return <Navigate to={`${orgPrefix}${targetPath}${location.search}`} replace />;
		}
	} else if (location.pathname === '/') {
		// Super Admin root redirect
		return <Navigate to="/dashboard" replace />;
	}

	// User is authenticated, render protected content
	return <Outlet />;
};

export default ProtectedRoute;
