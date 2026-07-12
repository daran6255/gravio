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
import TimesheetPage from '../pages/timesheets/TimesheetPage';
// HR Admin Pages
import WorkforcePage from '../pages/hr/admin/WorkforcePage';
import ChecklistPage from '../pages/hr/admin/ChecklistPage';
import DocumentVaultPage from '../pages/hr/admin/DocumentVaultPage';

// HR User Pages
import LeaveDashboardPage from '../pages/hr/user/LeaveDashboardPage';

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

					<Route path="timesheets" element={<TimesheetPage />} />

					<Route path="crm/leads" element={<LeadsPage />} />
					<Route path="crm/deals" element={<DealsPage />} />
					<Route path="crm/companies" element={<CompaniesPage />} />
					<Route path="crm/tasks" element={<TasksPage />} />

					{/* Project Management */}
					<Route path="projects" element={<ProjectsListPage />} />
					<Route path="projects/:publicId" element={<ProjectDetailPage />} />

					{/* HR Module */}
					{/* Admin Flow */}
					<Route path="hr/admin/workforce" element={<WorkforcePage />} />
					<Route path="hr/admin/onboarding" element={<ChecklistPage />} />
					<Route path="hr/admin/documents" element={<DocumentVaultPage />} />

					{/* User Flow */}
					<Route path="hr/user/profile" element={<Navigate to="/settings" replace />} />
					<Route path="hr/user/leaves" element={<LeaveDashboardPage />} />

					{/* Legacy/Redirect routes */}
					<Route path="hr/workforce" element={<Navigate to="/hr/admin/workforce" replace />} />
					<Route path="hr/employees" element={<Navigate to="/hr/admin/workforce" replace />} />
					<Route path="hr/departments" element={<Navigate to="/hr/admin/workforce" replace />} />
					<Route path="hr/designations" element={<Navigate to="/hr/admin/workforce" replace />} />
					<Route path="hr/leaves" element={<Navigate to="/hr/user/leaves" replace />} />
					<Route path="hr/onboarding" element={<Navigate to="/hr/admin/onboarding" replace />} />
					<Route path="hr/documents" element={<Navigate to="/hr/admin/documents" replace />} />
					<Route path="hr" element={<Navigate to="/hr/admin/workforce" replace />} />

					{/* Prefixed Tenant Routes */}
					<Route path="org/:orgId/dashboard" element={<Dashboard />} />
					<Route path="org/:orgId/users" element={<OrgManagement />} />
					<Route path="org/:orgId/billing" element={<BillingSettings />} />

					{/* Tenant-prefixed legacy redirect */}
					<Route path="org/:orgId/account-settings" element={<Navigate to="../settings" replace />} />

					{/* Tenant-prefixed Settings — single page */}
					<Route path="org/:orgId/settings" element={<SettingsLayout />} />

					<Route path="org/:orgId/timesheets" element={<TimesheetPage />} />

					<Route path="org/:orgId/crm/leads" element={<LeadsPage />} />
					<Route path="org/:orgId/crm/deals" element={<DealsPage />} />
					<Route path="org/:orgId/crm/companies" element={<CompaniesPage />} />
					<Route path="org/:orgId/crm/tasks" element={<TasksPage />} />

					<Route path="org/:orgId/projects" element={<ProjectsListPage />} />
					<Route path="org/:orgId/projects/:publicId" element={<ProjectDetailPage />} />

					{/* Tenant-prefixed HR Module */}
					{/* Admin Flow */}
					<Route path="org/:orgId/hr/admin/workforce" element={<WorkforcePage />} />
					<Route path="org/:orgId/hr/admin/onboarding" element={<ChecklistPage />} />
					<Route path="org/:orgId/hr/admin/documents" element={<DocumentVaultPage />} />

					{/* User Flow */}
					<Route path="org/:orgId/hr/user/profile" element={<Navigate to="../settings" replace />} />
					<Route path="org/:orgId/hr/user/leaves" element={<LeaveDashboardPage />} />

					{/* Tenant-prefixed Legacy/Redirect routes */}
					<Route path="org/:orgId/hr/workforce" element={<Navigate to="../admin/workforce" replace />} />
					<Route path="org/:orgId/hr/employees" element={<Navigate to="../admin/workforce" replace />} />
					<Route path="org/:orgId/hr/departments" element={<Navigate to="../admin/workforce" replace />} />
					<Route path="org/:orgId/hr/designations" element={<Navigate to="../admin/workforce" replace />} />
					<Route path="org/:orgId/hr/leaves" element={<Navigate to="../user/leaves" replace />} />
					<Route path="org/:orgId/hr/onboarding" element={<Navigate to="../admin/onboarding" replace />} />
					<Route path="org/:orgId/hr/documents" element={<Navigate to="../admin/documents" replace />} />
				</Route>
			</Route>

			<Route path="*" element={<NotFoundPage />} />
		</Routes>
	);
};

export default AppRouter;
