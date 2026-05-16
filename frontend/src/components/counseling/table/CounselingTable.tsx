import React, { useMemo } from 'react';
import { DataTable, type ColumnDefinition } from '../../common/table';
import FilterDrawer from '../../common/drawer/FilterDrawer';
import { useCounselingTable } from '../hooks/useCounselingTable';
import { getCounselingFilterFields } from '../CounselingFilters';
import CounselingTableRow from './CounselingTableRow';
import type { CandidateListItem } from '../../../models/candidate';

interface CounselingTableProps {
	type: 'not_counseled' | 'pending' | 'selected' | 'rejected' | 'counseled';
	onAction: (action: 'counsel' | 'edit', candidate: CandidateListItem) => void;
	refreshKey?: number;
}

const CounselingTable: React.FC<CounselingTableProps> = ({ type, onAction, refreshKey }) => {
	const {
		candidates,
		loading,
		totalCount,
		searchTerm,
		page,
		rowsPerPage,
		order,
		orderBy,
		filterDrawerOpen,
		filters,
		filterOptions,
		fetchCandidatesData,
		handleChangePage,
		handleSearch,
		handleRequestSort,
		handleFilterOpen,
		handleFilterClose,
		handleFilterChange,
		applyFilters,
		clearFilters,
		handleRowsPerPageSelectChange
	} = useCounselingTable(type, refreshKey);

	const filterFields = useMemo(() => getCounselingFilterFields(type, filterOptions), [type, filterOptions]);

	const activeFilterCount = useMemo(() => filterFields.reduce((count, field) => {
		const value = filters[field.key];
		if (field.type === 'multi-select') {
			return count + (Array.isArray(value) ? value.length : 0);
		} else {
			return count + (value ? 1 : 0);
		}
	}, 0), [filterFields, filters]);

	// Define columns for DataTable
	const columns: ColumnDefinition<CandidateListItem>[] = useMemo(() => {
		const cols: ColumnDefinition<CandidateListItem>[] = [
			{ id: 'name', label: 'Name', sortable: true },
			{ id: 'phone', label: 'Phone', hideOnMobile: true },
			{ id: 'city', label: 'Location', sortable: true, hideOnMobile: true },
			{ id: 'education_level', label: 'Education', sortable: true, hideOnMobile: true },
			{ id: 'disability_type', label: 'Disability', sortable: true, hideOnMobile: true },
		];

		if (type !== 'not_counseled') {
			cols.push({ id: 'counseling_status', label: 'Status', sortable: true });
			cols.push({ id: 'assigned_to' as any, label: 'Assigned to', hideOnMobile: true });
			cols.push({ id: 'counselor_name' as any, label: 'Counselor', sortable: true, hideOnMobile: true });
			cols.push({ id: 'counseling_date' as any, label: 'Date', sortable: true, hideOnMobile: true });
		}

		cols.push({ id: 'actions', label: 'Actions', align: 'right' });
		return cols;
	}, [type]);

	return (
		<>
			<DataTable
				columns={columns}
				data={candidates}
				loading={loading}
				totalCount={totalCount}
				page={page}
				rowsPerPage={rowsPerPage}
				onPageChange={handleChangePage}
				onRowsPerPageChange={handleRowsPerPageSelectChange}
				searchTerm={searchTerm}
				onSearchChange={(val) => handleSearch({ target: { value: val } } as React.ChangeEvent<HTMLInputElement>)}
				onRefresh={fetchCandidatesData}
				orderBy={orderBy as any}
				order={order}
				onSortRequest={handleRequestSort as any}
				activeFilterCount={activeFilterCount}
				onFilterOpen={handleFilterOpen}
				renderRow={(candidate) => (
					<CounselingTableRow
						key={candidate.public_id}
						candidate={candidate}
						type={type}
						onAction={onAction}
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
		</>
	);
};

export default React.memo(CounselingTable);
