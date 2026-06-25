import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login, { Register, VerifyEmail, AcceptInvite, ResetPassword } from '../pages/auth';
import Dashboard from '../pages/dashboard';
import OrgManagement from '../pages/org/OrgManagement';
import { OrgConsole } from '../components/orgs';
import ProtectedRoute from './ProtectedRoute';
import MainLayout from '../components/layout/MainLayout';
import SuccessPage from '../pages/common/SuccessPage';
import NotFoundPage from '../pages/common/NotFoundPage';
import MaintenancePage from '../pages/common/MaintenancePage';
import BillingSettings from '../pages/settings/BillingSettings';
import { LeadsPage, DealsPage, CompaniesPage, ContactsPage } from '../pages/crm';

const AppRouter: React.FC = () => {
	return (
		<Routes>
			<Route path="/login" element={<Login />} />
			<Route path="/register" element={<Register />} />
			<Route path="/verify-email" element={<VerifyEmail />} />
			<Route path="/accept-invite" element={<AcceptInvite />} />
			<Route path="/reset-password" element={<ResetPassword />} />

			{/* Public Support Pages */}
			<Route path="/success" element={<SuccessPage />} />
			<Route path="/maintenance" element={<MaintenancePage />} />

			<Route element={<ProtectedRoute />}>
				{/* Protected Routes */}
				<Route element={<MainLayout />}>
					<Route path="/" element={<Navigate to="/dashboard" replace />} />
					<Route path="dashboard" element={<Dashboard />} />
					<Route path="users" element={<OrgManagement />} />
					<Route path="organizations" element={<OrgConsole />} />
					<Route path="billing" element={<BillingSettings />} />
					<Route path="crm/leads" element={<LeadsPage />} />
					<Route path="crm/deals" element={<DealsPage />} />
					<Route path="crm/companies" element={<CompaniesPage />} />
					<Route path="crm/contacts" element={<ContactsPage />} />

					{/* Prefixed Tenant Routes */}
					<Route path="org/:orgId/dashboard" element={<Dashboard />} />
					<Route path="org/:orgId/users" element={<OrgManagement />} />
					<Route path="org/:orgId/billing" element={<BillingSettings />} />
					<Route path="org/:orgId/crm/leads" element={<LeadsPage />} />
					<Route path="org/:orgId/crm/deals" element={<DealsPage />} />
					<Route path="org/:orgId/crm/companies" element={<CompaniesPage />} />
					<Route path="org/:orgId/crm/contacts" element={<ContactsPage />} />
				</Route>
			</Route>

			<Route path="*" element={<NotFoundPage />} />
		</Routes>
	);
};

export default AppRouter;
