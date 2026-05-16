import React from 'react';
import { DataTableHeader } from '../../common/table';
import FilterDrawer, { type FilterField } from '../../common/drawer/FilterDrawer';

interface CandidateTableHeaderProps {
	searchTerm: string;
	onSearchChange: (value: string) => void;
	onRefresh: () => void;
	loading: boolean;
	activeFilterCount: number;
	filterDrawerOpen: boolean;
	onFilterOpen: () => void;
	onFilterClose: () => void;
	filterFields: FilterField[];
	filters: any;
	onFilterChange: (key: string, value: unknown) => void;
	onClearFilters: () => void;
	onApplyFilters: () => void;
}

const CandidateTableHeader: React.FC<CandidateTableHeaderProps> = ({
	searchTerm,
	onSearchChange,
	onRefresh,
	loading,
	activeFilterCount,
	filterDrawerOpen,
	onFilterOpen,
	onFilterClose,
	filterFields,
	filters,
	onFilterChange,
	onClearFilters,
	onApplyFilters
}) => {
	return (
		<>
			<DataTableHeader
				searchTerm={searchTerm}
				onSearchChange={onSearchChange}
				searchPlaceholder="Search candidates..."
				onRefresh={onRefresh}
				loading={loading}
				onFilterOpen={onFilterOpen}
				activeFilterCount={activeFilterCount}
			/>

			<FilterDrawer
				open={filterDrawerOpen}
				onClose={onFilterClose}
				fields={filterFields}
				activeFilters={filters}
				onFilterChange={onFilterChange}
				onClearFilters={onClearFilters}
				onApplyFilters={onApplyFilters}
			/>
		</>
	);
};

export default CandidateTableHeader;
