import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login, { Register, VerifyEmail, AcceptInvite } from '../pages/auth';
import Dashboard from '../pages/dashboard';
import UserManagement from '../pages/user/UserManagement';
import ProtectedRoute from './ProtectedRoute';
import MainLayout from '../components/layout/MainLayout';
import SuccessPage from '../pages/common/SuccessPage';
import NotFoundPage from '../pages/common/NotFoundPage';
import MaintenancePage from '../pages/common/MaintenancePage';
import BillingSettings from '../pages/settings/BillingSettings';

const AppRouter: React.FC = () => {
	return (
		<Routes>
			<Route path="/login" element={<Login />} />
			<Route path="/register" element={<Register />} />
			<Route path="/verify-email" element={<VerifyEmail />} />
			<Route path="/accept-invite" element={<AcceptInvite />} />

			{/* Public Support Pages */}
			<Route path="/success" element={<SuccessPage />} />
			<Route path="/maintenance" element={<MaintenancePage />} />

			<Route element={<ProtectedRoute />}>
				{/* Protected Routes */}
				<Route element={<MainLayout />}>
					<Route path="/" element={<Navigate to="/dashboard" replace />} />
					<Route path="dashboard" element={<Dashboard />} />
					<Route path="users" element={<UserManagement />} />
					<Route path="billing" element={<BillingSettings />} />
					
					{/* Prefixed Tenant Routes */}
					<Route path="org/:orgId/dashboard" element={<Dashboard />} />
					<Route path="org/:orgId/users" element={<UserManagement />} />
					<Route path="org/:orgId/billing" element={<BillingSettings />} />
				</Route>
			</Route>

			<Route path="*" element={<NotFoundPage />} />
		</Routes>
	);
};

export default AppRouter;
