import React, { useEffect, useState, useCallback } from 'react';
import { Box, Grid } from '@mui/material';
import {
	MonetizationOn as ValueIcon,
	TrendingUp as PipelineIcon,
	AssignmentTurnedIn as CountIcon,
	History as RecentIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchDeals, createDeal, updateDeal, deleteDeal } from '../../../store/slices/dealSlice';
import { fetchCompanies } from '../../../store/slices/companySlice';
import { fetchContacts } from '../../../store/slices/contactSlice';
import { DataTable, type ColumnDefinition } from '../../common/table';
import DealTableRow from './table/DealTableRow';
import DealFormDialog from './DealFormDialog';
import FilterDrawer, { type FilterField } from '../../common/drawer/FilterDrawer';
import { ConfirmationDialog } from '../../common/dialogbox';
import StatCard from '../../common/stats/StatCard';
import type { Deal, DealCreate, DealUpdate } from '../../../models/deal';
import useToast from '../../../hooks/useToast';

interface DealListProps {
	onAddClick?: (trigger: () => void) => void;
}

const COLUMNS: ColumnDefinition<Deal>[] = [
	{ id: 'title',               label: 'Deal Title',   sortable: true,  width: 250 },
	{ id: 'deal_stage',          label: 'Stage',        sortable: true,  width: 140 },
	{ id: 'company',             label: 'Entity',       sortable: false, width: 200 },
	{ id: 'deal_value',          label: 'Value',        sortable: true,  width: 140 },
	{ id: 'win_probability',     label: 'Probability',  sortable: true,  width: 130 },
	{ id: 'expected_close_date', label: 'Expected Close', sortable: true,  width: 140 },
	{ id: 'actions',             label: 'Actions',      sortable: false, width: 100, align: 'right' },
];

const DealList: React.FC<DealListProps> = ({ onAddClick }) => {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const toast = useToast();
	const { list, total, loading, pipeline } = useAppSelector((state) => state.deals);
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
	const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
	const [formLoading, setFormLoading] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deleting, setDeleting] = useState(false);

	const handleRefresh = useCallback(() => {
		dispatch(fetchDeals({
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
		dispatch(fetchContacts({ limit: 1000 }));
	}, [handleRefresh, dispatch]);

	useEffect(() => {
		if (onAddClick) {
			onAddClick(() => {
				setSelectedDeal(null);
				setDialogOpen(true);
			});
		}
	}, [onAddClick]);

	const handleOpenEdit = (deal: Deal) => {
		setSelectedDeal(deal);
		setDialogOpen(true);
	};

	const handleFormSubmit = async (data: DealCreate | DealUpdate) => {
		setFormLoading(true);
		try {
			if (selectedDeal) {
				await dispatch(updateDeal({ publicId: selectedDeal.public_id, deal: data as DealUpdate })).unwrap();
				toast.success('Deal updated successfully');
			} else {
				await dispatch(createDeal(data as DealCreate)).unwrap();
				toast.success('Deal created successfully');
			}
			setDialogOpen(false);
			handleRefresh();
		} catch (error: any) {
			toast.error(error || 'Failed to save deal');
		} finally {
			setFormLoading(false);
		}
	};

	const handleDeleteClick = (deal: Deal) => {
		setSelectedDeal(deal);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!selectedDeal) return;
		setDeleting(true);
		try {
			await dispatch(deleteDeal(selectedDeal.public_id)).unwrap();
			toast.success('Deal deleted successfully');
			setDeleteDialogOpen(false);
			handleRefresh();
		} catch (error: any) {
			toast.error(error || 'Failed to delete deal');
		} finally {
			setDeleting(false);
		}
	};

	const filterFields: FilterField[] = [
		{
			key: 'deal_stage',
			label: 'Stage',
			type: 'single-select',
			options: [
				{ value: 'discovery', label: 'Discovery' },
				{ value: 'qualification', label: 'Qualification' },
				{ value: 'proposal', label: 'Proposal' },
				{ value: 'negotiation', label: 'Negotiation' },
				{ value: 'closed_won', label: 'Closed Won' },
				{ value: 'closed_lost', label: 'Closed Lost' }
			]
		},
		{
			key: 'deal_type',
			label: 'Deal Type',
			type: 'single-select',
			options: [
				{ value: 'new_business', label: 'New Business' },
				{ value: 'upsell', label: 'Upsell' },
				{ value: 'renewal', label: 'Renewal' },
				{ value: 'cross_sell', label: 'Cross Sell' }
			]
		}
	];

	return (
		<Box>
			<Grid container spacing={3} sx={{ mb: 4 }}>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard title="Pipeline Value" value={`INR ${(pipeline?.total_value || 0).toLocaleString()}`} icon={<ValueIcon />} color="#007eb9" />
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard title="Active Deals" value={pipeline?.total_count || 0} icon={<PipelineIcon />} color="#1d8102" />
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard title="Closed Won" value={pipeline?.stages?.['closed_won']?.count || 0} icon={<CountIcon />} color="#ff9900" />
				</Grid>
				<Grid size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard 
						title="Added this week" 
						value={list.filter(d => {
							const weekAgo = new Date();
							weekAgo.setDate(weekAgo.getDate() - 7);
							return new Date(d.created_at) > weekAgo;
						}).length} 
						icon={<RecentIcon />} 
						color="#ec7211" 
					/>
				</Grid>
			</Grid>

			<DataTable<Deal>
				columns={COLUMNS}
				data={list}
				totalCount={total}
				loading={loading}
				page={page}
				rowsPerPage={rowsPerPage}
				onPageChange={(_, p) => setPage(p)}
				onRowsPerPageChange={(r) => { setRowsPerPage(r); setPage(0); }}
				orderBy={sortBy as keyof Deal}
				order={sortOrder}
				onSortRequest={(p) => {
					const isAsc = sortBy === p && sortOrder === 'asc';
					setSortOrder(isAsc ? 'desc' : 'asc');
					setSortBy(p as string);
					setPage(0);
				}}
				searchTerm={search}
				onSearchChange={(v) => { setSearch(v); setPage(0); }}
				searchPlaceholder="Search deals..."
				onFilterOpen={() => setFilterDrawerOpen(true)}
				activeFilterCount={Object.keys(activeFilters).length}
				onRefresh={handleRefresh}
				renderRow={(deal) => (
					<DealTableRow
						key={deal.public_id}
						deal={deal}
						isAdmin={isAdmin}
						onEdit={handleOpenEdit}
						onDelete={handleDeleteClick}
						onClick={(d) => navigate(`/crm/deals/${d.public_id}`)}
					/>
				)}
			/>

			<DealFormDialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				onSubmit={handleFormSubmit}
				deal={selectedDeal}
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
				title="Delete Deal"
				message={`Are you sure you want to delete deal "${selectedDeal?.title}"? This action cannot be undone.`}
				confirmLabel="Delete"
				onClose={() => setDeleteDialogOpen(false)}
				onConfirm={handleDeleteConfirm}
				loading={deleting}
				severity="error"
			/>
		</Box>
	);
};

export default DealList;
