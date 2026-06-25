import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchLeads, deleteLead, searchCompanyOptions, searchContactOptions } from '../../../../store/slices/crmSlice';
import useToast from '../../../../hooks/useToast';
import type { Lead } from '../../../../models/crm/lead';

export const useLeadsManagement = () => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const { leads, leadsTotal, leadsLoading } = useAppSelector((state) => state.crm);

	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(20);
	const [searchTerm, setSearchTerm] = useState('');
	const [refreshKey, setRefreshKey] = useState(0);

	const [formOpen, setFormOpen] = useState(false);
	const [editingLead, setEditingLead] = useState<Lead | null>(null);

	const [detailOpen, setDetailOpen] = useState(false);
	const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

	const [convertOpen, setConvertOpen] = useState(false);
	const [convertingLead, setConvertingLead] = useState<Lead | null>(null);

	const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);

	useEffect(() => {
		dispatch(fetchLeads({ page: page + 1, pageSize: rowsPerPage, search: searchTerm || undefined }));
	}, [dispatch, page, rowsPerPage, searchTerm, refreshKey]);

	// Pre-warm the company/contact option cache so detail drawers can resolve linked names.
	useEffect(() => {
		dispatch(searchCompanyOptions(undefined));
		dispatch(searchContactOptions(undefined));
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
		} catch (err: any) {
			toast.error(err || 'Failed to delete lead');
		} finally {
			setDeleteLoading(false);
		}
	};

	const handleFormSuccess = () => refreshData();

	const handleConverted = () => refreshData();

	return {
		leads,
		leadsTotal,
		leadsLoading,

		page,
		rowsPerPage,
		searchTerm,
		refreshData,
		handlePageChange,
		handleRowsPerPageChange,
		handleSearchChange,

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
