import React from 'react';
import { DataTable } from '../../../common/table';
import type { ColumnDefinition } from '../../../common/table';
import CompanyTableRow from './CompanyTableRow';
import type { Company } from '../../../../models/company';

interface CompanyTableProps {
	// Data
	list: Company[];
	total: number;
	loading: boolean;
	// Pagination
	page: number;
	rowsPerPage: number;
	onPageChange: (event: unknown, newPage: number) => void;
	onRowsPerPageChange: (newRowsPerPage: number) => void;
	// Sorting
	sortBy: string;
	sortOrder: 'asc' | 'desc';
	onSort: (property: keyof Company) => void;
	// Table header toolbar
	search: string;
	onSearchChange: (value: string) => void;
	onFilterOpen: () => void;
	activeFilterCount: number;
	onRefresh: () => void;
	// Row actions
	isAdmin: boolean;
	onRowClick: (company: Company) => void;
	onEdit: (company: Company) => void;
	onDelete: (company: Company) => void;
}

const COLUMNS: ColumnDefinition<Company>[] = [
	{ id: 'name',       label: 'Company Name', sortable: true,  width: 220 },
	{ id: 'status',     label: 'Status',       sortable: true,  width: 130 },
	{ id: 'industry',   label: 'Industry',     sortable: true,  width: 160 },
	{ id: 'website',    label: 'Website',      sortable: false, width: 200, hideOnMobile: true },
	{ id: 'email',      label: 'Email',        sortable: false, width: 210, hideOnMobile: true },
	{ id: 'created_at', label: 'Created On',   sortable: true,  width: 140, hideOnMobile: true },
	{ id: 'actions',    label: 'Actions',      sortable: false, width: 100, align: 'right' },
];

const CompanyTable: React.FC<CompanyTableProps> = ({
	list,
	total,
	loading,
	page,
	rowsPerPage,
	onPageChange,
	onRowsPerPageChange,
	sortBy,
	sortOrder,
	onSort,
	search,
	onSearchChange,
	onFilterOpen,
	activeFilterCount,
	onRefresh,
	isAdmin,
	onRowClick,
	onEdit,
	onDelete,
}) => {
	return (
		<DataTable<Company>
			columns={COLUMNS}
			data={list}
			totalCount={total}
			loading={loading}
			page={page}
			rowsPerPage={rowsPerPage}
			onPageChange={onPageChange}
			onRowsPerPageChange={onRowsPerPageChange}
			orderBy={sortBy as keyof Company}
			order={sortOrder}
			onSortRequest={onSort}
			searchTerm={search}
			onSearchChange={onSearchChange}
			searchPlaceholder="Search companies..."
			onFilterOpen={onFilterOpen}
			activeFilterCount={activeFilterCount}
			onRefresh={onRefresh}
			emptyMessage="No companies found. Start by adding your first company."
			renderRow={(company) => (
				<CompanyTableRow
					key={company.public_id}
					company={company}
					isAdmin={isAdmin}
					onEdit={onEdit}
					onDelete={onDelete}
					onClick={onRowClick}
				/>
			)}
		/>
	);
};

export default CompanyTable;
