import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login, { Register, VerifyEmail, AcceptInvite, ResetPassword } from '../pages/auth';
import Dashboard from '../pages/dashboard';
import OrgManagement from '../pages/org/OrgManagement';
import { OrgConsole } from '../components/orgs';
import ProtectedRoute from './ProtectedRoute';
import MainLayout from '../components/layout/MainLayout';
import SettingsLayout from '../components/layout/SettingsLayout';
import SuccessPage from '../pages/common/SuccessPage';
import NotFoundPage from '../pages/common/NotFoundPage';
import MaintenancePage from '../pages/common/MaintenancePage';
import BillingSettings from '../pages/settings/BillingSettings';
import { LeadsPage, DealsPage, CompaniesPage, TasksPage } from '../pages/crm';
import { ProjectsListPage, ProjectDetailPage } from '../pages/projects';

// Legacy auth links (e.g. tokenized verify/invite/reset links already sent by
// email before the /auth prefix existed) redirect here — preserve the query
// string so the token survives the redirect.
const LegacyAuthRedirect: React.FC<{ to: string }> = ({ to }) => {
	const location = useLocation();
	return <Navigate to={`${to}${location.search}`} replace />;
};

const AppRouter: React.FC = () => {
	return (
		<Routes>
			<Route path="/auth/login" element={<Login />} />
			<Route path="/auth/register" element={<Register />} />
			<Route path="/auth/verify-email" element={<VerifyEmail />} />
			<Route path="/auth/accept-invite" element={<AcceptInvite />} />
			<Route path="/auth/reset-password" element={<ResetPassword />} />

			{/* Legacy paths — redirect old bookmarks/links to the new /auth/* routes */}
			<Route path="/login" element={<LegacyAuthRedirect to="/auth/login" />} />
			<Route path="/register" element={<LegacyAuthRedirect to="/auth/register" />} />
			<Route path="/verify-email" element={<LegacyAuthRedirect to="/auth/verify-email" />} />
			<Route path="/accept-invite" element={<LegacyAuthRedirect to="/auth/accept-invite" />} />
			<Route path="/reset-password" element={<LegacyAuthRedirect to="/auth/reset-password" />} />

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

					{/* Legacy redirect: old account-settings → settings */}
					<Route path="account-settings" element={<Navigate to="/settings" replace />} />

					{/* Settings — single page, all sections, own sidebar */}
					<Route path="settings" element={<SettingsLayout />} />

					<Route path="crm/leads" element={<LeadsPage />} />
					<Route path="crm/deals" element={<DealsPage />} />
					<Route path="crm/companies" element={<CompaniesPage />} />
					<Route path="crm/tasks" element={<TasksPage />} />

					{/* Project Management */}
					<Route path="projects" element={<ProjectsListPage />} />
					<Route path="projects/:publicId" element={<ProjectDetailPage />} />

					{/* Prefixed Tenant Routes */}
					<Route path="org/:orgId/dashboard" element={<Dashboard />} />
					<Route path="org/:orgId/users" element={<OrgManagement />} />
					<Route path="org/:orgId/billing" element={<BillingSettings />} />

					{/* Tenant-prefixed legacy redirect */}
					<Route path="org/:orgId/account-settings" element={<Navigate to="../settings" replace />} />

					{/* Tenant-prefixed Settings — single page */}
					<Route path="org/:orgId/settings" element={<SettingsLayout />} />

					<Route path="org/:orgId/crm/leads" element={<LeadsPage />} />
					<Route path="org/:orgId/crm/deals" element={<DealsPage />} />
					<Route path="org/:orgId/crm/companies" element={<CompaniesPage />} />
					<Route path="org/:orgId/crm/tasks" element={<TasksPage />} />

					<Route path="org/:orgId/projects" element={<ProjectsListPage />} />
					<Route path="org/:orgId/projects/:publicId" element={<ProjectDetailPage />} />
				</Route>
			</Route>

			<Route path="*" element={<NotFoundPage />} />
		</Routes>
	);
};

export default AppRouter;
