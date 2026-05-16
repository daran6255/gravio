import React, { useEffect, useState, useCallback } from 'react';
import { Box, Grid } from '@mui/material';
import {
	People as PeopleIcon,
	Stars as PrimaryIcon,
	VerifiedUser as DecisionIcon,
	History as RecentIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchContacts, createContact, updateContact, deleteContact } from '../../../store/slices/contactSlice';
import { fetchCompanies } from '../../../store/slices/companySlice';
import { DataTable, type ColumnDefinition } from '../../common/table';
import ContactTableRow from './table/ContactTableRow';
import ContactFormDialog from './ContactFormDialog';
import FilterDrawer, { type FilterField } from '../../common/drawer/FilterDrawer';
import { ConfirmationDialog } from '../../common/dialogbox';
import StatCard from '../../common/stats/StatCard';
import type { Contact, ContactCreate, ContactUpdate } from '../../../models/contact';
import useToast from '../../../hooks/useToast';

interface ContactListProps {
	onAddClick?: (trigger: () => void) => void;
}

const COLUMNS: ColumnDefinition<Contact>[] = [
	{ id: 'full_name',         label: 'Name',           sortable: true,  width: 220 },
	{ id: 'company',           label: 'Company',        sortable: false, width: 180 },
	{ id: 'email',             label: 'Email',          sortable: false, width: 200 },
	{ id: 'phone',             label: 'Phone',          sortable: false, width: 150 },
	{ id: 'is_decision_maker', label: 'Decision Maker', sortable: true,  width: 140 },
	{ id: 'contact_source',    label: 'Source',         sortable: false, width: 130 },
	{ id: 'created_at',        label: 'Added On',       sortable: true,  width: 130 },
	{ id: 'actions',           label: 'Actions',        sortable: false, width: 100, align: 'right' },
];

const ContactList: React.FC<ContactListProps> = ({ onAddClick }) => {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const toast = useToast();
	const { list, total, loading } = useAppSelector((state) => state.contacts);
	const { user } = useAppSelector((state) => state.auth);
	const isAdmin = user?.role === 'admin';

	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [search, setSearch] = useState('');
	const [sortBy, setSortBy] = useState('created_at');
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
	const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
	const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
	const [formLoading, setFormLoading] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deleting, setDeleting] = useState(false);

	const handleRefresh = useCallback(() => {
		dispatch(fetchContacts({
			skip: page * rowsPerPage,
			limit: rowsPerPage,
			search: search || undefined,
			sortBy,
			sortOrder,
			...activeFilters
		}));
	}, [dispatch, page, rowsPerPage, search, sortBy, sortOrder, activeFilters]);

	useEffect(() => {
		handleRefresh();
		dispatch(fetchCompanies({ limit: 1000 }));
	}, [handleRefresh, dispatch]);

	// Bridge the add button from PageHeader to internal state
	useEffect(() => {
		if (onAddClick) {
			onAddClick(() => {
				setSelectedContact(null);
				setDialogOpen(true);
			});
		}
	}, [onAddClick]);

	const handleOpenEdit = (contact: Contact) => {
		setSelectedContact(contact);
		setDialogOpen(true);
	};

	const handleFormSubmit = async (data: ContactCreate | ContactUpdate) => {
		setFormLoading(true);
		try {
			if (selectedContact) {
				await dispatch(updateContact({ publicId: selectedContact.public_id, contact: data as ContactUpdate })).unwrap();
				toast.success('Contact updated successfully');
			} else {
				await dispatch(createContact(data as ContactCreate)).unwrap();
				toast.success('Contact created successfully');
			}
			setDialogOpen(false);
			handleRefresh();
		} catch (error: any) {
			toast.error(error || 'Failed to save contact');
		} finally {
			setFormLoading(false);
		}
	};

	const handleDeleteClick = (contact: Contact) => {
		setSelectedContact(contact);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!selectedContact) return;
		setDeleting(true);
		try {
			await dispatch(deleteContact(selectedContact.public_id)).unwrap();
			toast.success('Contact deleted successfully');
			setDeleteDialogOpen(false);
			handleRefresh();
		} catch (error: any) {
			toast.error(error || 'Failed to delete contact');
		} finally {
			setDeleting(false);
		}
	};

	const filterFields: FilterField[] = [
		{
			key: 'is_decision_maker',
			label: 'Decision Maker',
			type: 'boolean'
		},
		{
			key: 'contact_source',
			label: 'Source',
			type: 'single-select',
			options: [
				{ value: 'whatsapp', label: '💬 WhatsApp' },
				{ value: 'linkedin', label: 'LinkedIn' },
				{ value: 'website', label: 'Website' },
				{ value: 'referral', label: 'Referral' },
				{ value: 'cold_call', label: 'Cold Call' },
				{ value: 'event', label: 'Event' },
				{ value: 'other', label: 'Other' }
			]
		}
	];

	// Calculate stats from the list
	const primaryCount = list.filter(c => c.is_primary).length;
	const decisionMakerCount = list.filter(c => c.is_decision_maker).length;
	const recentCount = list.filter(c => {
		const weekAgo = new Date();
		weekAgo.setDate(weekAgo.getDate() - 7);
		return new Date(c.created_at) > weekAgo;
	}).length;

	return (
		<Box>
			<Grid container spacing={3} sx={{ mb: 4 }}>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard title="Total Contacts" value={total} icon={<PeopleIcon />} color="#007eb9" />
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard title="Primary Contacts" value={primaryCount} icon={<PrimaryIcon />} color="#1d8102" />
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard title="Decision Makers" value={decisionMakerCount} icon={<DecisionIcon />} color="#ff9900" />
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard title="Added this week" value={recentCount} icon={<RecentIcon />} color="#ec7211" />
				</Grid>
			</Grid>

			<DataTable<Contact>
				columns={COLUMNS}
				data={list}
				totalCount={total}
				loading={loading}
				page={page}
				rowsPerPage={rowsPerPage}
				onPageChange={(_, p) => setPage(p)}
				onRowsPerPageChange={(r) => { setRowsPerPage(r); setPage(0); }}
				orderBy={sortBy as keyof Contact}
				order={sortOrder}
				onSortRequest={(p) => {
					const isAsc = sortBy === p && sortOrder === 'asc';
					setSortOrder(isAsc ? 'desc' : 'asc');
					setSortBy(p as string);
					setPage(0);
				}}
				searchTerm={search}
				onSearchChange={(v) => { setSearch(v); setPage(0); }}
				searchPlaceholder="Search contacts..."
				onFilterOpen={() => setFilterDrawerOpen(true)}
				activeFilterCount={Object.keys(activeFilters).length}
				onRefresh={handleRefresh}
				renderRow={(contact) => (
					<ContactTableRow
						key={contact.public_id}
						contact={contact}
						isAdmin={isAdmin}
						onEdit={handleOpenEdit}
						onDelete={handleDeleteClick}
						onClick={(c) => navigate(`/crm/contacts/${c.public_id}`)}
					/>
				)}
			/>

			<ContactFormDialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				onSubmit={handleFormSubmit}
				contact={selectedContact}
				loading={formLoading}
			/>

			<FilterDrawer
				open={filterDrawerOpen}
				onClose={() => setFilterDrawerOpen(false)}
				fields={filterFields}
				activeFilters={activeFilters}
				onFilterChange={(k, v) => setActiveFilters(prev => ({ ...prev, [k]: v }))}
				onClearFilters={() => { setActiveFilters({}); setFilterDrawerOpen(false); setPage(0); }}
				onApplyFilters={() => { setFilterDrawerOpen(false); setPage(0); }}
			/>

			<ConfirmationDialog
				open={deleteDialogOpen}
				title="Delete Contact"
				message={`Are you sure you want to delete "${selectedContact?.first_name} ${selectedContact?.last_name}"? This action cannot be undone.`}
				confirmLabel="Delete"
				onClose={() => setDeleteDialogOpen(false)}
				onConfirm={handleDeleteConfirm}
				loading={deleting}
				severity="error"
			/>
		</Box>
	);
};

export default ContactList;
