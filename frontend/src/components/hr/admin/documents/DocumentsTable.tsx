import React, { useMemo, useState } from 'react';
import {
	Chip, FormControl, MenuItem, Select, Stack, Tooltip, Typography, useTheme,
	TableCell, TableRow,
} from '@mui/material';
import {
	Download as DownloadIcon,
	CheckCircleOutline as VerifyIcon,
	RemoveCircleOutline as UnverifyIcon,
	DeleteOutline as DeleteIcon,
	InsertDriveFileOutlined as FileIcon,
} from '@mui/icons-material';
import { DataTable, DataTableActions, type ColumnDefinition, type TableMenuAction } from '../../../common/table';
import ConfirmationDialog from '../../../common/dialogbox/ConfirmationDialog';
import { useAppDispatch } from '../../../../store/hooks';
import { verifyDocument, deleteDocument } from '../../../../store/slices/hrSlice';
import { hrEmployeeDocumentApi } from '../../../../services/hrService';
import useToast from '../../../../hooks/useToast';
import type { HREmployeeDocument } from '../../../../models/hr';
import { formatFileSize } from './documentTypes';

interface DocumentsTableProps {
	documents: HREmployeeDocument[];
	loading: boolean;
	canManage: boolean;
	onUploadClick: () => void;
}

const formatDate = (value?: string | null) =>
	value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const DocumentsTable: React.FC<DocumentsTableProps> = ({ documents, loading, canManage, onUploadClick }) => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const { success, error } = useToast();

	const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'pending' | 'expiring'>('all');
	const [search, setSearch] = useState('');
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [deleteTarget, setDeleteTarget] = useState<HREmployeeDocument | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [downloadingId, setDownloadingId] = useState<number | null>(null);

	const today = new Date();
	const in30Days = new Date();
	in30Days.setDate(today.getDate() + 30);

	const filtered = useMemo(() => {
		let rows = documents;
		if (statusFilter === 'verified') rows = rows.filter((d) => d.is_verified);
		else if (statusFilter === 'pending') rows = rows.filter((d) => !d.is_verified);
		else if (statusFilter === 'expiring') {
			rows = rows.filter((d) => d.expiry_date && new Date(d.expiry_date) >= today && new Date(d.expiry_date) <= in30Days);
		}
		if (search.trim()) {
			const q = search.trim().toLowerCase();
			rows = rows.filter((d) => d.employee_name?.toLowerCase().includes(q) || d.document_type.toLowerCase().includes(q) || d.file_name?.toLowerCase().includes(q));
		}
		return rows;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [documents, statusFilter, search]);

	const paged = useMemo(() => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage), [filtered, page, rowsPerPage]);

	const handleDownload = async (doc: HREmployeeDocument) => {
		setDownloadingId(doc.id);
		try {
			await hrEmployeeDocumentApi.download(doc.id, doc.file_name || `${doc.document_type}.pdf`);
		} catch {
			error('Failed to download document');
		} finally {
			setDownloadingId(null);
		}
	};

	const handleToggleVerify = async (doc: HREmployeeDocument) => {
		try {
			await dispatch(verifyDocument({ id: doc.id, isVerified: !doc.is_verified })).unwrap();
			success(doc.is_verified ? 'Document marked unverified' : 'Document verified');
		} catch {
			error('Failed to update verification status');
		}
	};

	const handleConfirmDelete = async () => {
		if (!deleteTarget) return;
		setDeleting(true);
		try {
			await dispatch(deleteDocument(deleteTarget.id)).unwrap();
			success('Document deleted');
			setDeleteTarget(null);
		} catch {
			error('Failed to delete document');
		} finally {
			setDeleting(false);
		}
	};

	const columns: ColumnDefinition<HREmployeeDocument>[] = [
		{ id: 'employee_name', label: 'Employee' },
		{ id: 'document_type', label: 'Type' },
		{ id: 'file_name', label: 'File', hideOnMobile: true },
		{ id: 'expiry_date', label: 'Expiry', hideOnMobile: true },
		{ id: 'is_verified', label: 'Status' },
		{ id: 'uploaded_by_name', label: 'Uploaded By', hideOnMobile: true },
		{ id: 'actions', label: '', align: 'right' },
	];

	const renderRow = (doc: HREmployeeDocument) => {
		const isExpiring = !!doc.expiry_date && new Date(doc.expiry_date) >= today && new Date(doc.expiry_date) <= in30Days;
		const isExpired = !!doc.expiry_date && new Date(doc.expiry_date) < today;

		const actions: TableMenuAction<HREmployeeDocument>[] = [
			{ label: 'Download', icon: <DownloadIcon fontSize="small" />, onClick: handleDownload },
			{
				label: doc.is_verified ? 'Mark Unverified' : 'Verify Document',
				icon: doc.is_verified ? <UnverifyIcon fontSize="small" /> : <VerifyIcon fontSize="small" />,
				color: doc.is_verified ? 'warning.main' : 'success.main',
				onClick: handleToggleVerify,
				hidden: !canManage,
			},
			{
				label: 'Delete Document',
				icon: <DeleteIcon fontSize="small" />,
				color: 'error.main',
				onClick: (d) => setDeleteTarget(d),
				divider: true,
			},
		];

		return (
			<TableRow key={doc.id} hover>
				<TableCell sx={{ fontWeight: 700 }}>{doc.employee_name}</TableCell>
				<TableCell>{doc.document_type}</TableCell>
				<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
					<Stack direction="row" spacing={0.75} alignItems="center">
						<FileIcon sx={{ fontSize: '1rem', color: 'text.disabled' }} />
						<Tooltip title={doc.file_name || 'Unnamed file'}>
							<Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>{doc.file_name || '—'}</Typography>
						</Tooltip>
						<Typography variant="caption" color="text.disabled">({formatFileSize(doc.file_size)})</Typography>
					</Stack>
				</TableCell>
				<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
					<Typography variant="body2" color={isExpired ? 'error.main' : isExpiring ? 'warning.main' : 'text.primary'} fontWeight={isExpiring || isExpired ? 700 : 400}>
						{formatDate(doc.expiry_date)}
					</Typography>
				</TableCell>
				<TableCell>
					<Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
						<Chip
							label={doc.is_verified ? 'Verified' : 'Pending'}
							size="small"
							color={doc.is_verified ? 'success' : 'warning'}
							sx={{ fontWeight: 700 }}
						/>
						{isExpired && <Chip label="Expired" size="small" color="error" variant="outlined" sx={{ fontWeight: 700 }} />}
					</Stack>
				</TableCell>
				<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
					<Typography variant="body2" color="text.secondary">{doc.uploaded_by_name || '—'}</Typography>
				</TableCell>
				<TableCell align="right" onClick={(e) => e.stopPropagation()}>
					<Stack direction="row" justifyContent="flex-end">
						<DataTableActions item={doc} actions={actions} tooltipTitle="Document Actions" />
					</Stack>
				</TableCell>
			</TableRow>
		);
	};

	return (
		<>
			<DataTable<HREmployeeDocument>
				columns={columns}
				data={paged}
				loading={loading || downloadingId !== null}
				totalCount={filtered.length}
				page={page}
				rowsPerPage={rowsPerPage}
				onPageChange={(_, newPage) => setPage(newPage)}
				onRowsPerPageChange={(newRows) => { setRowsPerPage(newRows); setPage(0); }}
				searchTerm={search}
				onSearchChange={(v) => { setSearch(v); setPage(0); }}
				searchPlaceholder="Search by employee, type, or file…"
				emptyMessage="No documents found."
				renderRow={renderRow}
				canCreate={canManage}
				createButtonText="Upload Document"
				onCreateClick={onUploadClick}
				headerActions={
					<FormControl size="small" sx={{ minWidth: 170 }}>
						<Select
							value={statusFilter}
							onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(0); }}
							sx={{ borderRadius: '12px', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.015)' }}
						>
							<MenuItem value="all">All Documents</MenuItem>
							<MenuItem value="verified">Verified</MenuItem>
							<MenuItem value="pending">Pending Verification</MenuItem>
							<MenuItem value="expiring">Expiring Soon</MenuItem>
						</Select>
					</FormControl>
				}
			/>

			<ConfirmationDialog
				open={!!deleteTarget}
				onClose={() => setDeleteTarget(null)}
				onConfirm={handleConfirmDelete}
				title="Delete Document"
				message={deleteTarget ? `Delete "${deleteTarget.file_name || deleteTarget.document_type}" for ${deleteTarget.employee_name}? This cannot be undone.` : ''}
				confirmLabel="Delete"
				severity="error"
				loading={deleting}
			/>
		</>
	);
};

export default DocumentsTable;
