import React, { useCallback, useEffect, useState } from 'react';
import { Box, Container, Button, TableRow, TableCell, Typography } from '@mui/material';
import { Add as AddIcon, Block, CheckCircleOutline } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchOrganizations, deactivateOrg, reactivateOrg } from '../../store/slices/orgAdminSlice';
import useToast from '../../hooks/useToast';
import type { Organization } from '../../models/auth';

import PageHeader from '../../components/common/page-header';
import { DataTable, DataTableActions, type ColumnDefinition, type TableMenuAction } from '../../components/common/table';
import { ConfirmationDialog } from '../../components/common/dialogbox';
import StatusBadge from '../../components/common/badge/StatusBadge';
import CreateOrganizationDialog from './CreateOrganizationDialog';

const columns: ColumnDefinition<Organization>[] = [
	{ id: 'name', label: 'Organization', sortable: false },
	{ id: 'location', label: 'Location', sortable: false },
	{ id: 'subscription_status', label: 'Subscription', sortable: false },
	{ id: 'trial_expires_at', label: 'Trial Expires', sortable: false },
	{ id: 'is_active', label: 'Status', sortable: false },
	{ id: 'actions', label: 'Actions', sortable: false, align: 'right' },
];

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

	const getRowActions = (org: Organization): TableMenuAction<Organization>[] =>
		org.is_active !== false
			? [{ label: 'Deactivate', icon: <Block fontSize="small" />, onClick: () => handleDeactivate(org), color: 'error.main' }]
			: [{ label: 'Reactivate', icon: <CheckCircleOutline fontSize="small" />, onClick: () => handleReactivate(org), color: 'success.main' }];

	const renderRow = (org: Organization) => (
		<TableRow key={org.public_id} sx={{ '&:last-child td': { borderBottom: 0 } }}>
			<TableCell>
				<Typography variant="body2" sx={{ fontWeight: 500 }}>{org.name}</Typography>
			</TableCell>
			<TableCell>
				<Typography variant="body2" color="text.secondary">{org.location || '-'}</Typography>
			</TableCell>
			<TableCell>
				<StatusBadge label={org.subscription_status} status={org.subscription_status} />
			</TableCell>
			<TableCell>
				<Typography variant="body2" color="text.secondary">
					{org.trial_expires_at ? new Date(org.trial_expires_at).toLocaleDateString() : '-'}
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
			</Container>
		</Box>
	);
};

export default OrganizationsConsole;
