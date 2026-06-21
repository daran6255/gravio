import React, { useCallback, useEffect, useState } from 'react';
import { Box, Container, Button, TableRow, TableCell, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { Add as AddIcon, Block, CheckCircleOutline, CalendarToday } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchOrganizations, deactivateOrg, reactivateOrg } from '../../store/slices/orgAdminSlice';
import useToast from '../../hooks/useToast';
import type { Organization } from '../../models/auth';
import authService from '../../services/authService';

import PageHeader from '../../components/common/page-header';
import { DataTable, DataTableActions, type ColumnDefinition, type TableMenuAction } from '../../components/common/table';
import { ConfirmationDialog } from '../../components/common/dialogbox';
import StatusBadge from '../../components/common/badge/StatusBadge';
import CreateOrganizationDialog from './CreateOrganizationDialog';

const columns: ColumnDefinition<Organization>[] = [
	{ id: 'name', label: 'Organization', sortable: false },
	{ id: 'plan_name', label: 'Plan', sortable: false },
	{ id: 'user_count', label: 'Seats / Users', sortable: false },
	{ id: 'trial_expires_at', label: 'Remaining Period', sortable: false },
	{ id: 'is_active', label: 'Status', sortable: false },
	{ id: 'actions', label: 'Actions', sortable: false, align: 'right' },
];

const getDaysRemaining = (expiryDateStr?: string) => {
	if (!expiryDateStr) return 'N/A';
	const expiry = new Date(expiryDateStr);
	const today = new Date();
	expiry.setHours(0, 0, 0, 0);
	today.setHours(0, 0, 0, 0);
	const diffTime = expiry.getTime() - today.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	if (diffDays < 0) return 'Expired';
	if (diffDays === 0) return 'Expires today';
	return `${diffDays} day${diffDays === 1 ? '' : 's'} left`;
};

const OrganizationsConsole: React.FC = () => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const { organizations, loading, total } = useAppSelector((state) => state.orgAdmin);

	const [page, setPage] = useState(0); // MUI 0-indexed; backend is 1-indexed
	const [rowsPerPage, setRowsPerPage] = useState(20);
	const [createDialogOpen, setCreateDialogOpen] = useState(false);

	const [statusDialogOpen, setStatusDialogOpen] = useState(false);
	const [statusAction, setStatusAction] = useState<'deactivate' | 'reactivate'>('deactivate');
	const [targetOrg, setTargetOrg] = useState<Organization | null>(null);
	const [statusLoading, setStatusLoading] = useState(false);

	const [extendTrialOpen, setExtendTrialOpen] = useState(false);
	const [extendDays, setExtendDays] = useState('30');
	const [extendLoading, setExtendLoading] = useState(false);

	const handleOpenExtendTrial = (org: Organization) => {
		setTargetOrg(org);
		setExtendDays('30');
		setExtendTrialOpen(true);
	};

	const handleConfirmExtendTrial = async () => {
		if (!targetOrg) return;
		const days = parseInt(extendDays, 10);
		if (isNaN(days) || days <= 0) {
			toast.error('Please enter a valid number of days');
			return;
		}
		setExtendLoading(true);
		try {
			await authService.extendTrial(targetOrg.public_id, days);
			toast.success(`Successfully extended trial for ${targetOrg.name} by ${days} days.`);
			fetchData();
		} catch (error: any) {
			toast.error(error?.response?.data?.error?.message || error?.message || 'Failed to extend trial');
		} finally {
			setExtendLoading(false);
			setExtendTrialOpen(false);
			setTargetOrg(null);
		}
	};

	const fetchData = useCallback(() => {
		dispatch(fetchOrganizations({ page: page + 1, pageSize: rowsPerPage }));
	}, [dispatch, page, rowsPerPage]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const handleDeactivate = (org: Organization) => {
		setTargetOrg(org);
		setStatusAction('deactivate');
		setStatusDialogOpen(true);
	};

	const handleReactivate = (org: Organization) => {
		setTargetOrg(org);
		setStatusAction('reactivate');
		setStatusDialogOpen(true);
	};

	const handleConfirmStatusChange = async () => {
		if (!targetOrg) return;
		setStatusLoading(true);
		try {
			if (statusAction === 'deactivate') {
				await dispatch(deactivateOrg(targetOrg.public_id)).unwrap();
				toast.success(`${targetOrg.name} has been deactivated.`);
			} else {
				await dispatch(reactivateOrg(targetOrg.public_id)).unwrap();
				toast.success(`${targetOrg.name} has been reactivated.`);
			}
		} catch (error: any) {
			toast.error(error || `Failed to ${statusAction} organization`);
		} finally {
			setStatusLoading(false);
			setStatusDialogOpen(false);
			setTargetOrg(null);
		}
	};

	const getRowActions = (org: Organization): TableMenuAction<Organization>[] => {
		const actions: TableMenuAction<Organization>[] = [
			{
				label: 'Extend Trial',
				icon: <CalendarToday fontSize="small" />,
				onClick: () => handleOpenExtendTrial(org),
				color: 'primary.main',
			}
		];
		if (org.is_active !== false) {
			actions.push({
				label: 'Deactivate',
				icon: <Block fontSize="small" />,
				onClick: () => handleDeactivate(org),
				color: 'error.main',
			});
		} else {
			actions.push({
				label: 'Reactivate',
				icon: <CheckCircleOutline fontSize="small" />,
				onClick: () => handleReactivate(org),
				color: 'success.main',
			});
		}
		return actions;
	};

	const renderRow = (org: Organization) => {
		const usersText = org.user_limit !== null && org.user_limit !== undefined 
			? `${org.user_count || 0} / ${org.user_limit}` 
			: `${org.user_count || 0} / Unlimited`;

		const planDisplayName = org.plan_name 
			? org.plan_name.toUpperCase() 
			: (org.plan_id ? 'PAID' : 'FREE');

		return (
			<TableRow key={org.public_id} sx={{ '&:last-child td': { borderBottom: 0 } }}>
				<TableCell>
					<Typography variant="body2" sx={{ fontWeight: 500 }}>{org.name}</Typography>
					<Typography variant="caption" color="text.secondary">{org.location || '-'}</Typography>
				</TableCell>
				<TableCell>
					<StatusBadge label={planDisplayName} status={org.plan_name?.toLowerCase() || 'free'} />
				</TableCell>
				<TableCell>
					<Typography variant="body2" sx={{ fontWeight: 500 }}>{usersText}</Typography>
				</TableCell>
				<TableCell>
					<Typography variant="body2" color="text.secondary">
						{org.subscription_status === 'trial' || org.subscription_status === 'expired' || !org.plan_id
							? getDaysRemaining(org.trial_expires_at)
							: 'Active'}
					</Typography>
				</TableCell>
				<TableCell>
					<StatusBadge label={org.is_active !== false ? 'Active' : 'Inactive'} status={org.is_active !== false ? 'active' : 'inactive'} />
				</TableCell>
				<TableCell align="right">
					<DataTableActions item={org} actions={getRowActions(org)} />
				</TableCell>
			</TableRow>
		);
	};

	const headerAction = (
		<Button
			variant="contained"
			startIcon={<AddIcon />}
			onClick={() => setCreateDialogOpen(true)}
			sx={{ textTransform: 'none', fontWeight: 600, px: 3, py: 1, borderRadius: 3, boxShadow: 'none' }}
		>
			New Organization
		</Button>
	);

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 } }}>
				<PageHeader
					title="Organizations"
					subtitle="Provision and manage tenant organizations across Gravit"
					action={headerAction}
				/>

				<DataTable<Organization>
					columns={columns}
					data={organizations}
					loading={loading}
					totalCount={total}
					page={page}
					rowsPerPage={rowsPerPage}
					onPageChange={(_e, p) => setPage(p)}
					onRowsPerPageChange={(rows) => { setRowsPerPage(rows); setPage(0); }}
					searchTerm=""
					onRefresh={fetchData}
					onCreateClick={() => setCreateDialogOpen(true)}
					createButtonText="New Organization"
					renderRow={renderRow}
					emptyMessage="No organizations yet."
				/>

				<CreateOrganizationDialog
					open={createDialogOpen}
					onClose={() => setCreateDialogOpen(false)}
					onSuccess={(message) => {
						toast.success(message);
						fetchData();
					}}
				/>

				<ConfirmationDialog
					open={statusDialogOpen}
					onClose={() => { setStatusDialogOpen(false); setTargetOrg(null); }}
					onConfirm={handleConfirmStatusChange}
					title={statusAction === 'deactivate' ? 'Deactivate Organization' : 'Reactivate Organization'}
					subtitle={statusAction === 'deactivate' ? 'All members lose access immediately' : 'Restore access for all members'}
					message={
						statusAction === 'deactivate'
							? `Deactivate ${targetOrg?.name}? No one in this organization will be able to log in until it's reactivated.`
							: `Reactivate ${targetOrg?.name}? Its members will be able to log in again.`
					}
					confirmLabel={statusAction === 'deactivate' ? 'Deactivate' : 'Reactivate'}
					cancelLabel="Cancel"
					severity={statusAction === 'deactivate' ? 'warning' : 'success'}
					loading={statusLoading}
				/>

				<Dialog open={extendTrialOpen} onClose={() => { setExtendTrialOpen(false); setTargetOrg(null); }}>
					<DialogTitle>Extend Trial / Free Period</DialogTitle>
					<DialogContent sx={{ minWidth: 320, pt: 1 }}>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
							Extend the trial or free period for <strong>{targetOrg?.name}</strong>. This resets the status to active/trial.
						</Typography>
						<TextField
							autoFocus
							margin="dense"
							id="days"
							label="Number of Days"
							type="number"
							fullWidth
							variant="outlined"
							value={extendDays}
							onChange={(e) => setExtendDays(e.target.value)}
							inputProps={{ min: 1 }}
						/>
					</DialogContent>
					<DialogActions sx={{ px: 3, pb: 3 }}>
						<Button onClick={() => { setExtendTrialOpen(false); setTargetOrg(null); }} color="inherit">
							Cancel
						</Button>
						<Button onClick={handleConfirmExtendTrial} variant="contained" disabled={extendLoading}>
							{extendLoading ? 'Extending...' : 'Extend'}
						</Button>
					</DialogActions>
				</Dialog>
			</Container>
		</Box>
	);
};

export default OrganizationsConsole;
