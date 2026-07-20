import React from 'react';
import { Box, Container, TableRow, TableCell, Typography, LinearProgress, useTheme, Grid, Tabs, Tab, Chip, Stack, alpha } from '@mui/material';
import { Block, CheckCircleOutline, CalendarToday, DeleteOutline } from '@mui/icons-material';
import { responsiveStyles } from '../../../../theme';
import type { Organization } from '../../../../models/auth';
import { useOrgConsole } from '../hooks/useOrgConsole';
import { OrgStatsPanel, TenantDistribution } from '../stats';
import { OrgDetailDrawer } from './OrgDetailDrawer';
import { ExtendTrialDialog } from './ExtendTrialDialog';
import { CreateOrgDialog } from '../forms';
import { EditOrgUserDialog } from '../../shared';
import PageHeader from '../../../common/page-header';
import { DataTable, DataTableActions, type ColumnDefinition, type TableMenuAction } from '../../../common/table';
import { ConfirmationDialog } from '../../../common/dialogbox';
import StatusBadge from '../../../common/badge/StatusBadge';
import { AddButton } from '../../../common/button';

const buildColumns = (accountTypeFilter: 'all' | 'organization' | 'individual'): ColumnDefinition<Organization>[] => [
	{ id: 'name', label: accountTypeFilter === 'individual' ? 'Name' : 'Organization', sortable: false },
	{ id: 'plan_name', label: 'Plan', sortable: false },
	...(accountTypeFilter === 'individual'
		? []
		: [{ id: 'user_count', label: 'Seats / Users', sortable: false } as ColumnDefinition<Organization>]),
	{ id: 'trial_expires_at', label: 'Remaining Period', sortable: false },
	{ id: 'is_active', label: 'Status', sortable: false },
	{ id: 'actions', label: 'Actions', sortable: false, align: 'right' },
];

export const OrgConsole: React.FC = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const {
		organizations, loading, total, stats, selectedOrgUsers, selectedOrgUsersLoading,
		selectedOrgUsersError, page, setPage, rowsPerPage, setRowsPerPage, createDialogOpen,
		setCreateDialogOpen, statusDialogOpen, setStatusDialogOpen, statusAction, targetOrg,
		statusLoading, extendTrialOpen, setExtendTrialOpen, extendDays, setExtendDays,
		extendLoading, selectedOrg, handleSelectOrg, userSearchTerm, setUserSearchTerm,
		userDialogOpen, setUserDialogOpen, userActionType, targetUser, userActionLoading,
		fetchData, handleOpenExtendTrial, handleConfirmExtendTrial, handleDeactivate,
		handleReactivate, handleConfirmStatusChange, handleUserAction, handleConfirmUserAction,
		searchTerm, setSearchTerm, editOrgUserOpen, setEditOrgUserOpen,
		deleteDialogOpen, setDeleteDialogOpen, deleteLoading, handleDeleteOrg, handleConfirmDeleteOrg,
		isSuperuser, accountTypeFilter, setAccountTypeFilter
	} = useOrgConsole();

	const tabConfig: { value: 'all' | 'organization' | 'individual'; label: string; count: number }[] = [
		{ value: 'all', label: 'All', count: stats?.total_organizations ?? 0 },
		{ value: 'organization', label: 'Team', count: stats?.team_organizations ?? 0 },
		{ value: 'individual', label: 'Individual', count: stats?.individual_organizations ?? 0 },
	];

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
		if (isSuperuser) {
			actions.push({
				label: 'Delete', icon: <DeleteOutline fontSize="small" />,
				onClick: () => handleDeleteOrg(org), color: 'error.main',
			});
		}
		return actions;
	};

	const renderSeatUtilization = (org: Organization) => {
		const userCount = org.user_count || 0;
		const userLimit = org.user_limit;

		if (userLimit === null || userLimit === undefined) {
			return (
				<Box sx={{ width: '100%', minWidth: 140 }}>
					<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>{userCount} / Unlimited</Typography>
					<LinearProgress variant="determinate" value={0} sx={{ height: 8, borderRadius: 4, bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', mt: 0.75 }} />
				</Box>
			);
		}

		const percentage = Math.min((userCount / userLimit) * 100, 100);
		const color = percentage >= 85 ? '#F59E0B' : '#8B7CF6';

		return (
			<Box sx={{ width: '100%', minWidth: 140 }}>
				<Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
					<Typography variant="body2" sx={{ fontWeight: 700, color: percentage >= 85 ? 'warning.main' : 'text.primary' }}>{userCount} / {userLimit}</Typography>
					<Typography variant="caption" sx={{ fontWeight: 600, color: percentage >= 85 ? 'warning.main' : 'text.secondary' }}>{Math.round(percentage)}%</Typography>
				</Box>
				<LinearProgress 
					variant="determinate" 
					value={percentage} 
					sx={{ 
						height: 8, 
						borderRadius: 4, 
						bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', 
						'& .MuiLinearProgress-bar': { 
							borderRadius: 4, 
							backgroundColor: color,
							boxShadow: percentage >= 85 ? '0 0 8px rgba(245, 158, 11, 0.4)' : '0 0 8px rgba(139, 124, 246, 0.4)'
						} 
					}} 
				/>
			</Box>
		);
	};

	const renderRemainingPeriod = (org: Organization) => {
		if (org.subscription_status !== 'trial' && org.subscription_status !== 'expired' && org.plan_id) {
			return (
				<Box display="flex" alignItems="center" gap={1}>
					<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main', boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)' }} />
					<Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>Active</Typography>
				</Box>
			);
		}
		if (!org.trial_expires_at) return <Typography variant="body2" color="text.secondary">N/A</Typography>;

		const expiry = new Date(org.trial_expires_at);
		const today = new Date();
		expiry.setHours(0, 0, 0, 0); today.setHours(0, 0, 0, 0);
		const diffTime = expiry.getTime() - today.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays < 0) {
			return (
				<Box display="flex" alignItems="center" gap={1}>
					<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main', boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)' }} />
					<Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>Expired</Typography>
				</Box>
			);
		}
		if (diffDays === 0) {
			return (
				<Box display="flex" alignItems="center" gap={1}>
					<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main', boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)' }} />
					<Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>Expires today</Typography>
				</Box>
			);
		}

		const color = diffDays < 10 ? 'error.main' : (diffDays <= 30 ? 'warning.main' : 'success.main');
		const glowColor = diffDays < 10 ? 'rgba(239, 68, 68, 0.4)' : (diffDays <= 30 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)');
		return (
			<Box display="flex" alignItems="center" gap={1}>
				<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, boxShadow: `0 0 8px ${glowColor}` }} />
				<Typography variant="body2" sx={{ fontWeight: 600, color }}>
					{diffDays} day{diffDays === 1 ? '' : 's'} left
				</Typography>
			</Box>
		);
	};

	const renderRow = (org: Organization) => {
		const planDisplayName = org.plan_name ? org.plan_name.toUpperCase() : (org.plan_id ? 'PAID' : 'FREE');
		const isSelected = selectedOrg?.public_id === org.public_id;

		return (
			<TableRow
				key={org.public_id} 
				hover 
				onClick={() => handleSelectOrg(org)}
				sx={{
					cursor: 'pointer', 
					backgroundColor: isSelected ? (isDark ? 'rgba(139, 124, 246, 0.08)' : 'rgba(139, 124, 246, 0.04)') : 'inherit',
					transition: 'all 0.2s ease',
					borderLeft: isSelected ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
					'&:hover': { 
						backgroundColor: isSelected 
							? (isDark ? 'rgba(139, 124, 246, 0.12) !important' : 'rgba(139, 124, 246, 0.08) !important') 
							: (isDark ? 'rgba(255,255,255,0.02) !important' : 'rgba(139, 124, 246, 0.02) !important'),
						transform: 'translateY(-1px)',
						boxShadow: '0 4px 12px rgba(0,0,0,0.015)'
					},
					'& td': {
						py: 2,
						px: 2.5,
						borderBottom: `1px solid ${theme.palette.divider}`
					},
					'&:last-child td': { borderBottom: 0 }
				}}
			>
				<TableCell sx={{ pl: isSelected ? 1.5 : 2 }}>
					<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>{org.name}</Typography>
					<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>{org.location || '-'}</Typography>
				</TableCell>
				<TableCell><StatusBadge label={planDisplayName} status={org.plan_name?.toLowerCase() || 'free'} /></TableCell>
				{accountTypeFilter !== 'individual' && (
					<TableCell onClick={(e) => e.stopPropagation()}>{renderSeatUtilization(org)}</TableCell>
				)}
				<TableCell>{renderRemainingPeriod(org)}</TableCell>
				<TableCell><StatusBadge label={org.is_active !== false ? 'Active' : 'Inactive'} status={org.is_active !== false ? 'active' : 'inactive'} /></TableCell>
				<TableCell align="right" onClick={(e) => e.stopPropagation()}><DataTableActions item={org} actions={getRowActions(org)} /></TableCell>
			</TableRow>
		);
	};

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth={false} sx={responsiveStyles.pageContainer}>
				<PageHeader
					title="Organizations Console"
					subtitle="Manage global infrastructure entities and subscription tiers."
					action={
						<AddButton
							onClick={() => setCreateDialogOpen(true)}
							sx={{ px: 3.5, py: 1.25, borderRadius: '12px' }}
						>
							Create Organization
						</AddButton>
					}
				/>

				<OrgStatsPanel stats={stats} />

				<Grid container spacing={responsiveStyles.statsGridSpacing}>
					{/* Left Sidebar Panel (1:3 ratio, i.e., 3 sizes out of 12) */}
					<Grid size={{ xs: 12, md: 3 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
						<TenantDistribution stats={stats} />
					</Grid>

					{/* Right Console Table (1:3 ratio, i.e., 9 sizes out of 12) */}
					<Grid size={{ xs: 12, md: 9 }}>
						<DataTable<Organization>
							columns={buildColumns(accountTypeFilter)} 
							data={organizations} 
							loading={loading} 
							totalCount={total} 
							page={page} 
							rowsPerPage={rowsPerPage}
							onPageChange={(_e, p) => setPage(p)} 
							onRowsPerPageChange={(rows) => { setRowsPerPage(rows); setPage(0); }}
							searchTerm={searchTerm}
							onSearchChange={setSearchTerm}
							searchPlaceholder="Search organizations by name or location..."
							onRefresh={fetchData}
							onCreateClick={() => setCreateDialogOpen(true)}
							createButtonText="Create Organization"
							renderRow={renderRow}
							emptyMessage={`No ${accountTypeFilter === 'all' ? '' : accountTypeFilter === 'individual' ? 'individual' : 'team'} organizations yet.`}
							headerActions={
								<Tabs
									value={accountTypeFilter}
									onChange={(_, value: 'all' | 'organization' | 'individual') => setAccountTypeFilter(value)}
									variant="scrollable"
									scrollButtons="auto"
									allowScrollButtonsMobile
									sx={{ minHeight: 36, maxWidth: '100%', '& .MuiTab-root': { minHeight: 36, py: 0.5, textTransform: 'none', fontWeight: 600 } }}
								>
									{tabConfig.map((tab) => (
										<Tab
											key={tab.value}
											value={tab.value}
											label={
												<Stack direction="row" spacing={0.75} alignItems="center">
													<span>{tab.label}</span>
													<Chip
														label={tab.count}
														size="small"
														sx={{
															height: 18,
															minWidth: 18,
															fontSize: '0.7rem',
															fontWeight: 700,
															bgcolor: accountTypeFilter === tab.value ? 'primary.main' : alpha(theme.palette.text.primary, 0.08),
															color: accountTypeFilter === tab.value ? 'primary.contrastText' : 'text.secondary'
														}}
													/>
												</Stack>
											}
										/>
									))}
								</Tabs>
							}
						/>
					</Grid>
				</Grid>

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
					open={deleteDialogOpen} onClose={() => { setDeleteDialogOpen(false); }} onConfirm={handleConfirmDeleteOrg}
					title="Delete Organization"
					subtitle="Permanently delete organization and all its data"
					message={`Are you sure you want to permanently delete ${targetOrg?.name}? This action will delete all user accounts, usage records, and configuration associated with this organization. THIS ACTION IS IRREVERSIBLE.`}
					confirmLabel="Delete" cancelLabel="Cancel" severity="error" loading={deleteLoading}
				/>

				<ConfirmationDialog
					open={userDialogOpen} onClose={() => { setUserDialogOpen(false); }} onConfirm={() => handleConfirmUserAction()}
					title={userActionType === 'deactivate' ? 'Deactivate User' : (userActionType === 'reactivate' ? 'Reactivate User' : 'Delete User')}
					subtitle={userActionType === 'deactivate' ? 'Suspend user access' : (userActionType === 'reactivate' ? 'Restore user access' : 'Permanently remove user')}
					message={userActionType === 'deactivate' ? `Deactivate ${targetUser?.full_name || targetUser?.username}? They will not be able to log in to the platform.` : (userActionType === 'reactivate' ? `Reactivate ${targetUser?.full_name || targetUser?.username}? They will regain access to their account.` : `Are you sure you want to permanently delete ${targetUser?.full_name || targetUser?.username}? This action is irreversible.`)}
					confirmLabel={userActionType === 'deactivate' ? 'Deactivate' : (userActionType === 'reactivate' ? 'Reactivate' : 'Delete')}
					cancelLabel="Cancel" severity={userActionType === 'deactivate' || userActionType === 'delete' ? 'warning' : 'success'} loading={userActionLoading}
				/>

				<EditOrgUserDialog
					open={editOrgUserOpen}
					user={targetUser}
					onClose={() => setEditOrgUserOpen(false)}
					onSuccess={() => {
						fetchData();
						if (selectedOrg) {
							handleSelectOrg(selectedOrg);
						}
					}}
				/>
			</Container>
		</Box>
	);
};

export default OrgConsole;
