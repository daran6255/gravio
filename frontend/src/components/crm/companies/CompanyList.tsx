import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchCompanies, fetchCompanyStats, createCompany, updateCompany, deleteCompany } from '../../../store/slices/companySlice';

import CompanyFormDialog from './form/CompanyFormDialog';
import { ConfirmationDialog } from '../../common/dialogbox';
import FilterDrawer, { type FilterField } from '../../common/drawer/FilterDrawer';
import CompanyStats from './stats/CompanyStats';
import CompanyTable from './table/CompanyTable';
import type { CompanyCreate, CompanyUpdate, Company } from '../../../models/company';
import useToast from '../../../hooks/useToast';

interface CompanyListProps {
	onAddClick?: (trigger: () => void) => void;
}

const CompanyList: React.FC<CompanyListProps> = ({ onAddClick }) => {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const toast = useToast();
	const { list, total, loading, stats } = useAppSelector((state) => state.companies);
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
	const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
	const [formLoading, setFormLoading] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deleting, setDeleting] = useState(false);

	useEffect(() => {
		dispatch(fetchCompanies({
			skip: page * rowsPerPage,
			limit: rowsPerPage,
			search: search || undefined,
			sortBy,
			sortOrder,
			...activeFilters
		}));
		dispatch(fetchCompanyStats());
	}, [dispatch, page, rowsPerPage, search, sortBy, sortOrder, activeFilters]);

	const handleSearchChange = (value: string) => {
		setSearch(value);
		setPage(0);
	};

	const handleRefresh = () => {
		dispatch(fetchCompanies({
			skip: page * rowsPerPage,
			limit: rowsPerPage,
			search: search || undefined,
			sortBy,
			sortOrder,
			...activeFilters
		}));
		dispatch(fetchCompanyStats());
	};

	const handleOpenAdd = () => {
		setSelectedCompany(null);
		setDialogOpen(true);
	};

	// Expose the add trigger to the parent (for PageHeader action button)
	useEffect(() => {
		if (onAddClick) onAddClick(handleOpenAdd);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [onAddClick]);

	const handleOpenEdit = (company: Company) => {
		setSelectedCompany(company);
		setDialogOpen(true);
	};

	const handleFormSubmit = async (data: CompanyCreate | CompanyUpdate) => {
		setFormLoading(true);
		try {
			if (selectedCompany) {
				await dispatch(updateCompany({ publicId: selectedCompany.public_id, company: data as CompanyUpdate })).unwrap();
				toast.success('Company updated successfully');
			} else {
				await dispatch(createCompany(data as CompanyCreate)).unwrap();
				toast.success('Company created successfully');
			}
			setDialogOpen(false);
			handleRefresh();
		} catch (error: any) {
			toast.error(error || 'Failed to save company');
		} finally {
			setFormLoading(false);
		}
	};

	const handleDeleteClick = (company: Company) => {
		setSelectedCompany(company);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!selectedCompany) return;
		setDeleting(true);
		try {
			await dispatch(deleteCompany(selectedCompany.public_id)).unwrap();
			toast.success('Company deleted successfully');
			setDeleteDialogOpen(false);
			handleRefresh();
		} catch (error: any) {
			toast.error(error || 'Failed to delete company');
		} finally {
			setDeleting(false);
		}
	};

	const handleSort = (columnId: keyof Company) => {
		const isAsc = sortBy === columnId && sortOrder === 'asc';
		setSortOrder(isAsc ? 'desc' : 'asc');
		setSortBy(String(columnId));
		setPage(0);
	};

	const handleFilterChange = (key: string, value: any) => {
		setActiveFilters(prev => ({ ...prev, [key]: value }));
	};

	const handleApplyFilters = () => {
		setFilterDrawerOpen(false);
		setPage(0);
	};

	const handleClearFilters = () => {
		setActiveFilters({});
		setFilterDrawerOpen(false);
		setPage(0);
	};

	const activeFilterCount = Object.keys(activeFilters).filter(k => !!activeFilters[k]).length;

	const filterFields: FilterField[] = [
		{
			key: 'status',
			label: 'Status',
			type: 'single-select',
			options: [
				{ value: 'prospect', label: 'Prospect' },
				{ value: 'customer', label: 'Customer' },
				{ value: 'active', label: 'Active' },
				{ value: 'inactive', label: 'Inactive' }
			]
		},
		{
			key: 'industry',
			label: 'Industry',
			type: 'single-select',
			options: [
				{ value: 'Technology', label: 'Technology' },
				{ value: 'Finance', label: 'Finance' },
				{ value: 'Healthcare', label: 'Healthcare' },
				{ value: 'Education', label: 'Education' },
				{ value: 'Manufacturing', label: 'Manufacturing' },
				{ value: 'Retail', label: 'Retail' },
				{ value: 'Services', label: 'Services' },
				{ value: 'Other', label: 'Other' }
			]
		}
	];

	return (
		<>

			<Box sx={{ mt: 3 }}>
				<CompanyStats list={list} stats={stats} />

				<CompanyTable
					list={list}
					total={total}
					loading={loading}
					page={page}
					rowsPerPage={rowsPerPage}
					onPageChange={(_, newPage) => setPage(newPage)}
					onRowsPerPageChange={(rows) => { setRowsPerPage(rows); setPage(0); }}
					sortBy={sortBy}
					sortOrder={sortOrder}
					onSort={handleSort}
					search={search}
					onSearchChange={handleSearchChange}
					onFilterOpen={() => setFilterDrawerOpen(true)}
					activeFilterCount={activeFilterCount}
					onRefresh={handleRefresh}
					isAdmin={isAdmin}
					onRowClick={(company) => navigate(`/crm/companies/${company.public_id}`)}
					onEdit={handleOpenEdit}
					onDelete={handleDeleteClick}
				/>

				<CompanyFormDialog
					open={dialogOpen}
					onClose={() => setDialogOpen(false)}
					onSubmit={handleFormSubmit}
					company={selectedCompany}
					loading={formLoading}
				/>

				<FilterDrawer
					open={filterDrawerOpen}
					onClose={() => setFilterDrawerOpen(false)}
					fields={filterFields}
					activeFilters={activeFilters}
					onFilterChange={handleFilterChange}
					onClearFilters={handleClearFilters}
					onApplyFilters={handleApplyFilters}
				/>

				<ConfirmationDialog
					open={deleteDialogOpen}
					title="Delete Company"
					message={`Are you sure you want to delete "${selectedCompany?.name}"? This will remove all associated data and cannot be undone.`}
					confirmLabel="Delete"
					onClose={() => setDeleteDialogOpen(false)}
					onConfirm={handleDeleteConfirm}
					loading={deleting}
					severity="error"
				/>
			</Box>
		</>
	);
};

export default CompanyList;
