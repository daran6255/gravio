import React, { useState, useEffect } from 'react';
import {
	Box,
	Typography,
	Button,
	Paper,
	Stack,
	CircularProgress,
	Chip,
	IconButton,
	useTheme,
	alpha,
	Tooltip,
	Divider
} from '@mui/material';
import {
	Add as AddIcon,
	Delete as DeleteIcon,
	DragIndicator as DragIcon,
	EditOutlined as EditIcon,
	LayersOutlined as LayersIcon
} from '@mui/icons-material';
import { settingsService, type DynamicField } from '../../../services/settingsService';
import { useSnackbar } from 'notistack';
import FieldDialog from './FieldDialog';
import { ConfirmationDialog } from '../../common/dialogbox';

interface DynamicFieldsSectionProps {
	entityType: 'screening' | 'counseling';
}

const DynamicFieldsSection: React.FC<DynamicFieldsSectionProps> = ({ entityType }) => {
	const theme = useTheme();
	const { enqueueSnackbar } = useSnackbar();
	const [fields, setFields] = useState<DynamicField[]>([]);
	const [loading, setLoading] = useState(false);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingField, setEditingField] = useState<DynamicField | null>(null);
	const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
	const [fieldToDelete, setFieldToDelete] = useState<number | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);

	const fieldTypeLabels: Record<string, string> = {
		text: 'Short Text',
		textarea: 'Long Paragraph',
		number: 'Number/Numeric',
		single_choice: 'Drop-down Selection',
		multiple_choice: 'Multi-select Checkboxes',
		phone_number: 'Phone Number'
	};

	useEffect(() => {
		loadFields();
	}, [entityType]);

	const loadFields = async () => {
		setLoading(true);
		try {
			const data = await settingsService.getFields(entityType);
			setFields(data);
		} catch (error) {
			console.error('Failed to load fields:', error);
			enqueueSnackbar('Failed to load dynamic fields', { variant: 'error' });
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = (id: number) => {
		setFieldToDelete(id);
		setConfirmDeleteOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (fieldToDelete === null) return;

		setDeleteLoading(true);
		try {
			await settingsService.deleteField(fieldToDelete);
			enqueueSnackbar('Field deleted successfully', { variant: 'success' });
			loadFields();
			setConfirmDeleteOpen(false);
		} catch (error) {
			enqueueSnackbar('Failed to delete field', { variant: 'error' });
		} finally {
			setDeleteLoading(false);
			setFieldToDelete(null);
		}
	};

	return (
		<Box>
			<Box sx={{
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'flex-start',
				mb: 4,
				pb: 3,
				borderBottom: '1px solid #f2f3f3'
			}}>
				<Box>
					<Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1c21', mb: 0.5 }}>
						Manage {entityType.charAt(0).toUpperCase() + entityType.slice(1)} Fields
					</Typography>
					<Typography variant="body2" sx={{ color: '#64748b' }}>
						Define custom fields for the {entityType} process. These will automatically appear in data entry forms.
					</Typography>
				</Box>
				<Button
					variant="contained"
					disableElevation
					startIcon={<AddIcon />}
					onClick={() => {
						setEditingField(null);
						setDialogOpen(true);
					}}
					sx={{
						bgcolor: theme.palette.primary.main,
						borderRadius: '6px',
						textTransform: 'none',
						fontWeight: 600,
						px: 2.5,
						py: 1
					}}
				>
					Add New Field
				</Button>
			</Box>

			{loading ? (
				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 12, gap: 2 }}>
					<CircularProgress size={36} thickness={4} />
					<Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
						Syncing fields...
					</Typography>
				</Box>
			) : (
				<Stack spacing={1.5}>
					{fields.length === 0 ? (
						<Paper
							elevation={0}
							sx={{
								p: 8,
								textAlign: 'center',
								bgcolor: '#fcfcfc',
								border: '2px dashed #e2e8f0',
								borderRadius: '8px',
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: 2
							}}
						>
							<LayersIcon sx={{ fontSize: '3rem', color: '#cbd5e1' }} />
							<Box>
								<Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#475569' }}>
									No custom fields yet
								</Typography>
								<Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, maxWidth: 300 }}>
									Get started by adding fields like "Preferred Interview Date" or "Language Proficiency".
								</Typography>
							</Box>
							<Button
								variant="outlined"
								size="small"
								onClick={() => setDialogOpen(true)}
								sx={{ mt: 1, borderRadius: '6px', textTransform: 'none', fontWeight: 600 }}
							>
								Add First Field
							</Button>
						</Paper>
					) : (
						fields.map((field: DynamicField) => (
							<Paper
								key={field.id}
								elevation={0}
								sx={{
									p: 2.5,
									borderRadius: '8px',
									display: 'flex',
									alignItems: 'center',
									border: '1px solid #e2e8f0',
									bgcolor: '#ffffff',
									'&:hover': {
										borderColor: theme.palette.primary.main,
										boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
										'& .drag-icon': { color: theme.palette.primary.main }
									},
									transition: 'all 0.2s ease'
								}}
							>
								<Tooltip title="Drag to reorder">
									<DragIcon className="drag-icon" sx={{ color: '#cbd5e1', cursor: 'grab', mr: 2.5 }} />
								</Tooltip>

								<Box sx={{ flexGrow: 1 }}>
									<Stack direction="row" spacing={1.5} alignItems="center">
										<Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>
											{field.label}
										</Typography>
										{field.is_required && (
											<Chip
												label="Required"
												size="small"
												sx={{
													height: 20,
													fontSize: '0.65rem',
													fontWeight: 700,
													bgcolor: alpha(theme.palette.error.main, 0.1),
													color: theme.palette.error.main,
													borderRadius: '4px'
												}}
											/>
										)}
									</Stack>

									<Stack direction="row" spacing={2} sx={{ mt: 1, alignItems: 'center' }}>
										<Chip
											label={fieldTypeLabels[field.field_type] || field.field_type}
											size="small"
											variant="outlined"
											sx={{
												borderRadius: '4px',
												height: 22,
												fontSize: '0.75rem',
												borderColor: '#e2e8f0',
												color: '#64748b',
												fontWeight: 500,
												bgcolor: '#f8fafc'
											}}
										/>
										<Typography variant="caption" sx={{ color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
											ID: <span style={{ color: '#64748b', fontWeight: 600, marginLeft: '4px' }}>{field.name}</span>
										</Typography>
										<Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto' }} />
										<Typography variant="caption" sx={{ color: '#94a3b8' }}>
											Order: <span style={{ color: '#64748b', fontWeight: 600 }}>{field.order}</span>
										</Typography>
									</Stack>
								</Box>

								<Stack direction="row" spacing={1}>
									<Tooltip title="Edit Field">
										<IconButton
											size="small"
											onClick={() => {
												setEditingField(field);
												setDialogOpen(true);
											}}
											sx={{ color: '#64748b', '&:hover': { color: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.05) } }}
										>
											<EditIcon fontSize="small" />
										</IconButton>
									</Tooltip>
									<Tooltip title="Delete Field">
										<IconButton
											size="small"
											onClick={() => handleDelete(field.id)}
											sx={{ color: '#94a3b8', '&:hover': { color: theme.palette.error.main, bgcolor: alpha(theme.palette.error.main, 0.05) } }}
										>
											<DeleteIcon fontSize="small" />
										</IconButton>
									</Tooltip>
								</Stack>
							</Paper>
						))
					)}
				</Stack>
			)}

			<FieldDialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				onSave={loadFields}
				editingField={editingField}
				entityType={entityType}
				nextOrder={fields.length}
			/>

			<ConfirmationDialog
				open={confirmDeleteOpen}
				title="Delete Custom Field"
				message="Are you sure you want to delete this custom field? This action will hide this field from future screening/counseling entries. Existing data will be preserved but the field will no longer be visible."
				onClose={() => setConfirmDeleteOpen(false)}
				onConfirm={handleConfirmDelete}
				confirmLabel="Delete Field"
				loading={deleteLoading}
				severity="error"
			/>
		</Box>
	);
};

export default DynamicFieldsSection;
