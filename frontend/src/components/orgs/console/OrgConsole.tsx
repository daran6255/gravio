import React from 'react';
import { Box, Container, Button, TableRow, TableCell, Typography, LinearProgress, useTheme, Grid } from '@mui/material';
import { Add as AddIcon, Block, CheckCircleOutline, CalendarToday } from '@mui/icons-material';
import type { Organization } from '../../../models/auth';
import { useOrgConsole } from '../hooks/useOrgConsole';
import { OrgStatsPanel } from './OrgStatsPanel';
import { TenantDistribution } from './TenantDistribution';
// import { AdminQuickActions } from './AdminQuickActions';
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
		searchTerm, setSearchTerm
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
				<TableCell onClick={(e) => e.stopPropagation()}>{renderSeatUtilization(org)}</TableCell>
				<TableCell>{renderRemainingPeriod(org)}</TableCell>
				<TableCell><StatusBadge label={org.is_active !== false ? 'Active' : 'Inactive'} status={org.is_active !== false ? 'active' : 'inactive'} /></TableCell>
				<TableCell align="right" onClick={(e) => e.stopPropagation()}><DataTableActions item={org} actions={getRowActions(org)} /></TableCell>
			</TableRow>
		);
	};

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
			{/* Subtle Aurora Gradient Accents in the background */}
			<Box
				sx={{
					position: 'absolute',
					top: '5%',
					right: '-5%',
					width: '45vw',
					height: '45vw',
					borderRadius: '50%',
					background: 'radial-gradient(circle, rgba(139, 124, 246, 0.08) 0%, rgba(78, 168, 255, 0.02) 60%, rgba(0,0,0,0) 100%)',
					filter: 'blur(70px)',
					zIndex: 0,
					pointerEvents: 'none'
				}}
			/>
			<Box
				sx={{
					position: 'absolute',
					bottom: '10%',
					left: '-10%',
					width: '35vw',
					height: '35vw',
					borderRadius: '50%',
					background: 'radial-gradient(circle, rgba(78, 168, 255, 0.06) 0%, rgba(16, 185, 129, 0.02) 60%, rgba(0,0,0,0) 100%)',
					filter: 'blur(60px)',
					zIndex: 0,
					pointerEvents: 'none'
				}}
			/>

			<Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 }, position: 'relative', zIndex: 1 }}>
				<PageHeader
					title="Organizations Console" 
					subtitle="Manage global infrastructure entities and subscription tiers."
					action={
						<Button
							variant="contained" 
							startIcon={<AddIcon />} 
							onClick={() => setCreateDialogOpen(true)}
							sx={{ 
								textTransform: 'none', 
								fontWeight: 700, 
								px: 3.5, 
								py: 1.25, 
								borderRadius: '12px',
								background: 'linear-gradient(135deg, #8B7CF6 0%, #6052d9 100%)',
								boxShadow: '0 4px 14px 0 rgba(139, 124, 246, 0.4)',
								transition: 'all 0.2s ease',
								'&:hover': {
									background: 'linear-gradient(135deg, #9C8FFF 0%, #7062E9 100%)',
									boxShadow: '0 6px 20px 0 rgba(139, 124, 246, 0.6)',
									transform: 'translateY(-1px)'
								}
							}}
						>
							Create Organization
						</Button>
					}
				/>

				<OrgStatsPanel stats={stats} />

				<Grid container spacing={3}>
					{/* Left Sidebar Panel (1:3 ratio, i.e., 3 sizes out of 12) */}
					<Grid size={{ xs: 12, md: 3 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
						<TenantDistribution stats={stats} />
						{/* <AdminQuickActions onCreateClick={() => setCreateDialogOpen(true)} /> */}
					</Grid>

					{/* Right Console Table (1:3 ratio, i.e., 9 sizes out of 12) */}
					<Grid size={{ xs: 12, md: 9 }}>
						<DataTable<Organization>
							columns={columns} 
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
							emptyMessage="No organizations yet."
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
