import React, { useMemo } from 'react';
import { DataTable } from '../../common/table';
import FilterDrawer from '../../common/drawer/FilterDrawer';
import type { CandidateListItem } from '../../../models/candidate';
import { useScreeningTable } from '../hooks/useScreeningTable';
import { getScreeningFilterFields } from '../ScreeningFilters';
import { getScreeningColumns } from './ScreeningTableHead';
import ScreeningTableRow from './ScreeningTableRow';

interface ScreeningTableProps {
	type: 'unscreened' | 'screened';
	status?: string;
	onAction: (action: 'edit' | 'screen', candidate: CandidateListItem) => void;
	refreshTrigger?: number;
}

const ScreeningTable: React.FC<ScreeningTableProps> = ({ type, status, onAction, refreshTrigger }) => {
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
		setFilterDrawerOpen,
		handleSearch,
		handleChangePage,
		handleRequestSort,
		handleFilterChange,
		handleClearFilters,
		handleApplyFilters,
		setRowsPerPage,
		fetchCandidatesData
	} = useScreeningTable({ type, status, refreshTrigger });

	const filterFields = useMemo(() => getScreeningFilterFields(type, status, filterOptions), [type, status, filterOptions]);

	const activeFilterCount = filterFields.reduce((count, field) => {
		const value = filters[field.key];
		if (field.type === 'multi-select') {
			return count + (Array.isArray(value) ? value.length : 0);
		} else {
			return count + (value ? 1 : 0);
		}
	}, 0);

	const columns = useMemo(() => getScreeningColumns(type), [type]);

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
				onRowsPerPageChange={setRowsPerPage}
				searchTerm={searchTerm}
				onSearchChange={(value) => handleSearch({ target: { value } } as React.ChangeEvent<HTMLInputElement>)}
				onRefresh={fetchCandidatesData}
				orderBy={orderBy as any}
				order={order}
				onSortRequest={handleRequestSort as any}
				activeFilterCount={activeFilterCount}
				onFilterOpen={() => setFilterDrawerOpen(true)}
				renderRow={(candidate) => (
					<ScreeningTableRow
						key={candidate.public_id}
						candidate={candidate}
						type={type}
						onAction={onAction}
					/>
				)}
			/>

			<FilterDrawer
				open={filterDrawerOpen}
				onClose={() => setFilterDrawerOpen(false)}
				fields={filterFields}
				activeFilters={filters}
				onFilterChange={handleFilterChange}
				onClearFilters={handleClearFilters}
				onApplyFilters={handleApplyFilters}
			/>
		</>
	);
};

export default ScreeningTable;
