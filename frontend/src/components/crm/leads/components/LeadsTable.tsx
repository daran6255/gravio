import React from 'react';
import { TableRow, TableCell, Typography, Stack } from '@mui/material';
import { Visibility, Edit, SwapHoriz, DeleteOutline } from '@mui/icons-material';
import { DataTable, DataTableActions, type ColumnDefinition, type TableMenuAction } from '../../../common/table';
import StatusBadge from '../../../common/badge/StatusBadge';
import type { Lead } from '../../../../models/crm/lead';

interface LeadsTableProps {
	leads: Lead[];
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
	onRowClick: (lead: Lead) => void;
	onEdit: (lead: Lead) => void;
	onConvert: (lead: Lead) => void;
	onDelete: (lead: Lead) => void;
}

const formatCurrency = (value?: number, currency?: string) => {
	if (value == null) return '—';
	return `${value.toLocaleString()} ${currency || ''}`.trim();
};

export const LeadsTable: React.FC<LeadsTableProps> = ({
	leads,
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
	onConvert,
	onDelete,
}) => {
	const columns: ColumnDefinition<Lead>[] = [
		{ id: 'title', label: 'Lead' },
		{ id: 'status', label: 'Status' },
		{ id: 'priority', label: 'Priority', hideOnMobile: true },
		{ id: 'source', label: 'Source', hideOnMobile: true },
		{ id: 'estimated_value', label: 'Value', align: 'right', hideOnMobile: true },
		{ id: 'actions', label: '', align: 'right', width: 60 },
	];

	const renderRow = (lead: Lead) => {
		const actions: TableMenuAction<Lead>[] = [
			{ label: 'View Details', icon: <Visibility fontSize="small" />, onClick: () => onRowClick(lead) },
			{ label: 'Edit', icon: <Edit fontSize="small" />, onClick: () => onEdit(lead) },
			{
				label: 'Convert to Deal',
				icon: <SwapHoriz fontSize="small" />,
				onClick: () => onConvert(lead),
				hidden: lead.status === 'converted',
				divider: true,
			},
			{
				label: 'Delete',
				icon: <DeleteOutline fontSize="small" />,
				onClick: () => onDelete(lead),
				color: 'error.main',
			},
		];

		return (
			<TableRow
				key={lead.public_id}
				hover
				onClick={() => onRowClick(lead)}
				sx={{ cursor: 'pointer' }}
			>
				<TableCell>
					<Typography variant="body2" sx={{ fontWeight: 600 }}>{lead.title}</Typography>
				</TableCell>
				<TableCell><StatusBadge label={lead.status} status={lead.status} type="lead" /></TableCell>
				<TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, textTransform: 'capitalize' }}>{lead.priority}</TableCell>
				<TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, textTransform: 'capitalize' }}>
					{lead.source ? lead.source.replace('_', ' ') : '—'}
				</TableCell>
				<TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
					{formatCurrency(lead.estimated_value, lead.currency)}
				</TableCell>
				<TableCell align="right" onClick={(e) => e.stopPropagation()}>
					<Stack direction="row" justifyContent="flex-end">
						<DataTableActions item={lead} actions={actions} tooltipTitle="Lead Actions" />
					</Stack>
				</TableCell>
			</TableRow>
		);
	};

	return (
		<DataTable<Lead>
			columns={columns}
			data={leads}
			loading={loading}
			totalCount={totalCount}
			page={page}
			rowsPerPage={rowsPerPage}
			onPageChange={onPageChange}
			onRowsPerPageChange={onRowsPerPageChange}
			searchTerm={searchTerm}
			onSearchChange={onSearchChange}
			searchPlaceholder="Search leads..."
			onRefresh={onRefresh}
			onCreateClick={onCreateClick}
			createButtonText="New Lead"
			canCreate
			renderRow={renderRow}
			emptyMessage="No leads yet. Create your first lead to get started."
		/>
	);
};

export default LeadsTable;
