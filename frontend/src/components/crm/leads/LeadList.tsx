import React, { useEffect, useState, useCallback } from 'react';
import { Box, Grid } from '@mui/material';
import {
	Stars as LeadIcon,
	TrendingUp as ConversionIcon,
	Assessment as ScoreIcon,
	History as RecentIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchLeads, createLead, updateLead, deleteLead } from '../../../store/slices/leadSlice';
import { fetchCompanies } from '../../../store/slices/companySlice';
import { fetchContacts } from '../../../store/slices/contactSlice';
import { DataTable, type ColumnDefinition } from '../../common/table';
import LeadTableRow from './table/LeadTableRow';
import LeadFormDialog from './LeadFormDialog';
import FilterDrawer, { type FilterField } from '../../common/drawer/FilterDrawer';
import { ConfirmationDialog } from '../../common/dialogbox';
import StatCard from '../../common/stats/StatCard';
import type { Lead, LeadCreate, LeadUpdate } from '../../../models/lead';
import useToast from '../../../hooks/useToast';

interface LeadListProps {
	onAddClick?: (trigger: () => void) => void;
}

const COLUMNS: ColumnDefinition<Lead>[] = [
	{ id: 'title', label: 'Lead Title', sortable: true, width: 250 },
	{ id: 'lead_status', label: 'Status', sortable: true, width: 130 },
	{ id: 'company', label: 'Entity', sortable: false, width: 200 },
	{ id: 'estimated_value', label: 'Value', sortable: true, width: 140 },
	{ id: 'lead_source', label: 'Source', sortable: true, width: 130 },
	{ id: 'created_at', label: 'Added On', sortable: true, width: 130 },
	{ id: 'actions', label: 'Actions', sortable: false, width: 100, align: 'right' },
];

const LeadList: React.FC<LeadListProps> = ({ onAddClick }) => {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const toast = useToast();
	const { list, total, loading, stats } = useAppSelector((state) => state.leads);
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
	const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
	const [formLoading, setFormLoading] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deleting, setDeleting] = useState(false);

	const handleRefresh = useCallback(() => {
		dispatch(fetchLeads({
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
		// Fetch companies and contacts for the form
		dispatch(fetchCompanies({ limit: 1000 }));
		dispatch(fetchContacts({ limit: 1000 }));
	}, [handleRefresh, dispatch]);

	useEffect(() => {
		if (onAddClick) {
			onAddClick(() => {
				setSelectedLead(null);
				setDialogOpen(true);
			});
		}
	}, [onAddClick]);

	const handleOpenEdit = (lead: Lead) => {
		setSelectedLead(lead);
		setDialogOpen(true);
	};

	const handleFormSubmit = async (data: LeadCreate | LeadUpdate) => {
		setFormLoading(true);
		try {
			if (selectedLead) {
				await dispatch(updateLead({ publicId: selectedLead.public_id, lead: data as LeadUpdate })).unwrap();
				toast.success('Lead updated successfully');
			} else {
				await dispatch(createLead(data as LeadCreate)).unwrap();
				toast.success('Lead created successfully');
			}
			setDialogOpen(false);
			handleRefresh();
		} catch (error: any) {
			toast.error(error || 'Failed to save lead');
		} finally {
			setFormLoading(false);
		}
	};

	const handleDeleteClick = (lead: Lead) => {
		setSelectedLead(lead);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!selectedLead) return;
		setDeleting(true);
		try {
			await dispatch(deleteLead(selectedLead.public_id)).unwrap();
			toast.success('Lead deleted successfully');
			setDeleteDialogOpen(false);
			handleRefresh();
		} catch (error: any) {
			toast.error(error || 'Failed to delete lead');
		} finally {
			setDeleting(false);
		}
	};

	const filterFields: FilterField[] = [
		{
			key: 'lead_status',
			label: 'Status',
			type: 'single-select',
			options: [
				{ value: 'new', label: 'New' },
				{ value: 'contacted', label: 'Contacted' },
				{ value: 'qualified', label: 'Qualified' },
				{ value: 'unqualified', label: 'Unqualified' },
				{ value: 'lost', label: 'Lost' }
			]
		},
		{
			key: 'lead_source',
			label: 'Source',
			type: 'single-select',
			options: [
				{ value: 'website', label: 'Website' },
				{ value: 'referral', label: 'Referral' },
				{ value: 'campaign', label: 'Campaign' },
				{ value: 'event', label: 'Event' },
				{ value: 'cold_call', label: 'Cold Call' },
				{ value: 'social_media', label: 'Social Media' },
				{ value: 'partner', label: 'Partner' }
			]
		}
	];

	return (
		<Box>
			<Grid container spacing={3} sx={{ mb: 4 }}>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard title="Total Leads" value={total} icon={<LeadIcon />} color="#007eb9" />
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard title="Conversion Rate" value={`${stats?.conversion_rate || 0}%`} icon={<ConversionIcon />} color="#1d8102" />
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard title="Avg Lead Score" value={stats?.average_score?.toFixed(1) || 0} icon={<ScoreIcon />} color="#ff9900" />
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard title="Leads this week" value={stats?.this_week || 0} icon={<RecentIcon />} color="#ec7211" />
				</Grid>
			</Grid>

			<DataTable<Lead>
				columns={COLUMNS}
				data={list}
				totalCount={total}
				loading={loading}
				page={page}
				rowsPerPage={rowsPerPage}
				onPageChange={(_, p) => setPage(p)}
				onRowsPerPageChange={(r) => { setRowsPerPage(r); setPage(0); }}
				orderBy={sortBy as keyof Lead}
				order={sortOrder}
				onSortRequest={(p) => {
					const isAsc = sortBy === p && sortOrder === 'asc';
					setSortOrder(isAsc ? 'desc' : 'asc');
					setSortBy(p as string);
					setPage(0);
				}}
				searchTerm={search}
				onSearchChange={(v) => { setSearch(v); setPage(0); }}
				searchPlaceholder="Search leads..."
				onFilterOpen={() => setFilterDrawerOpen(true)}
				activeFilterCount={Object.keys(activeFilters).length}
				onRefresh={handleRefresh}
				renderRow={(lead) => (
					<LeadTableRow
						key={lead.public_id}
						lead={lead}
						isAdmin={isAdmin}
						onEdit={handleOpenEdit}
						onDelete={handleDeleteClick}
						onClick={(l) => navigate(`/crm/leads/${l.public_id}`)}
					/>
				)}
			/>

			<LeadFormDialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				onSubmit={handleFormSubmit}
				lead={selectedLead}
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
				title="Delete Lead"
				message={`Are you sure you want to delete lead "${selectedLead?.title}"? This action cannot be undone.`}
				confirmLabel="Delete"
				onClose={() => setDeleteDialogOpen(false)}
				onConfirm={handleDeleteConfirm}
				loading={deleting}
				severity="error"
			/>
		</Box>
	);
};

export default LeadList;
