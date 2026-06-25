import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchCompanies, deleteCompany } from '../../../../store/slices/crmSlice';
import useToast from '../../../../hooks/useToast';
import type { Company } from '../../../../models/crm/company';

export const useCompaniesManagement = () => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const { companies, companiesTotal, companiesLoading } = useAppSelector((state) => state.crm);
	const [searchParams] = useSearchParams();

	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(20);
	const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
	const [refreshKey, setRefreshKey] = useState(0);

	const [formOpen, setFormOpen] = useState(false);
	const [editingCompany, setEditingCompany] = useState<Company | null>(null);

	const [detailOpen, setDetailOpen] = useState(false);
	const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

	const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);

	useEffect(() => {
		dispatch(fetchCompanies({ page: page + 1, pageSize: rowsPerPage, search: searchTerm || undefined }));
	}, [dispatch, page, rowsPerPage, searchTerm, refreshKey]);

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
		} catch (err: any) {
			toast.error(err || 'Failed to delete company');
		} finally {
			setDeleteLoading(false);
		}
	};

	const handleFormSuccess = () => refreshData();

	return {
		companies,
		companiesTotal,
		companiesLoading,

		page,
		rowsPerPage,
		searchTerm,
		refreshData,
		handlePageChange,
		handleRowsPerPageChange,
		handleSearchChange,

		formOpen,
		setFormOpen,
		editingCompany,

		detailOpen,
		setDetailOpen,
		selectedCompany,

		deleteTarget,
		setDeleteTarget,
		deleteLoading,

		handleCreateClick,
		handleEdit,
		handleRowClick,
		handleDeleteRequest,
		handleConfirmDelete,
		handleFormSuccess,
	};
};
