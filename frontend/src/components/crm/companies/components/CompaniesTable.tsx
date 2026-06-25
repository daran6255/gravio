import React from 'react';
import { TableRow, TableCell, Typography, Stack } from '@mui/material';
import { Visibility, Edit, DeleteOutline } from '@mui/icons-material';
import { DataTable, DataTableActions, type ColumnDefinition, type TableMenuAction } from '../../../common/table';
import StatusBadge from '../../../common/badge/StatusBadge';
import type { Company } from '../../../../models/crm/company';

interface CompaniesTableProps {
	companies: Company[];
	loading: boolean;
	totalCount: number;
	page: number;
	rowsPerPage: number;
	onPageChange: (event: unknown, newPage: number) => void;
	onRowsPerPageChange: (newRowsPerPage: number) => void;
	searchTerm: string;
	onSearchChange: (value: string) => void;
	onRefresh: () => void;
	onCreateClick: () => void;
	onRowClick: (company: Company) => void;
	onEdit: (company: Company) => void;
	onDelete: (company: Company) => void;
}

export const CompaniesTable: React.FC<CompaniesTableProps> = ({
	companies,
	loading,
	totalCount,
	page,
	rowsPerPage,
	onPageChange,
	onRowsPerPageChange,
	searchTerm,
	onSearchChange,
	onRefresh,
	onCreateClick,
	onRowClick,
	onEdit,
	onDelete,
}) => {
	const columns: ColumnDefinition<Company>[] = [
		{ id: 'name', label: 'Company' },
		{ id: 'status', label: 'Status' },
		{ id: 'industry', label: 'Industry', hideOnMobile: true },
		{ id: 'website', label: 'Website', hideOnMobile: true },
		{ id: 'actions', label: '', align: 'right', width: 60 },
	];

	const renderRow = (company: Company) => {
		const actions: TableMenuAction<Company>[] = [
			{ label: 'View Details', icon: <Visibility fontSize="small" />, onClick: () => onRowClick(company) },
			{ label: 'Edit', icon: <Edit fontSize="small" />, onClick: () => onEdit(company) },
			{
				label: 'Delete',
				icon: <DeleteOutline fontSize="small" />,
				onClick: () => onDelete(company),
				color: 'error.main',
				divider: true,
			},
		];

		return (
			<TableRow
				key={company.public_id}
				hover
				onClick={() => onRowClick(company)}
				sx={{ cursor: 'pointer' }}
			>
				<TableCell>
					<Typography variant="body2" sx={{ fontWeight: 600 }}>{company.name}</Typography>
				</TableCell>
				<TableCell><StatusBadge label={company.status} status={company.status} type="company" /></TableCell>
				<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{company.industry || '—'}</TableCell>
				<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{company.website || '—'}</TableCell>
				<TableCell align="right" onClick={(e) => e.stopPropagation()}>
					<Stack direction="row" justifyContent="flex-end">
						<DataTableActions item={company} actions={actions} tooltipTitle="Company Actions" />
					</Stack>
				</TableCell>
			</TableRow>
		);
	};

	return (
		<DataTable<Company>
			columns={columns}
			data={companies}
			loading={loading}
			totalCount={totalCount}
			page={page}
			rowsPerPage={rowsPerPage}
			onPageChange={onPageChange}
			onRowsPerPageChange={onRowsPerPageChange}
			searchTerm={searchTerm}
			onSearchChange={onSearchChange}
			searchPlaceholder="Search companies..."
			onRefresh={onRefresh}
			onCreateClick={onCreateClick}
			createButtonText="New Company"
			canCreate
			renderRow={renderRow}
			emptyMessage="No companies yet. Add your first company to get started."
		/>
	);
};

export default CompaniesTable;
