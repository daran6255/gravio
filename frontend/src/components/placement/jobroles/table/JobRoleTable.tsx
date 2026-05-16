import React from 'react';
import { TextField } from '@mui/material';
import { ConfirmationDialog } from '../../../common/dialogbox';
import { useJobRoleTable } from '../hooks/useJobRoleTable';
import { getJobRoleFilterFields } from './JobRoleFilters';
import FilterDrawer from '../../../common/drawer/FilterDrawer';
import DataTable, { type ColumnDefinition } from '../../../common/table/DataTable';
import JobRoleTableRow from './JobRoleTableRow';
import type { JobRole } from '../../../../models/jobRole';

interface JobRoleTableProps {
	onEditJobRole: (jobRole: JobRole) => void;
}
const JobRoleTable: React.FC<JobRoleTableProps> = ({ onEditJobRole }) => {
	const {
		jobRoles,
		loading,
		totalCount,
		user,
		searchTerm,
		page,
		rowsPerPage,
		order,
		orderBy,
		filterDrawerOpen,
		filters,
		deleteDialogOpen,
		closeDialogOpen,
		jobRoleToDelete,
		jobRoleToClose,
		reason,
		deleteLoading,
		closeLoading,
		fetchJobRolesData,
		handleChangePage,
		handleChangeRowsPerPage,
		handleSearch,
		handleRequestSort,
		handleFilterOpen,
		handleFilterClose,
		handleFilterChange,
		applyFilters,
		clearFilters,
		handleCloseClick,
		handleCloseConfirm,
		handleCloseCancel,
		handleReopenJobRole,
		handleDeleteClick,
		handleDeleteConfirm,
		handleDeleteCancel,
		setReason
	} = useJobRoleTable();

	const activeFilterCount = (
		(filters.status ? 1 : 0) +
		filters.workplace_type.length +
		filters.job_type.length
	);

	const filterFields = getJobRoleFilterFields();

	// Define columns for the DataTable
	const columns: ColumnDefinition<JobRole>[] = [
		{ id: 'title', label: 'Job Title', sortable: true },
		{ id: 'company_id', label: 'Company & Contact' },
		{ id: 'status', label: 'Status', sortable: true },
		{ id: 'location', label: 'Location', hideOnMobile: true },
		{ id: 'no_of_vacancies', label: 'Vacancies', sortable: true, align: 'center', hideOnMobile: true },
		{ id: 'close_date', label: 'Close Date', sortable: true, hideOnMobile: true },
		{ id: 'created_by_id', label: 'Created By', hideOnMobile: true },
		{ id: 'mappings_count', label: 'Mappings', align: 'center', hideOnMobile: true },
		{ id: 'actions', label: 'Actions', align: 'right' }
	];

	// Note: We maintain specific breakpoints logic in JobRoleTableRow for hidden columns
	// to ensure exact layout fidelity on mobile/tablets.

	return (
		<>
			<DataTable<JobRole>
				columns={columns}
				data={jobRoles}
				loading={loading}
				totalCount={totalCount}
				page={page}
				rowsPerPage={rowsPerPage}
				onPageChange={handleChangePage}
				onRowsPerPageChange={(rows) => handleChangeRowsPerPage({ target: { value: rows.toString() } } as any)}
				searchTerm={searchTerm}
				onSearchChange={(v) => handleSearch({ target: { value: v } } as any)}
				searchPlaceholder="Search job roles..."
				orderBy={orderBy as keyof JobRole}
				order={order}
				onSortRequest={(property) => handleRequestSort(property as keyof JobRole)}
				onRefresh={fetchJobRolesData}
				onFilterOpen={handleFilterOpen}
				activeFilterCount={activeFilterCount}
				emptyMessage="No job roles found. Adjust your search or filters."
				renderRow={(role) => (
					<JobRoleTableRow
						key={role.public_id}
						jobRole={role}
						onEdit={onEditJobRole}
						onClose={handleCloseClick}
						onReopen={handleReopenJobRole}
						onDelete={handleDeleteClick}
						isAdmin={user?.role === 'admin' || user?.role === 'manager' || user?.role === 'placement'}
					/>
				)}
			/>

			<FilterDrawer
				open={filterDrawerOpen}
				onClose={handleFilterClose}
				fields={filterFields}
				activeFilters={filters}
				onFilterChange={handleFilterChange}
				onClearFilters={clearFilters}
				onApplyFilters={applyFilters}
			/>

			<ConfirmationDialog
				open={deleteDialogOpen}
				title="Delete Job Role"
				message={`Are you sure you want to remove the job role "${jobRoleToDelete?.title}"? This action will archive the record and it will no longer appear in active lists.`}
				onClose={handleDeleteCancel}
				onConfirm={handleDeleteConfirm}
				confirmLabel="Delete"
				loading={deleteLoading}
				severity="error"
			>
				<TextField
					fullWidth
					label="Reason for deletion"
					multiline
					rows={3}
					value={reason}
					onChange={(e) => setReason(e.target.value)}
					sx={{ mt: 2 }}
					placeholder="Explain why this job role is being deleted..."
				/>
			</ConfirmationDialog>

			<ConfirmationDialog
				open={closeDialogOpen}
				title="Close Job Role"
				message={`Are you sure you want to close the job role "${jobRoleToClose?.title}"? This will mark the position as filled or cancelled.`}
				onClose={handleCloseCancel}
				onConfirm={handleCloseConfirm}
				confirmLabel="Close Role"
				loading={closeLoading}
				severity="warning"
			>
				<TextField
					fullWidth
					label="Reason for closing"
					multiline
					rows={3}
					value={reason}
					onChange={(e) => setReason(e.target.value)}
					sx={{ mt: 2 }}
					placeholder="Explain why this job role is being closed (e.g., position filled, project cancelled)..."
				/>
			</ConfirmationDialog>
</>
	);
};

export default JobRoleTable;
