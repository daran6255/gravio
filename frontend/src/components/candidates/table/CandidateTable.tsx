import React from 'react';
import { Snackbar, Alert, Button } from '@mui/material';
import { AssignmentInd } from '@mui/icons-material';
import { ConfirmationDialog } from '../../common/dialogbox';
import { useCandidateTable } from '../hooks/useCandidateTable';
import { getCandidateFilterFields } from './CandidateFilters';

import CandidateTableRow from './CandidateTableRow';
import AssignCandidateDialog from '../AssignCandidateDialog';
import { DataTable } from '../../common/table';
import { candidateColumns } from './CandidateTableHead';
import FilterDrawer from '../../common/drawer/FilterDrawer';

interface CandidateTableProps {
	onViewCandidate?: (candidateId: string) => void;
}

const CandidateTable: React.FC<CandidateTableProps> = ({ onViewCandidate }) => {
	const {
		candidates,
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
		filterOptions,
		deleteDialogOpen,
		candidateToDelete,
		deleteLoading,
		assignDialogOpen,
		candidateForAssignment,
		notification,
		selectedIds,
		selectedCandidates,
		fetchCandidatesData,
		handleChangePage,
		handleSearch,
		handleRequestSort,
		handleFilterOpen,
		handleFilterClose,
		handleFilterChange,
		applyFilters,
		clearFilters,
		handleDeleteClick,
		handleDeleteConfirm,
		handleDeleteCancel,
		handleAssignCancel,
		handleSelectAll,
		handleSelectOne,
		handleBulkAssignClick,
		handleCloseNotification,
		setRowsPerPage
	} = useCandidateTable();

	const activeFilterCount = (
		filters.disability_type.length +
		filters.education_level.length +
		filters.city.length +
		filters.registration_type.length
	);

	const filterFields = getCandidateFilterFields(filterOptions);

	const headerActions = selectedIds.length > 0 ? (
		<Button
			variant="contained"
			color="info"
			startIcon={<AssignmentInd />}
			onClick={handleBulkAssignClick}
			size="small"
			sx={{ fontWeight: 600, textTransform: 'none' }}
		>
			Assign {selectedIds.length} Selected
		</Button>
	) : undefined;

	return (
		<>
			<DataTable
				columns={candidateColumns}
				data={candidates}
				loading={loading}
				totalCount={totalCount}
				page={page}
				rowsPerPage={rowsPerPage}
				onPageChange={handleChangePage}
				onRowsPerPageChange={setRowsPerPage}
				searchTerm={searchTerm}
				onSearchChange={(value) => handleSearch({ target: { value } } as React.ChangeEvent<HTMLInputElement>)}
				onRefresh={fetchCandidatesData}
				orderBy={orderBy as any}
				order={order}
				onSortRequest={handleRequestSort as any}
				activeFilterCount={activeFilterCount}
				onFilterOpen={handleFilterOpen}
				numSelected={selectedIds.length}
				onSelectAllClick={handleSelectAll}
				headerActions={headerActions}
				renderRow={(candidate) => (
					<CandidateTableRow
						key={candidate.public_id}
						candidate={candidate}
						userRole={user?.role || null}
						onView={(id) => onViewCandidate?.(id)}
						onDelete={handleDeleteClick}
						selected={selectedIds.includes(candidate.public_id)}
						onSelect={handleSelectOne}
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

			{/* Dialogs & Notifications */}
			<ConfirmationDialog
				open={deleteDialogOpen}
				title="Delete Candidate"
				message={`Are you sure you want to delete "${candidateToDelete?.name}"? This action is permanent and will remove all associated data, documents, and training history.`}
				onClose={handleDeleteCancel}
				onConfirm={handleDeleteConfirm}
				confirmLabel="Delete permanently"
				loading={deleteLoading}
				severity="error"
			/>

			<AssignCandidateDialog
				open={assignDialogOpen}
				onClose={handleAssignCancel}
				onSuccess={fetchCandidatesData}
				candidates={candidateForAssignment ? [candidateForAssignment] : selectedCandidates}
			/>

			<Snackbar
				open={notification.open}
				autoHideDuration={6000}
				onClose={handleCloseNotification}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
			>
				<Alert
					onClose={handleCloseNotification}
					severity={notification.severity}
					variant="filled"
					sx={{ width: '100%' }}
				>
					{notification.message}
				</Alert>
			</Snackbar>
		</>
	);
};

export default CandidateTable;
