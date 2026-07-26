import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { Spinner } from '../components/common/spinner';
import LandingPage from '../pages/common/LandingPage';

/**
 * The public "/" route: shows the marketing landing page to signed-out
 * visitors, and sends already-authenticated users straight to their
 * dashboard (mirroring the org-prefix / super-admin redirects ProtectedRoute
 * applies for every other route).
 */
const RootRoute: React.FC = () => {
	const { isAuthenticated, isInitialized, user } = useAppSelector((state) => state.auth);

	if (!isInitialized) {
		return <Spinner fullPage size={96} text="Initializing Gravit" />;
	}

	if (isAuthenticated) {
		const dashboardPath = user?.organization?.public_id ? `/org/${user.organization.public_id}/dashboard` : '/dashboard';
		return <Navigate to={dashboardPath} replace />;
	}

	return <LandingPage />;
};

export default RootRoute;
