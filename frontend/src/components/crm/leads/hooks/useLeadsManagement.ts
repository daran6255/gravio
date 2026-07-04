import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
	fetchLeads,
	fetchLeadStats,
	fetchStats,
	deleteLead,
	searchCompanyOptions,
	searchContactOptions,
	fetchOwners,
	bulkUpdateLeads,
	bulkDeleteLeads,
} from '../../../../store/slices/crmSlice';
import useToast from '../../../../hooks/useToast';
import type { Lead, LeadStatus, LeadPriority, LeadSource } from '../../../../models/crm/lead';

export const useLeadsManagement = () => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const { leads, leadsTotal, leadsLoading, leadStats, stats, owners, bulkUpdateLoading, bulkDeleteLoading } = useAppSelector((state) => state.crm);
	const { user } = useAppSelector((state) => state.auth);
	const [searchParams] = useSearchParams();
	const canBulkActions = user?.role === 'admin' || user?.role === 'manager';

	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(20);
	const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
	const [refreshKey, setRefreshKey] = useState(0);

	const [statusFilter, setStatusFilter] = useState<LeadStatus | ''>('');
	const [priorityFilter, setPriorityFilter] = useState<LeadPriority | ''>('');
	const [sourceFilter, setSourceFilter] = useState<LeadSource | ''>('');
	const [ownerFilter, setOwnerFilter] = useState<number | ''>('');
	const [staleOnly, setStaleOnly] = useState(false);

	const [formOpen, setFormOpen] = useState(false);
	const [editingLead, setEditingLead] = useState<Lead | null>(null);

	const [detailOpen, setDetailOpen] = useState(false);
	const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

	const [convertOpen, setConvertOpen] = useState(false);
	const [convertingLead, setConvertingLead] = useState<Lead | null>(null);

	const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);

	const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

	const [importOpen, setImportOpen] = useState(false);

	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	useEffect(() => {
		dispatch(fetchLeads({
			page: page + 1,
			pageSize: rowsPerPage,
			search: searchTerm || undefined,
			status: statusFilter || undefined,
			priority: priorityFilter || undefined,
			source: sourceFilter || undefined,
			ownerId: ownerFilter || undefined,
			stale: staleOnly || undefined,
		}));
	}, [dispatch, page, rowsPerPage, searchTerm, statusFilter, priorityFilter, sourceFilter, ownerFilter, staleOnly, refreshKey]);

	useEffect(() => {
		dispatch(fetchLeadStats());
	}, [dispatch, refreshKey]);

	// Pre-warm the company/contact option cache so detail drawers can resolve linked names.
	useEffect(() => {
		dispatch(searchCompanyOptions(undefined));
		dispatch(searchContactOptions(undefined));
	}, [dispatch]);

	// Source breakdown for the filter sidebar comes from the shared dashboard stats.
	useEffect(() => {
		dispatch(fetchStats());
	}, [dispatch]);

	// Needed both for the bulk-reassign dropdown and to resolve owner names in the table/filters.
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

	const handleStatusFilterChange = (value: LeadStatus | '') => {
		setStatusFilter(value);
		setPage(0);
	};

	const handlePriorityFilterChange = (value: LeadPriority | '') => {
		setPriorityFilter(value);
		setPage(0);
	};

	const handleSourceFilterChange = (value: LeadSource | '') => {
		setSourceFilter(value);
		setPage(0);
	};

	const handleOwnerFilterChange = (value: number | '') => {
		setOwnerFilter(value);
		setPage(0);
	};

	const handleStaleFilterChange = (value: boolean) => {
		setStaleOnly(value);
		setPage(0);
	};

	const handleClearFilters = () => {
		setStatusFilter('');
		setPriorityFilter('');
		setSourceFilter('');
		setOwnerFilter('');
		setStaleOnly(false);
		setPage(0);
	};

	const handleCreateClick = () => {
		setEditingLead(null);
		setFormOpen(true);
	};

	const handleEdit = (lead: Lead) => {
		setDetailOpen(false);
		setEditingLead(lead);
		setFormOpen(true);
	};

	const handleRowClick = (lead: Lead) => {
		setSelectedLead(lead);
		setDetailOpen(true);
	};

	const handleConvert = (lead: Lead) => {
		setConvertingLead(lead);
		setConvertOpen(true);
	};

	const handleDeleteRequest = (lead: Lead) => setDeleteTarget(lead);

	const handleConfirmDelete = async () => {
		if (!deleteTarget) return;
		setDeleteLoading(true);
		try {
			await dispatch(deleteLead(deleteTarget.public_id)).unwrap();
			toast.success('Lead deleted');
			if (selectedLead?.public_id === deleteTarget.public_id) setDetailOpen(false);
			setDeleteTarget(null);
			dispatch(fetchLeadStats());
		} catch (err: any) {
			toast.error(err || 'Failed to delete lead');
		} finally {
			setDeleteLoading(false);
		}
	};

	const handleFormSuccess = () => refreshData();

	const handleConverted = () => refreshData();

	const handleToggleSelect = (publicId: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(publicId)) next.delete(publicId);
			else next.add(publicId);
			return next;
		});
	};

	const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSelectedIds(event.target.checked ? new Set(leads.map((l) => l.public_id)) : new Set());
	};

	const handleClearSelection = () => setSelectedIds(new Set());

	const handleBulkReassign = async (ownerId: number) => {
		try {
			await dispatch(bulkUpdateLeads({ publicIds: Array.from(selectedIds), ownerId })).unwrap();
			toast.success(`Reassigned ${selectedIds.size} lead(s)`);
			handleClearSelection();
		} catch (err: any) {
			toast.error(err || 'Failed to reassign leads');
		}
	};

	const handleBulkStatusChange = async (status: LeadStatus) => {
		try {
			await dispatch(bulkUpdateLeads({ publicIds: Array.from(selectedIds), status })).unwrap();
			toast.success(`Updated status for ${selectedIds.size} lead(s)`);
			handleClearSelection();
			dispatch(fetchLeadStats());
		} catch (err: any) {
			toast.error(err || 'Failed to update lead status');
		}
	};

	const handleBulkDeleteRequest = () => setBulkDeleteOpen(true);

	const handleConfirmBulkDelete = async () => {
		try {
			const count = selectedIds.size;
			await dispatch(bulkDeleteLeads(Array.from(selectedIds))).unwrap();
			toast.success(`Deleted ${count} lead(s)`);
			handleClearSelection();
			setBulkDeleteOpen(false);
			dispatch(fetchLeadStats());
		} catch (err: any) {
			toast.error(err || 'Failed to delete leads');
		}
	};

	const handleImportSuccess = () => {
		refreshData();
		dispatch(fetchLeadStats());
	};

	return {
		leads,
		leadsTotal,
		leadsLoading,
		leadStats,
		sourceStats: stats?.leads_by_source ?? [],

		page,
		rowsPerPage,
		searchTerm,
		refreshData,
		handlePageChange,
		handleRowsPerPageChange,
		handleSearchChange,

		statusFilter,
		priorityFilter,
		sourceFilter,
		ownerFilter,
		staleOnly,
		handleStatusFilterChange,
		handlePriorityFilterChange,
		handleSourceFilterChange,
		handleOwnerFilterChange,
		handleStaleFilterChange,
		handleClearFilters,

		formOpen,
		setFormOpen,
		editingLead,

		detailOpen,
		setDetailOpen,
		selectedLead,

		convertOpen,
		setConvertOpen,
		convertingLead,

		deleteTarget,
		setDeleteTarget,
		deleteLoading,

		canBulkActions,
		owners,
		selectedIds,
		bulkUpdateLoading,
		bulkDeleteLoading,
		bulkDeleteOpen,
		setBulkDeleteOpen,
		handleToggleSelect,
		handleSelectAll,
		handleClearSelection,
		handleBulkReassign,
		handleBulkStatusChange,
		handleBulkDeleteRequest,
		handleConfirmBulkDelete,

		importOpen,
		setImportOpen,
		handleImportSuccess,

		handleCreateClick,
		handleEdit,
		handleRowClick,
		handleConvert,
		handleDeleteRequest,
		handleConfirmDelete,
		handleFormSuccess,
		handleConverted,
	};
};
