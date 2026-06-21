import React from 'react';
import { Box, Container, Button, TableRow, TableCell, Typography, LinearProgress } from '@mui/material';
import { Add as AddIcon, Block, CheckCircleOutline, CalendarToday } from '@mui/icons-material';
import type { Organization } from '../../../models/auth';
import { useOrgConsole } from '../hooks/useOrgConsole';
import { OrgStatsPanel } from './OrgStatsPanel';
import { OrgDetailDrawer } from './OrgDetailDrawer';
import { ExtendTrialDialog } from './ExtendTrialDialog';
import { CreateOrgDialog } from '../forms';
import PageHeader from '../../common/page-header';
import { DataTable, DataTableActions, type ColumnDefinition, type TableMenuAction } from '../../common/table';
import { ConfirmationDialog } from '../../common/dialogbox';
import StatusBadge from '../../common/badge/StatusBadge';

const columns: ColumnDefinition<Organization>[] = [
	{ id: 'name', label: 'Organization', sortable: false },
	{ id: 'plan_name', label: 'Plan', sortable: false },
	{ id: 'user_count', label: 'Seats / Users', sortable: false },
	{ id: 'trial_expires_at', label: 'Remaining Period', sortable: false },
	{ id: 'is_active', label: 'Status', sortable: false },
	{ id: 'actions', label: 'Actions', sortable: false, align: 'right' },
];

export const OrgConsole: React.FC = () => {
	const {
		organizations, loading, total, stats, selectedOrgUsers, selectedOrgUsersLoading,
		selectedOrgUsersError, page, setPage, rowsPerPage, setRowsPerPage, createDialogOpen,
		setCreateDialogOpen, statusDialogOpen, setStatusDialogOpen, statusAction, targetOrg,
		statusLoading, extendTrialOpen, setExtendTrialOpen, extendDays, setExtendDays,
		extendLoading, selectedOrg, handleSelectOrg, userSearchTerm, setUserSearchTerm,
		userDialogOpen, setUserDialogOpen, userActionType, targetUser, userActionLoading,
		fetchData, handleOpenExtendTrial, handleConfirmExtendTrial, handleDeactivate,
		handleReactivate, handleConfirmStatusChange, handleUserAction, handleConfirmUserAction
	} = useOrgConsole();

	const getRowActions = (org: Organization): TableMenuAction<Organization>[] => {
		const actions: TableMenuAction<Organization>[] = [
			{
				label: 'Extend Trial', icon: <CalendarToday fontSize="small" />,
				onClick: () => handleOpenExtendTrial(org), color: 'primary.main',
			}
		];
		if (org.is_active !== false) {
			actions.push({
				label: 'Deactivate', icon: <Block fontSize="small" />,
				onClick: () => handleDeactivate(org), color: 'error.main',
			});
		} else {
			actions.push({
				label: 'Reactivate', icon: <CheckCircleOutline fontSize="small" />,
				onClick: () => handleReactivate(org), color: 'success.main',
			});
		}
		return actions;
	};

	const renderSeatUtilization = (org: Organization) => {
		const userCount = org.user_count || 0;
		const userLimit = org.user_limit;

		if (userLimit === null || userLimit === undefined) {
			return (
				<Box sx={{ width: '100%', minWidth: 120 }}>
					<Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{userCount} / Unlimited</Typography>
					<LinearProgress variant="determinate" value={0} sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(0,0,0,0.05)', mt: 0.5, '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: '#6366F1' } }} />
				</Box>
			);
		}

		const percentage = Math.min((userCount / userLimit) * 100, 100);
		const color = percentage >= 85 ? '#F59E0B' : '#6366F1';

		return (
			<Box sx={{ width: '100%', minWidth: 120 }}>
				<Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
					<Typography variant="body2" sx={{ fontWeight: 600, color: percentage >= 85 ? 'warning.main' : 'text.primary' }}>{userCount} / {userLimit}</Typography>
					<Typography variant="caption" color="text.secondary">{Math.round(percentage)}%</Typography>
				</Box>
				<LinearProgress variant="determinate" value={percentage} sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(0,0,0,0.05)', '& .MuiLinearProgress-bar': { borderRadius: 3, backgroundColor: color } }} />
			</Box>
		);
	};

	const renderRemainingPeriod = (org: Organization) => {
		if (org.subscription_status !== 'trial' && org.subscription_status !== 'expired' && org.plan_id) {
			return <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>Active</Typography>;
		}
		if (!org.trial_expires_at) return <Typography variant="body2" color="text.secondary">N/A</Typography>;

		const expiry = new Date(org.trial_expires_at);
		const today = new Date();
		expiry.setHours(0, 0, 0, 0); today.setHours(0, 0, 0, 0);
		const diffTime = expiry.getTime() - today.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays < 0) return <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>Expired</Typography>;
		if (diffDays === 0) return <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>Expires today</Typography>;

		const color = diffDays < 10 ? 'error.main' : (diffDays <= 30 ? 'warning.main' : 'success.main');
		return (
			<Typography variant="body2" sx={{ fontWeight: diffDays < 10 ? 700 : 600, color }}>
				{diffDays} day{diffDays === 1 ? '' : 's'} left
			</Typography>
		);
	};

	const renderRow = (org: Organization) => {
		const planDisplayName = org.plan_name ? org.plan_name.toUpperCase() : (org.plan_id ? 'PAID' : 'FREE');
		const isSelected = selectedOrg?.public_id === org.public_id;

		return (
			<TableRow
				key={org.public_id} hover onClick={() => handleSelectOrg(org)}
				sx={{
					cursor: 'pointer', backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'inherit',
					'&:hover': { backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.12) !important' : 'inherit' },
					'&:last-child td': { borderBottom: 0 }
				}}
			>
				<TableCell>
					<Typography variant="body2" sx={{ fontWeight: 600 }}>{org.name}</Typography>
					<Typography variant="caption" color="text.secondary">{org.location || '-'}</Typography>
				</TableCell>
				<TableCell><StatusBadge label={planDisplayName} status={org.plan_name?.toLowerCase() || 'free'} /></TableCell>
				<TableCell onClick={(e) => e.stopPropagation()}>{renderSeatUtilization(org)}</TableCell>
				<TableCell>{renderRemainingPeriod(org)}</TableCell>
				<TableCell><StatusBadge label={org.is_active !== false ? 'Active' : 'Inactive'} status={org.is_active !== false ? 'active' : 'inactive'} /></TableCell>
				<TableCell align="right" onClick={(e) => e.stopPropagation()}><DataTableActions item={org} actions={getRowActions(org)} /></TableCell>
			</TableRow>
		);
	};

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 } }}>
				<PageHeader
					title="Organizations Console" subtitle="Manage global infrastructure entities and subscription tiers."
					action={
						<Button
							variant="contained" startIcon={<AddIcon />} onClick={() => setCreateDialogOpen(true)}
							sx={{ textTransform: 'none', fontWeight: 600, px: 3, py: 1, borderRadius: 3, boxShadow: 'none' }}
						>
							Create Organization
						</Button>
					}
				/>

				<OrgStatsPanel stats={stats} />

				<DataTable<Organization>
					columns={columns} data={organizations} loading={loading} totalCount={total} page={page} rowsPerPage={rowsPerPage}
					onPageChange={(_e, p) => setPage(p)} onRowsPerPageChange={(rows) => { setRowsPerPage(rows); setPage(0); }}
					searchTerm="" onRefresh={fetchData} onCreateClick={() => setCreateDialogOpen(true)}
					createButtonText="Create Organization" renderRow={renderRow} emptyMessage="No organizations yet."
				/>

				<OrgDetailDrawer
					selectedOrg={selectedOrg} onClose={() => handleSelectOrg(null)} selectedOrgUsers={selectedOrgUsers}
					selectedOrgUsersLoading={selectedOrgUsersLoading} selectedOrgUsersError={selectedOrgUsersError}
					userSearchTerm={userSearchTerm} setUserSearchTerm={setUserSearchTerm} onUserAction={handleUserAction}
					renderRemainingPeriod={renderRemainingPeriod}
				/>

				<CreateOrgDialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} onSuccess={fetchData} />

				<ExtendTrialDialog
					open={extendTrialOpen} onClose={() => { setExtendTrialOpen(false); }} onConfirm={handleConfirmExtendTrial}
					targetOrg={targetOrg} extendDays={extendDays} setExtendDays={setExtendDays} extendLoading={extendLoading}
				/>

				<ConfirmationDialog
					open={statusDialogOpen} onClose={() => { setStatusDialogOpen(false); }} onConfirm={handleConfirmStatusChange}
					title={statusAction === 'deactivate' ? 'Deactivate Organization' : 'Reactivate Organization'}
					subtitle={statusAction === 'deactivate' ? 'All members lose access immediately' : 'Restore access for all members'}
					message={statusAction === 'deactivate' ? `Deactivate ${targetOrg?.name}? No one in this organization will be able to log in until it's reactivated.` : `Reactivate ${targetOrg?.name}? Its members will be able to log in again.`}
					confirmLabel={statusAction === 'deactivate' ? 'Deactivate' : 'Reactivate'} cancelLabel="Cancel" severity={statusAction === 'deactivate' ? 'warning' : 'success'} loading={statusLoading}
				/>

				<ConfirmationDialog
					open={userDialogOpen} onClose={() => { setUserDialogOpen(false); }} onConfirm={() => handleConfirmUserAction()}
					title={userActionType === 'deactivate' ? 'Deactivate User' : (userActionType === 'reactivate' ? 'Reactivate User' : 'Delete User')}
					subtitle={userActionType === 'deactivate' ? 'Suspend user access' : (userActionType === 'reactivate' ? 'Restore user access' : 'Permanently remove user')}
					message={userActionType === 'deactivate' ? `Deactivate ${targetUser?.full_name || targetUser?.username}? They will not be able to log in to the platform.` : (userActionType === 'reactivate' ? `Reactivate ${targetUser?.full_name || targetUser?.username}? They will regain access to their account.` : `Are you sure you want to permanently delete ${targetUser?.full_name || targetUser?.username}? This action is irreversible.`)}
					confirmLabel={userActionType === 'deactivate' ? 'Deactivate' : (userActionType === 'reactivate' ? 'Reactivate' : 'Delete')}
					cancelLabel="Cancel" severity={userActionType === 'deactivate' || userActionType === 'delete' ? 'warning' : 'success'} loading={userActionLoading}
				/>
			</Container>
		</Box>
	);
};

export default OrgConsole;
