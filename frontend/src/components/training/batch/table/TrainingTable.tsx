import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchTrainingBatches } from '../../../../store/slices/trainingSlice';
import type { TrainingBatch } from '../../../../models/training';
import type { FilterField } from '../../../common/drawer/FilterDrawer';
import FilterDrawer from '../../../common/drawer/FilterDrawer';
import ConfirmationDialog from '../../../common/dialogbox/ConfirmationDialog';
import DataTable, { type ColumnDefinition } from '../../../common/table/DataTable';
import { getBatchFilterFields } from '../BatchFilters';

// Specialized Components
import TrainingTableRow from './TrainingTableRow';

// Hooks
import { useTrainingTable } from '../hooks/useTrainingTable';
import { useTrainingActions } from '../hooks/useTrainingActions';

interface TrainingTableProps {
	refreshKey?: number;
	onEdit: (batch: TrainingBatch) => void;
	onExtend: (batch: TrainingBatch) => void;
	onRefresh?: () => void;
}

const TrainingTable: React.FC<TrainingTableProps> = ({
	refreshKey,
	onEdit,
	onExtend,
	onRefresh
}) => {
	const dispatch = useAppDispatch();
	const { batches, loading, total: totalCount } = useAppSelector((state) => state.training);
	const user = useAppSelector((state) => state.auth.user);
	const isAdmin = user?.role === 'admin' || user?.is_superuser;
	const isManager = user?.role === 'manager';
	const canManage = isAdmin || isManager;

	// Table State Hook
	const {
		searchTerm,
		debouncedSearchTerm,
		page,
		rowsPerPage,
		order,
		orderBy,
		filterDrawerOpen,
		filters,
		setFilterDrawerOpen,
		handleSearch,
		handleChangePage,
		handleRequestSort,
		handleFilterChange,
		clearFilters,
		handleRowsPerPageSelectChange,
		setPage
	} = useTrainingTable();

	// Actions Hook for Deletion
	const { handleDeleteConfirm } = useTrainingActions();

	// Local UI State for Deletion
	const [selectedBatch, setSelectedBatch] = useState<TrainingBatch | undefined>(undefined);
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const fetchBatchesData = useCallback(() => {
		const params: any = {
			skip: page * rowsPerPage,
			limit: rowsPerPage,
			search: debouncedSearchTerm,
			sortBy: orderBy,
			sortOrder: order
		};
		if (filters.status) params.status = filters.status;
		if (filters.disability_types.length > 0) params.disability_types = filters.disability_types.join(',');

		dispatch(fetchTrainingBatches(params));
	}, [dispatch, page, rowsPerPage, debouncedSearchTerm, order, orderBy, filters]);

	useEffect(() => {
		fetchBatchesData();
	}, [fetchBatchesData, refreshKey]);

	const handleDeleteClick = useCallback((batch: TrainingBatch) => {
		setSelectedBatch(batch);
		setDeleteConfirmOpen(true);
	}, []);

	const onDeleteBatch = async () => {
		if (!selectedBatch) return;
		setIsDeleting(true);
		try {
			await handleDeleteConfirm(selectedBatch);
			fetchBatchesData();
			onRefresh?.();
		} finally {
			setIsDeleting(false);
			setDeleteConfirmOpen(false);
			setSelectedBatch(undefined);
		}
	};

	const columns: ColumnDefinition<TrainingBatch>[] = useMemo(() => [
		{ id: 'batch_name', label: 'Batch Name', sortable: true },
		{ id: 'disability_types' as any, label: 'Category', sortable: false },
		{ id: 'tag' as any, label: 'Tag', sortable: false },
		{ id: 'domain' as any, label: 'Domain', sortable: true },
		{ id: 'training_mode' as any, label: 'Mode', sortable: true },
		{ id: 'courses' as any, label: 'Curriculum & Trainers', sortable: false },
		{ id: 'duration' as any, label: 'Timeline', sortable: true },
		{ id: 'total_extension_days' as any, label: 'Modifications', sortable: false },
		{ id: 'status', label: 'Status', sortable: true },
		{ id: 'actions', label: 'Actions', sortable: false, align: 'right' }
	], []);

	const filterFields: FilterField[] = useMemo(() => getBatchFilterFields(), []);
	const activeFilterCount = Object.values(filters).filter(v =>
		Array.isArray(v) ? v.length > 0 : !!v
	).length;

	return (
		<>
			<DataTable
				columns={columns}
				data={batches}
				loading={loading}
				totalCount={totalCount}
				page={page}
				rowsPerPage={rowsPerPage}
				onPageChange={(_e, p) => handleChangePage(p)}
				onRowsPerPageChange={handleRowsPerPageSelectChange}
				searchTerm={searchTerm}
				onSearchChange={handleSearch}
				searchPlaceholder="Search batches..."
				orderBy={orderBy}
				order={order}
				onSortRequest={handleRequestSort as any}
				onRefresh={fetchBatchesData}
				onFilterOpen={() => setFilterDrawerOpen(true)}
				activeFilterCount={activeFilterCount}
				canCreate={false} // Managed by PageHeader in TrainingBatchList
				renderRow={(batch) => (
					<TrainingTableRow
						key={batch.public_id}
						batch={batch}
						isAdmin={!!isAdmin}
						canEdit={!!canManage}
						onEdit={onEdit}
						onExtend={onExtend}
						onDelete={handleDeleteClick}
					/>
				)}
			/>

			<FilterDrawer
				open={filterDrawerOpen}
				onClose={() => setFilterDrawerOpen(false)}
				fields={filterFields}
				activeFilters={filters}
				onFilterChange={handleFilterChange}
				onClearFilters={clearFilters}
				onApplyFilters={() => { setPage(0); setFilterDrawerOpen(false); }}
			/>

			<ConfirmationDialog
				open={deleteConfirmOpen}
				title="Delete Batch?"
				message={`Are you sure you want to delete "${selectedBatch?.batch_name}"? This action cannot be undone.`}
				onClose={() => setDeleteConfirmOpen(false)}
				onConfirm={onDeleteBatch}
				confirmLabel="Delete"
				severity="error"
				loading={isDeleting}
			/>
		</>
	);
};

export default TrainingTable;
