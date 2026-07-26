import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { Spinner } from '../components/common/spinner';
import { getRouteConfig } from '../config/navigation';

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
		return <Navigate to="/auth/login" replace />;
	}

	// Resolve route permission configuration centrally from navigation.ts
	const routeConfig = getRouteConfig(location.pathname);
	if (routeConfig) {
		// Normalize route to check against individual constraints
		let normalizedPath = location.pathname;
		const orgMatch = location.pathname.match(/^\/org\/[^\/]+(\/.*)?$/);
		if (orgMatch) {
			normalizedPath = orgMatch[1] || '/';
		}
		if (normalizedPath === '/users' && user?.organization?.others?.account_type === 'individual') {
			return <Navigate to="/dashboard" replace />;
		}

		// Timesheets and HR Administration both assume a team of employees to track —
		// nothing an individual/freelancer account needs, so block direct navigation too.
		const isIndividualBlockedRoute =
			normalizedPath === '/timesheets' || normalizedPath.startsWith('/hr/admin/');
		if (isIndividualBlockedRoute && user?.organization?.others?.account_type === 'individual') {
			return <Navigate to="/dashboard" replace />;
		}

		// Gated on Superuser flag
		if (routeConfig.requiresSuperuser && !user?.is_superuser) {
			return <Navigate to="/dashboard" replace />;
		}

		// If user is superuser with NO organization, they can ONLY access requiresSuperuser routes or the dashboard
		if (user?.is_superuser && !user?.organization && !routeConfig.requiresSuperuser && routeConfig.path !== '/dashboard') {
			return <Navigate to="/dashboard" replace />;
		}

		// Gated on specific roles list
		if (routeConfig.roles) {
			const hasRole = user?.role && routeConfig.roles.includes(user.role);
			if (!hasRole && !user?.is_superuser) {
				const targetRedirect = user?.organization?.public_id ? `/org/${user.organization.public_id}/dashboard` : '/dashboard';
				return <Navigate to={targetRedirect} replace />;
			}
		}
	}

	// Redirect tenant users if they access a route without the /org/:orgId prefix
	// ("/" is handled by RootRoute before ProtectedRoute ever mounts, so pathname is never "/" here)
	if (user?.organization?.public_id) {
		const orgPrefix = `/org/${user.organization.public_id}`;
		if (!location.pathname.startsWith('/org/') && location.pathname !== '/organizations') {
			return <Navigate to={`${orgPrefix}${location.pathname}${location.search}`} replace />;
		}
	}

	// User is authenticated, render protected content
	return <Outlet />;
};

export default ProtectedRoute;
