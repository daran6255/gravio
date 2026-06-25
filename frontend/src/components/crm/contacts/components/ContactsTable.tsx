import React from 'react';
import { TableRow, TableCell, Typography, Stack } from '@mui/material';
import { Visibility, Edit, DeleteOutline } from '@mui/icons-material';
import { DataTable, DataTableActions, type ColumnDefinition, type TableMenuAction } from '../../../common/table';
import type { Contact } from '../../../../models/crm/contact';
import type { Company } from '../../../../models/crm/company';

interface ContactsTableProps {
	contacts: Contact[];
	companyOptions: Company[];
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
	onRowClick: (contact: Contact) => void;
	onEdit: (contact: Contact) => void;
	onDelete: (contact: Contact) => void;
}

export const ContactsTable: React.FC<ContactsTableProps> = ({
	contacts,
	companyOptions,
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
	const columns: ColumnDefinition<Contact>[] = [
		{ id: 'first_name', label: 'Contact' },
		{ id: 'company_id', label: 'Company', hideOnMobile: true },
		{ id: 'job_title', label: 'Title', hideOnMobile: true },
		{ id: 'email', label: 'Email', hideOnMobile: true },
		{ id: 'actions', label: '', align: 'right', width: 60 },
	];

	const renderRow = (contact: Contact) => {
		const company = companyOptions.find((c) => c.id === contact.company_id);
		const actions: TableMenuAction<Contact>[] = [
			{ label: 'View Details', icon: <Visibility fontSize="small" />, onClick: () => onRowClick(contact) },
			{ label: 'Edit', icon: <Edit fontSize="small" />, onClick: () => onEdit(contact) },
			{
				label: 'Delete',
				icon: <DeleteOutline fontSize="small" />,
				onClick: () => onDelete(contact),
				color: 'error.main',
				divider: true,
			},
		];

		return (
			<TableRow
				key={contact.public_id}
				hover
				onClick={() => onRowClick(contact)}
				sx={{ cursor: 'pointer' }}
			>
				<TableCell>
					<Typography variant="body2" sx={{ fontWeight: 600 }}>
						{contact.first_name} {contact.last_name || ''}
					</Typography>
				</TableCell>
				<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{company?.name || '—'}</TableCell>
				<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{contact.job_title || '—'}</TableCell>
				<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{contact.email || '—'}</TableCell>
				<TableCell align="right" onClick={(e) => e.stopPropagation()}>
					<Stack direction="row" justifyContent="flex-end">
						<DataTableActions item={contact} actions={actions} tooltipTitle="Contact Actions" />
					</Stack>
				</TableCell>
			</TableRow>
		);
	};

	return (
		<DataTable<Contact>
			columns={columns}
			data={contacts}
			loading={loading}
			totalCount={totalCount}
			page={page}
			rowsPerPage={rowsPerPage}
			onPageChange={onPageChange}
			onRowsPerPageChange={onRowsPerPageChange}
			searchTerm={searchTerm}
			onSearchChange={onSearchChange}
			searchPlaceholder="Search contacts..."
			onRefresh={onRefresh}
			onCreateClick={onCreateClick}
			createButtonText="New Contact"
			canCreate
			renderRow={renderRow}
			emptyMessage="No contacts yet. Add your first contact to get started."
		/>
	);
};

export default ContactsTable;
