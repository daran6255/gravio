import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
	fetchCompanies,
	fetchCompanyStats,
	deleteCompany,
	fetchOwners,
	bulkUpdateCompanies,
	bulkDeleteCompanies,
} from '../../../../store/slices/crmSlice';
import useToast from '../../../../hooks/useToast';
import type { Company, CompanyStatus, CompanySize } from '../../../../models/crm/company';

export const useCompaniesManagement = () => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const {
		companies, companiesTotal, companiesLoading,
		companyStats, owners,
		companiesBulkUpdateLoading, companiesBulkDeleteLoading,
	} = useAppSelector((state) => state.crm);
	const { user } = useAppSelector((state) => state.auth);
	const [searchParams] = useSearchParams();
	const canBulkActions = user?.role === 'admin' || user?.role === 'manager';

	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(20);
	const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
	const [refreshKey, setRefreshKey] = useState(0);

	const [statusFilter, setStatusFilter] = useState<CompanyStatus | ''>('');
	const [industryFilter, setIndustryFilter] = useState<string | ''>('');
	const [sizeFilter, setSizeFilter] = useState<CompanySize | ''>('');
	const [ownerFilter, setOwnerFilter] = useState<number | ''>('');

	const [formOpen, setFormOpen] = useState(false);
	const [editingCompany, setEditingCompany] = useState<Company | null>(null);

	const [detailOpen, setDetailOpen] = useState(false);
	const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

	const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);

	const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	useEffect(() => {
		dispatch(fetchCompanies({
			page: page + 1,
			pageSize: rowsPerPage,
			search: searchTerm || undefined,
			status: statusFilter || undefined,
			industry: industryFilter || undefined,
			size: sizeFilter || undefined,
			ownerId: ownerFilter || undefined,
		}));
	}, [dispatch, page, rowsPerPage, searchTerm, statusFilter, industryFilter, sizeFilter, ownerFilter, refreshKey]);

	useEffect(() => {
		dispatch(fetchCompanyStats());
	}, [dispatch, refreshKey]);

	useEffect(() => {
		dispatch(fetchOwners());
	}, [dispatch]);

	const refreshData = useCallback(() => setRefreshKey((k) => k + 1), []);

	const handlePageChange = (_event: unknown, newPage: number) => setPage(newPage);

	const handleRowsPerPageChange = (rows: number) => {
		setRowsPerPage(rows);
		setPage(0);
	};

	const handleSearchChange = (value: string) => {
		setSearchTerm(value);
		setPage(0);
	};

	const handleStatusFilterChange = (value: CompanyStatus | '') => {
		setStatusFilter(value);
		setPage(0);
	};

	const handleIndustryFilterChange = (value: string | '') => {
		setIndustryFilter(value);
		setPage(0);
	};

	const handleSizeFilterChange = (value: CompanySize | '') => {
		setSizeFilter(value);
		setPage(0);
	};

	const handleOwnerFilterChange = (value: number | '') => {
		setOwnerFilter(value);
		setPage(0);
	};

	const handleClearFilters = () => {
		setStatusFilter('');
		setIndustryFilter('');
		setSizeFilter('');
		setOwnerFilter('');
		setPage(0);
	};

	const handleCreateClick = () => {
		setEditingCompany(null);
		setFormOpen(true);
	};

	const handleEdit = (company: Company) => {
		setDetailOpen(false);
		setEditingCompany(company);
		setFormOpen(true);
	};

	const handleRowClick = (company: Company) => {
		setSelectedCompany(company);
		setDetailOpen(true);
	};

	const handleDeleteRequest = (company: Company) => setDeleteTarget(company);

	const handleConfirmDelete = async () => {
		if (!deleteTarget) return;
		setDeleteLoading(true);
		try {
			await dispatch(deleteCompany(deleteTarget.public_id)).unwrap();
			toast.success('Company deleted');
			if (selectedCompany?.public_id === deleteTarget.public_id) setDetailOpen(false);
			setDeleteTarget(null);
			dispatch(fetchCompanyStats());
		} catch (err: any) {
			toast.error(err || 'Failed to delete company');
		} finally {
			setDeleteLoading(false);
		}
	};

	const handleFormSuccess = () => {
		refreshData();
	};

	const handleToggleSelect = (publicId: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(publicId)) next.delete(publicId);
			else next.add(publicId);
			return next;
		});
	};

	const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSelectedIds(event.target.checked ? new Set(companies.map((c) => c.public_id)) : new Set());
	};

	const handleClearSelection = () => setSelectedIds(new Set());

	const handleBulkReassign = async (ownerId: number) => {
		try {
			await dispatch(bulkUpdateCompanies({ publicIds: Array.from(selectedIds), ownerId })).unwrap();
			toast.success(`Reassigned ${selectedIds.size} company(ies)`);
			handleClearSelection();
		} catch (err: any) {
			toast.error(err || 'Failed to reassign companies');
		}
	};

	const handleBulkStatusChange = async (status: CompanyStatus) => {
		try {
			await dispatch(bulkUpdateCompanies({ publicIds: Array.from(selectedIds), status })).unwrap();
			toast.success(`Updated status for ${selectedIds.size} company(ies)`);
			handleClearSelection();
			dispatch(fetchCompanyStats());
		} catch (err: any) {
			toast.error(err || 'Failed to update company status');
		}
	};

	const handleBulkDeleteRequest = () => setBulkDeleteOpen(true);

	const handleConfirmBulkDelete = async () => {
		try {
			const count = selectedIds.size;
			await dispatch(bulkDeleteCompanies(Array.from(selectedIds))).unwrap();
			toast.success(`Deleted ${count} company(ies)`);
			handleClearSelection();
			setBulkDeleteOpen(false);
			dispatch(fetchCompanyStats());
		} catch (err: any) {
			toast.error(err || 'Failed to delete companies');
		}
	};

	return {
		companies,
		companiesTotal,
		companiesLoading,
		companyStats,

		page,
		rowsPerPage,
		searchTerm,
		refreshData,
		handlePageChange,
		handleRowsPerPageChange,
		handleSearchChange,

		statusFilter,
		industryFilter,
		sizeFilter,
		ownerFilter,
		handleStatusFilterChange,
		handleIndustryFilterChange,
		handleSizeFilterChange,
		handleOwnerFilterChange,
		handleClearFilters,

		formOpen,
		setFormOpen,
		editingCompany,

		detailOpen,
		setDetailOpen,
		selectedCompany,

		deleteTarget,
		setDeleteTarget,
		deleteLoading,

		canBulkActions,
		owners,
		selectedIds,
		bulkUpdateLoading: companiesBulkUpdateLoading,
		bulkDeleteLoading: companiesBulkDeleteLoading,
		bulkDeleteOpen,
		setBulkDeleteOpen,
		handleToggleSelect,
		handleSelectAll,
		handleClearSelection,
		handleBulkReassign,
		handleBulkStatusChange,
		handleBulkDeleteRequest,
		handleConfirmBulkDelete,

		handleCreateClick,
		handleEdit,
		handleRowClick,
		handleDeleteRequest,
		handleConfirmDelete,
		handleFormSuccess,
	};
};
