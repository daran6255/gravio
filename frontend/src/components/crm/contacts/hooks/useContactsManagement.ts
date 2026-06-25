import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchContacts, deleteContact, searchCompanyOptions } from '../../../../store/slices/crmSlice';
import useToast from '../../../../hooks/useToast';
import type { Contact } from '../../../../models/crm/contact';

export const useContactsManagement = () => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const { contacts, contactsTotal, contactsLoading, companyOptions } = useAppSelector((state) => state.crm);
	const [searchParams] = useSearchParams();

	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(20);
	const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
	const [refreshKey, setRefreshKey] = useState(0);

	const [formOpen, setFormOpen] = useState(false);
	const [editingContact, setEditingContact] = useState<Contact | null>(null);

	const [detailOpen, setDetailOpen] = useState(false);
	const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

	const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);

	useEffect(() => {
		dispatch(fetchContacts({ page: page + 1, pageSize: rowsPerPage, search: searchTerm || undefined }));
	}, [dispatch, page, rowsPerPage, searchTerm, refreshKey]);

	// Pre-warm the company option cache so the table/drawer can resolve linked company names.
	useEffect(() => {
		dispatch(searchCompanyOptions(undefined));
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
		setEditingContact(null);
		setFormOpen(true);
	};

	const handleEdit = (contact: Contact) => {
		setDetailOpen(false);
		setEditingContact(contact);
		setFormOpen(true);
	};

	const handleRowClick = (contact: Contact) => {
		setSelectedContact(contact);
		setDetailOpen(true);
	};

	const handleDeleteRequest = (contact: Contact) => setDeleteTarget(contact);

	const handleConfirmDelete = async () => {
		if (!deleteTarget) return;
		setDeleteLoading(true);
		try {
			await dispatch(deleteContact(deleteTarget.public_id)).unwrap();
			toast.success('Contact deleted');
			if (selectedContact?.public_id === deleteTarget.public_id) setDetailOpen(false);
			setDeleteTarget(null);
		} catch (err: any) {
			toast.error(err || 'Failed to delete contact');
		} finally {
			setDeleteLoading(false);
		}
	};

	const handleFormSuccess = () => refreshData();

	return {
		contacts,
		contactsTotal,
		contactsLoading,
		companyOptions,

		page,
		rowsPerPage,
		searchTerm,
		refreshData,
		handlePageChange,
		handleRowsPerPageChange,
		handleSearchChange,

		formOpen,
		setFormOpen,
		editingContact,

		detailOpen,
		setDetailOpen,
		selectedContact,

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
