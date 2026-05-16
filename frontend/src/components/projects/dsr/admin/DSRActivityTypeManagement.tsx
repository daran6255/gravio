import React, { useState, useEffect } from 'react';
import {
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	IconButton,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Typography,
	Box,
	Chip,
	CircularProgress,
	Alert,
	Checkbox
} from '@mui/material';
import {
	Edit as EditIcon,
	Delete as DeleteIcon,
	Add as AddIcon,
	Save as SaveIcon,
	Cancel as CancelIcon,
	FileUpload as ImportIcon
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
	fetchActivityTypes,
	createActivityType,
	updateActivityType,
	clearActivityTypeError
} from '../../../../store/slices/dsrActivityTypeSlice';
import dsrActivityTypeService from '../../../../services/dsrActivityTypeService';
import useToast from '../../../../hooks/useToast';
import type { DSRActivityType } from '../../../../models/dsr';
import DSRAdminTableHeader from './DSRAdminTableHeader';
import { ConfirmationDialog, ImportDialog, type ImportResult } from '../../../common/dialogbox';

const DSRActivityTypeManagement: React.FC = () => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const { activityTypes, loading, error } = useAppSelector((state) => state.dsrActivityType);

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingType, setEditingType] = useState<Partial<DSRActivityType> | null>(null);
	const [formData, setFormData] = useState({
		name: '',
		code: '',
		description: '',
		category: '',
		sort_order: 0
	});
	const [searchTerm, setSearchTerm] = useState('');
	const [importDialogOpen, setImportDialogOpen] = useState(false);
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [typeToDelete, setTypeToDelete] = useState<string | null>(null);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [importResult, setImportResult] = useState<ImportResult | null>(null);
	const [importing, setImporting] = useState(false);

	const filteredActivityTypes = React.useMemo(() => {
		if (!searchTerm) return activityTypes;
		const s = searchTerm.toLowerCase();
		return activityTypes.filter(t =>
			t.name.toLowerCase().includes(s) ||
			t.code.toLowerCase().includes(s) ||
			(t.category || '').toLowerCase().includes(s) ||
			(t.description || '').toLowerCase().includes(s)
		);
	}, [activityTypes, searchTerm]);

	useEffect(() => {
		dispatch(fetchActivityTypes({ onlyActive: false }));
	}, [dispatch]);

	const handleOpenDialog = (type?: DSRActivityType) => {
		if (type) {
			setEditingType(type);
			setFormData({
				name: type.name,
				code: type.code,
				description: type.description || '',
				category: type.category || '',
				sort_order: type.sort_order
			});
		} else {
			setEditingType(null);
			setFormData({
				name: '',
				code: '',
				description: '',
				category: '',
				sort_order: activityTypes.length + 1
			});
		}
		setDialogOpen(true);
	};

	const handleCloseDialog = () => {
		setDialogOpen(false);
		dispatch(clearActivityTypeError());
	};

	const handleSave = async () => {
		try {
			if (editingType?.public_id) {
				await dispatch(updateActivityType({
					publicId: editingType.public_id,
					data: formData as any
				})).unwrap();
				toast.success('Activity type updated successfully');
			} else {
				await dispatch(createActivityType(formData as any)).unwrap();
				toast.success('Activity type created successfully');
			}
			handleCloseDialog();
		} catch (err) {
			// Error handled by Redux state
		}
	};

	const handleDeleteClick = (publicId: string) => {
		setTypeToDelete(publicId);
		setDeleteConfirmOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!typeToDelete) return;
		
		setDeleting(true);
		try {
			await dsrActivityTypeService.deleteActivityType(typeToDelete);
			toast.success('Activity type deleted');
			setDeleteConfirmOpen(false);
			setTypeToDelete(null);
			dispatch(fetchActivityTypes({ onlyActive: false }));
		} catch (err: any) {
			toast.error(err.response?.data?.detail || 'Failed to delete activity type');
		} finally {
			setDeleting(false);
		}
	};

	const handleConfirmBulkDelete = async () => {
		if (selectedIds.length === 0) return;
		
		setDeleting(true);
		try {
			await dsrActivityTypeService.bulkDeleteActivityTypes(selectedIds);
			toast.success(`Successfully deleted ${selectedIds.length} activity types`);
			setBulkDeleteConfirmOpen(false);
			setSelectedIds([]);
			dispatch(fetchActivityTypes({ onlyActive: false }));
		} catch (err: any) {
			toast.error(err.response?.data?.detail || 'Failed to bulk delete activity types');
		} finally {
			setDeleting(false);
		}
	};

	const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.checked) {
			setSelectedIds(filteredActivityTypes.map(at => at.public_id));
		} else {
			setSelectedIds([]);
		}
	};

	const handleSelectOne = (publicId: string) => {
		setSelectedIds(prev => 
			prev.includes(publicId) 
				? prev.filter(id => id !== publicId) 
				: [...prev, publicId]
		);
	};

	const handleDownloadTemplate = async () => {
		try {
			await dsrActivityTypeService.downloadTemplate();
		} catch (err: any) {
			toast.error(err.message || 'Failed to download template');
		}
	};

	const handleImportFile = async (file: File) => {
		setImporting(true);
		try {
			const res = await dsrActivityTypeService.importActivityTypes(file);
			setImportResult(res);
			dispatch(fetchActivityTypes({ onlyActive: false }));
			return res;
		} catch (err: any) {
			const errorMsg = err.response?.data?.detail || err.message || 'Import failed';
			toast.error(errorMsg);
		} finally {
			setImporting(false);
		}
	};

	return (
		<Box>
			<Paper sx={{ border: '1px solid #d5dbdb', boxShadow: 'none', borderRadius: '8px', overflow: 'hidden' }}>
				<DSRAdminTableHeader
					title="Activity Taxonomy"
					searchTerm={searchTerm}
					onSearchChange={setSearchTerm}
					onRefresh={() => dispatch(fetchActivityTypes({ onlyActive: false }))}
					placeholder="Search activity types..."
					actions={
						<Box sx={{ display: 'flex', gap: 1 }}>
							{selectedIds.length > 0 && (
								<Button
									startIcon={<DeleteIcon />}
									variant="outlined"
									color="error"
									size="small"
									onClick={() => setBulkDeleteConfirmOpen(true)}
									sx={{
										textTransform: 'none',
										fontWeight: 600,
										height: '36px'
									}}
								>
									Delete ({selectedIds.length})
								</Button>
							)}
							<Button
								startIcon={<ImportIcon />}
								variant="outlined"
								size="small"
								onClick={() => setImportDialogOpen(true)}
								sx={{
									textTransform: 'none',
									fontWeight: 600,
									height: '36px',
									color: '#1a365d',
									borderColor: '#d5dbdb',
									'&:hover': { borderColor: '#1a365d', bgcolor: '#f0f4f8' }
								}}
							>
								Import
							</Button>
							<Button
								startIcon={<AddIcon />}
								variant="contained"
								size="small"
								onClick={() => handleOpenDialog()}
								sx={{
									bgcolor: '#ec7211',
									'&:hover': { bgcolor: '#eb5f07' },
									textTransform: 'none',
									fontWeight: 700,
									boxShadow: 'none',
									height: '36px'
								}}
							>
								Add Activity Type
							</Button>
						</Box>
					}
				/>

				<TableContainer>
					<Table size="small">
							<TableHead sx={{ bgcolor: '#f8fafa' }}>
								<TableRow>
									<TableCell padding="checkbox">
										<Checkbox
											indeterminate={selectedIds.length > 0 && selectedIds.length < filteredActivityTypes.length}
											checked={filteredActivityTypes.length > 0 && selectedIds.length === filteredActivityTypes.length}
											onChange={handleSelectAll}
										/>
									</TableCell>
									<TableCell sx={{ fontWeight: 700, color: '#1a365d' }}>Code</TableCell>
									<TableCell sx={{ fontWeight: 700, color: '#1a365d' }}>Name</TableCell>
									<TableCell sx={{ fontWeight: 700, color: '#1a365d' }}>Category</TableCell>
									<TableCell sx={{ fontWeight: 700, color: '#1a365d' }}>Description</TableCell>
									<TableCell sx={{ fontWeight: 700, color: '#1a365d' }}>Sort</TableCell>
									<TableCell sx={{ fontWeight: 700, color: '#1a365d' }}>Status</TableCell>
									<TableCell align="right" sx={{ fontWeight: 700, color: '#1a365d' }}>Actions</TableCell>
								</TableRow>
							</TableHead>
						<TableBody>
							{loading && activityTypes.length === 0 ? (
								<TableRow>
									<TableCell colSpan={8} align="center" sx={{ py: 4 }}>
										<CircularProgress size={24} />
									</TableCell>
								</TableRow>
							) : filteredActivityTypes.length === 0 ? (
								<TableRow>
									<TableCell colSpan={8} align="center" sx={{ py: 4 }}>
										<Typography variant="body2" color="text.secondary">
											{searchTerm ? 'No results found.' : 'No activity types found.'}
										</Typography>
									</TableCell>
								</TableRow>
							) : (
									filteredActivityTypes.map((type) => (
										<TableRow 
											key={type.public_id} 
											hover
											selected={selectedIds.includes(type.public_id)}
										>
											<TableCell padding="checkbox">
												<Checkbox
													checked={selectedIds.includes(type.public_id)}
													onChange={() => handleSelectOne(type.public_id)}
												/>
											</TableCell>
											<TableCell sx={{ fontWeight: 600, color: '#1a365d' }}>
												{type.code}
										</TableCell>
										<TableCell sx={{ fontWeight: 500 }}>{type.name}</TableCell>
										<TableCell>
											{type.category ? (
												<Chip 
													label={type.category} 
													size="small" 
													sx={{ bgcolor: '#f0f4f8', color: '#1a365d', fontWeight: 600, borderRadius: '4px' }} 
												/>
											) : '-'}
										</TableCell>
										<TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'text.secondary' }}>
											{type.description || '-'}
										</TableCell>
										<TableCell>{type.sort_order}</TableCell>
										<TableCell>
											<Chip
												label={type.is_active ? 'Active' : 'Inactive'}
												size="small"
												color={type.is_active ? 'success' : 'default'}
												variant="outlined"
												sx={{ borderRadius: '4px', fontWeight: 700, fontSize: '0.7rem' }}
											/>
										</TableCell>
										<TableCell align="right">
											<IconButton size="small" onClick={() => handleOpenDialog(type)}>
												<EditIcon fontSize="small" />
											</IconButton>
											<IconButton size="small" onClick={() => handleDeleteClick(type.public_id)} color="error">
												<DeleteIcon fontSize="small" />
											</IconButton>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</TableContainer>
			</Paper>

			<Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
				<DialogTitle sx={{ fontWeight: 700 }}>
					{editingType ? 'Edit Activity Type' : 'Add New Activity Type'}
				</DialogTitle>
				<DialogContent>
					{error && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{error}</Alert>}
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
						<TextField
							label="Name"
							fullWidth
							value={formData.name}
							onChange={(e) => setFormData({ ...formData, name: e.target.value })}
							placeholder="e.g. Meeting"
							required
						/>
						<TextField
							label="Code"
							fullWidth
							value={formData.code}
							onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
							placeholder="e.g. MEETING"
							helperText="Unique identifier for analytics. Will be converted to UPPER_CASE."
							required
							disabled={!!editingType}
						/>
						<TextField
							label="Category"
							fullWidth
							value={formData.category}
							onChange={(e) => setFormData({ ...formData, category: e.target.value })}
							placeholder="e.g. Sourcing, Training, Placement, General"
							helperText="Categorization group name"
						/>
						<TextField
							label="Description"
							fullWidth
							multiline
							rows={2}
							value={formData.description}
							onChange={(e) => setFormData({ ...formData, description: e.target.value })}
						/>
						<TextField
							label="Sort Order"
							type="number"
							fullWidth
							value={formData.sort_order}
							onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
						/>
					</Box>
				</DialogContent>
				<DialogActions sx={{ p: 2, px: 3 }}>
					<Button onClick={handleCloseDialog} startIcon={<CancelIcon />}>Cancel</Button>
					<Button
						onClick={handleSave}
						variant="contained"
						startIcon={<SaveIcon />}
						disabled={loading}
						sx={{ bgcolor: '#ec7211', '&:hover': { bgcolor: '#eb5f07' } }}
					>
						{loading ? 'Saving...' : 'Save Type'}
					</Button>
				</DialogActions>
			</Dialog>

			<ImportDialog
				open={importDialogOpen}
				onClose={() => setImportDialogOpen(false)}
				onImport={handleImportFile}
				title="Import Activity Types"
				subtitle="Upload a CSV file to bulk-import or update activity types. Ensure the columns match the template."
				onDownloadTemplate={handleDownloadTemplate}
				acceptedFiles=".csv"
				loading={importing}
				result={importResult}
				onResetResult={() => setImportResult(null)}
			/>

			<ConfirmationDialog
				open={deleteConfirmOpen}
				onClose={() => setDeleteConfirmOpen(false)}
				onConfirm={handleConfirmDelete}
				title="Confirm Delete"
				message="Are you sure you want to delete this activity type? This will move it to the inactive list."
				confirmLabel="Delete"
				severity="error"
				loading={deleting}
			/>

			<ConfirmationDialog
				open={bulkDeleteConfirmOpen}
				onClose={() => setBulkDeleteConfirmOpen(false)}
				onConfirm={handleConfirmBulkDelete}
				title="Confirm Bulk Delete"
				message={`Are you sure you want to delete ${selectedIds.length} activity types? This will move them to the inactive list.`}
				confirmLabel={`Delete ${selectedIds.length} items`}
				severity="error"
				loading={deleting}
			/>
		</Box>
	);
};

export default DSRActivityTypeManagement;
