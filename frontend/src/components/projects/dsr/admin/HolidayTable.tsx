import React, { useState } from 'react';
import {
	TableContainer,
	Table,
	TableHead,
	TableRow,
	TableCell,
	TableBody,
	Box,
	Paper,
	CircularProgress,
	Typography,
	IconButton,
	Tooltip,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon, CloudUpload as UploadIcon, Edit as EditIcon } from '@mui/icons-material';
import CustomTablePagination from '../../../common/table/CustomTablePagination';
import DSRAdminTableHeader from './DSRAdminTableHeader';
import { ConfirmationDialog, ImportDialog, type ImportResult } from '../../../common/dialogbox';
import dayjs from 'dayjs';
import { useHolidayAdmin } from '../hooks/useHolidayAdmin';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { createHoliday, importHolidays, deleteHoliday, updateHoliday } from '../../../../store/slices/holidaySlice';
import useToast from '../../../../hooks/useToast';
import type { CompanyHoliday } from '../../../../services/holidayService';

const HolidayTable: React.FC = () => {
	const admin = useHolidayAdmin();
	const dispatch = useAppDispatch();
	const toast = useToast();
	const { user } = useAppSelector((state) => state.auth);
	const isAdmin = user?.role === 'admin';

	const [openAdd, setOpenAdd] = useState(false);
	const [openImport, setOpenImport] = useState(false);
	const [openEdit, setOpenEdit] = useState(false);
	const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
	
	const [newHoliday, setNewHoliday] = useState({ holiday_date: '', holiday_name: '' });
	const [editingHoliday, setEditingHoliday] = useState<CompanyHoliday | null>(null);
	const [holidayToDelete, setHolidayToDelete] = useState<string | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [importResult, setImportResult] = useState<ImportResult | null>(null);
	const [importing, setImporting] = useState(false);

	const handleAddHoliday = async () => {
		if (newHoliday.holiday_date && newHoliday.holiday_name) {
			try {
				await dispatch(createHoliday(newHoliday)).unwrap();
				setOpenAdd(false);
				setNewHoliday({ holiday_date: '', holiday_name: '' });
				toast.success('Holiday added successfully');
				admin.handleRefresh();
			} catch (err: any) {
				toast.error(err || 'Failed to add holiday');
			}
		}
	};

	const handleEditHoliday = async () => {
		if (editingHoliday && editingHoliday.holiday_date && editingHoliday.holiday_name) {
			try {
				await dispatch(updateHoliday({
					public_id: editingHoliday.public_id,
					data: {
						holiday_date: editingHoliday.holiday_date,
						holiday_name: editingHoliday.holiday_name
					}
				})).unwrap();
				setOpenEdit(false);
				setEditingHoliday(null);
				toast.success('Holiday updated successfully');
				admin.handleRefresh();
			} catch (err: any) {
				toast.error(err || 'Failed to update holiday');
			}
		}
	};

	const handleDeleteConfirm = async () => {
		if (holidayToDelete) {
			setDeleting(true);
			try {
				await dispatch(deleteHoliday(holidayToDelete)).unwrap();
				toast.success('Holiday deleted successfully');
				setOpenConfirmDelete(false);
				setHolidayToDelete(null);
				admin.handleRefresh();
			} catch (err: any) {
				toast.error(err || 'Failed to delete holiday');
			} finally {
				setDeleting(false);
			}
		}
	};

	const handleImport = async (file: File) => {
		setImporting(true);
		try {
			const res = await dispatch(importHolidays(file)).unwrap();
			setImportResult(res);
			admin.handleRefresh();
			return res;
		} catch (err: any) {
			toast.error(err || 'Failed to import holidays');
		} finally {
			setImporting(false);
		}
	};

	const handleDownloadTemplate = async () => {
		const csvContent = "date,name\n2026-01-01,New Year's Day\n2026-01-26,Republic Day\n2026-08-15,Independence Day\n2026-10-02,Gandhi Jayanti";
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.setAttribute("href", url);
		link.setAttribute("download", "holiday_import_template.csv");
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const filteredHolidays = admin.holidays.filter(h => 
		h.holiday_name.toLowerCase().includes(admin.searchTerm.toLowerCase()) ||
		dayjs(h.holiday_date).format('DD/MM/YYYY').includes(admin.searchTerm)
	);

	const actions = (
		<Box sx={{ display: 'flex', gap: 1 }}>
			<Button
				variant="outlined"
				size="small"
				startIcon={<UploadIcon />}
				onClick={() => setOpenImport(true)}
				sx={{ textTransform: 'none', fontWeight: 600, height: '36px', borderColor: '#d5dbdb', color: '#232f3e' }}
			>
				Import
			</Button>
			<Button
				variant="contained"
				size="small"
				startIcon={<AddIcon />}
				onClick={() => setOpenAdd(true)}
				sx={{ textTransform: 'none', fontWeight: 600, height: '36px', bgcolor: '#ec7211', '&:hover': { bgcolor: '#eb5f07' } }}
			>
				Add Holiday
			</Button>
		</Box>
	);

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<Typography variant="h6" sx={{ fontWeight: 700, color: '#232f3e' }}>
					Company Holidays
				</Typography>
			</Box>
			<Paper sx={{ border: '1px solid #d5dbdb', boxShadow: 'none', borderRadius: '8px', overflow: 'hidden' }}>
				<DSRAdminTableHeader
					searchTerm={admin.searchTerm}
					onSearchChange={admin.setSearchTerm}
					onRefresh={admin.handleRefresh}
					placeholder="Search holidays..."
					actions={actions}
				/>

				<TableContainer>
					<Table sx={{ minWidth: 650 }}>
						<TableHead>
							<TableRow sx={{ bgcolor: '#fafafa' }}>
								<TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.875rem', borderBottom: '2px solid #d5dbdb' }}>Date</TableCell>
								<TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.875rem', borderBottom: '2px solid #d5dbdb' }}>Holiday Name</TableCell>
								<TableCell sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.875rem', borderBottom: '2px solid #d5dbdb' }}>Day</TableCell>
								<TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.875rem', borderBottom: '2px solid #d5dbdb' }}>Actions</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{admin.loading && admin.holidays.length === 0 ? (
								<TableRow>
									<TableCell colSpan={4} align="center" sx={{ py: 4 }}>
										<CircularProgress size={24} />
										<Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>Loading holidays...</Typography>
									</TableCell>
								</TableRow>
							) : filteredHolidays.length === 0 ? (
								<TableRow>
									<TableCell colSpan={4} align="center" sx={{ py: 4 }}>
										<Typography variant="body2" color="text.secondary">
											{admin.searchTerm ? 'No records match your search.' : 'No holidays found.'}
										</Typography>
									</TableCell>
								</TableRow>
							) : (
								filteredHolidays.map((holiday) => (
									<TableRow
										key={holiday.public_id}
										sx={{
											'&:hover': { bgcolor: '#f5f8fa' },
											'&:last-child td': { borderBottom: 0 }
										}}
									>
										<TableCell sx={{ fontWeight: 600, color: '#232f3e' }}>
											{dayjs(holiday.holiday_date).format('DD/MMM/YYYY')}
										</TableCell>
										<TableCell sx={{ fontWeight: 500 }}>{holiday.holiday_name}</TableCell>
										<TableCell>{dayjs(holiday.holiday_date).format('dddd')}</TableCell>
										<TableCell align="right">
											{isAdmin && (
												<Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
													<Tooltip title="Edit Holiday">
														<IconButton
															size="small"
															onClick={() => {
																setEditingHoliday(holiday);
																setOpenEdit(true);
															}}
															sx={{ color: '#232f3e' }}
														>
															<EditIcon fontSize="small" />
														</IconButton>
													</Tooltip>
													<Tooltip title="Delete Holiday">
														<IconButton
															size="small"
															onClick={() => {
																setHolidayToDelete(holiday.public_id);
																setOpenConfirmDelete(true);
															}}
															sx={{ color: '#d13212' }}
														>
															<DeleteIcon fontSize="small" />
														</IconButton>
													</Tooltip>
												</Box>
											)}
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</TableContainer>

				<CustomTablePagination
					count={admin.total}
					page={admin.page}
					rowsPerPage={admin.rowsPerPage}
					onPageChange={(_, p) => admin.setPage(p)}
					onRowsPerPageChange={(e) => admin.setRowsPerPage(parseInt(e.target.value, 10))}
					onRowsPerPageSelectChange={(r) => admin.setRowsPerPage(r)}
				/>
			</Paper>

			<ImportDialog
				open={openImport}
				onClose={() => setOpenImport(false)}
				onImport={handleImport}
				title="Import Company Holidays"
				subtitle="Upload a CSV file with columns: date (YYYY-MM-DD or DD-MM-YYYY) and name."
				acceptedFiles=".csv"
				onDownloadTemplate={handleDownloadTemplate}
				loading={importing}
				result={importResult}
				onResetResult={() => setImportResult(null)}
			/>

			<ConfirmationDialog
				open={openConfirmDelete}
				title="Delete Holiday"
				message="Are you sure you want to delete this holiday? This action cannot be undone."
				onClose={() => {
					setOpenConfirmDelete(false);
					setHolidayToDelete(null);
				}}
				onConfirm={handleDeleteConfirm}
				confirmLabel="Delete"
				severity="error"
				loading={deleting}
			/>

			{/* Add Holiday Dialog */}
			<Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="xs" fullWidth>
				<DialogTitle sx={{ fontWeight: 700 }}>Add New Holiday</DialogTitle>
				<DialogContent>
					<Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
						<TextField
							label="Holiday Date"
							type="date"
							fullWidth
							InputLabelProps={{ shrink: true }}
							value={newHoliday.holiday_date}
							onChange={(e) => setNewHoliday({ ...newHoliday, holiday_date: e.target.value })}
						/>
						<TextField
							label="Holiday Name"
							fullWidth
							placeholder="e.g. Independence Day"
							value={newHoliday.holiday_name}
							onChange={(e) => setNewHoliday({ ...newHoliday, holiday_name: e.target.value })}
						/>
					</Box>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button onClick={() => setOpenAdd(false)} color="inherit" sx={{ textTransform: 'none' }}>Cancel</Button>
					<Button onClick={handleAddHoliday} variant="contained" disabled={!newHoliday.holiday_date || !newHoliday.holiday_name} sx={{ textTransform: 'none', bgcolor: '#ec7211', '&:hover': { bgcolor: '#eb5f07' } }}>
						Save Holiday
					</Button>
				</DialogActions>
			</Dialog>

			{/* Edit Holiday Dialog */}
			<Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="xs" fullWidth>
				<DialogTitle sx={{ fontWeight: 700 }}>Edit Holiday</DialogTitle>
				<DialogContent>
					<Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
						<TextField
							label="Holiday Date"
							type="date"
							fullWidth
							InputLabelProps={{ shrink: true }}
							value={editingHoliday?.holiday_date || ''}
							onChange={(e) => setEditingHoliday(editingHoliday ? { ...editingHoliday, holiday_date: e.target.value } : null)}
						/>
						<TextField
							label="Holiday Name"
							fullWidth
							placeholder="e.g. Independence Day"
							value={editingHoliday?.holiday_name || ''}
							onChange={(e) => setEditingHoliday(editingHoliday ? { ...editingHoliday, holiday_name: e.target.value } : null)}
						/>
					</Box>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button onClick={() => setOpenEdit(false)} color="inherit" sx={{ textTransform: 'none' }}>Cancel</Button>
					<Button onClick={handleEditHoliday} variant="contained" disabled={!editingHoliday?.holiday_date || !editingHoliday?.holiday_name} sx={{ textTransform: 'none', bgcolor: '#ec7211', '&:hover': { bgcolor: '#eb5f07' } }}>
						Update Holiday
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default React.memo(HolidayTable);
