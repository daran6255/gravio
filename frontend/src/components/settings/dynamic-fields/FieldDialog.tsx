import React, { useState, useEffect } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	MenuItem,
	Stack,
	Box,
	Typography,
	Switch,
	Autocomplete,
	Chip,
	Button,
	IconButton,
	useTheme,
	alpha
} from '@mui/material';
import {
	Close as CloseIcon,
	InfoOutlined as InfoIcon
} from '@mui/icons-material';
import { settingsService, type DynamicField, type DynamicFieldCreate } from '../../../services/settingsService';
import { useSnackbar } from 'notistack';

interface FieldDialogProps {
	open: boolean;
	onClose: () => void;
	onSave: () => void;
	editingField: DynamicField | null;
	entityType: 'screening' | 'counseling';
	nextOrder: number;
}

const FieldDialog: React.FC<FieldDialogProps> = ({
	open,
	onClose,
	onSave,
	editingField,
	entityType,
	nextOrder
}) => {
	const theme = useTheme();
	const { enqueueSnackbar } = useSnackbar();
	const [optionInputValue, setOptionInputValue] = useState('');
	const [newField, setNewField] = useState<DynamicFieldCreate>({
		entity_type: entityType,
		name: '',
		label: '',
		field_type: 'text',
		options: [],
		is_required: false,
		order: nextOrder
	});

	const fieldTypes = ['text', 'textarea', 'number', 'single_choice', 'multiple_choice', 'phone_number'] as const;
	const fieldTypeLabels: Record<string, string> = {
		text: 'Short Text',
		textarea: 'Long Paragraph',
		number: 'Number/Numeric',
		single_choice: 'Drop-down Selection',
		multiple_choice: 'Multi-select Checkboxes',
		phone_number: 'Phone Number'
	};

	useEffect(() => {
		if (open) {
			if (editingField) {
				setNewField({
					entity_type: editingField.entity_type,
					name: editingField.name,
					label: editingField.label,
					field_type: editingField.field_type as any,
					options: editingField.options || [],
					is_required: editingField.is_required,
					order: editingField.order
				});
			} else {
				setNewField({
					entity_type: entityType,
					name: '',
					label: '',
					field_type: 'text',
					options: [],
					is_required: false,
					order: nextOrder
				});
			}
			setOptionInputValue('');
		}
	}, [open, editingField, entityType, nextOrder]);

	const handleSave = async () => {
		try {
			if (!newField.name || !newField.label) {
				enqueueSnackbar('Name and Label are required', { variant: 'warning' });
				return;
			}

			if (editingField) {
				await settingsService.updateField(editingField.id, newField);
				enqueueSnackbar('Field updated successfully', { variant: 'success' });
			} else {
				await settingsService.createField(newField);
				enqueueSnackbar('Field created successfully', { variant: 'success' });
			}
			onSave();
			onClose();
		} catch (error) {
			console.error('Failed to save field:', error);
			enqueueSnackbar('Failed to save field', { variant: 'error' });
		}
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="sm"
			fullWidth
			PaperProps={{
				sx: {
					borderRadius: '8px',
					boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
				}
			}}
		>
			<DialogTitle sx={{
				fontWeight: 700,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				py: 2,
				px: 3,
				borderBottom: '1px solid #f2f3f3'
			}}>
				<Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.125rem' }}>
					{editingField ? 'Edit Field' : 'Create New Dynamic Field'}
				</Typography>
				<IconButton size="small" onClick={onClose} sx={{ color: '#64748b' }}>
					<CloseIcon fontSize="small" />
				</IconButton>
			</DialogTitle>

			<DialogContent sx={{ p: 4 }}>
				<Stack spacing={3.5}>
					<Box>
						<Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#334155' }}>
							Field Label
						</Typography>
						<TextField
							fullWidth
							size="small"
							placeholder="e.g., Father's Name"
							value={newField.label}
							onChange={(e) => {
								const label = e.target.value;
								const name = label.toLowerCase()
									.replace(/[^a-z0-9\s]/g, '')
									.replace(/\s+/g, '_');
								setNewField({
									...newField,
									label: label,
									name: editingField ? newField.name : name
								});
							}}
							sx={{
								'& .MuiOutlinedInput-root': { borderRadius: '6px' }
							}}
						/>
						<Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: '#64748b' }}>
							This is the question or label users will see.
						</Typography>
					</Box>

					<Box sx={{
						p: 1.5,
						bgcolor: '#f8fafc',
						borderRadius: '6px',
						border: '1px solid #e2e8f0',
						display: 'flex',
						alignItems: 'flex-start',
						gap: 1.5
					}}>
						<InfoIcon sx={{ color: '#3b82f6', fontSize: '1.25rem', mt: 0.25 }} />
						<Box>
							<Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', display: 'block' }}>
								Technical Information
							</Typography>
							<Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
								Database Key: <strong style={{ color: '#1e293b' }}>{newField.name || '...'}</strong>
							</Typography>
							{editingField && (
								<Typography variant="caption" sx={{ color: '#ef4444', display: 'block', mt: 0.5, fontWeight: 500 }}>
									Key cannot be modified after creation.
								</Typography>
							)}
						</Box>
					</Box>

					<Box>
						<Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#334155' }}>
							Field Type
						</Typography>
						<TextField
							select
							fullWidth
							size="small"
							value={newField.field_type}
							onChange={(e) => setNewField({ ...newField, field_type: e.target.value as any })}
							sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
						>
							{fieldTypes.map((type) => (
								<MenuItem key={type} value={type} sx={{ py: 1, fontSize: '0.875rem' }}>
									{fieldTypeLabels[type]}
								</MenuItem>
							))}
						</TextField>
					</Box>

					{(newField.field_type === 'single_choice' || newField.field_type === 'multiple_choice') && (
						<Box>
							<Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#334155' }}>
								Options Configuration
							</Typography>
							<Autocomplete
								multiple
								freeSolo
								options={[]}
								value={newField.options || []}
								inputValue={optionInputValue}
								onInputChange={(_e, newInputValue) => setOptionInputValue(newInputValue)}
								onChange={(_e, newValue) => setNewField({ ...newField, options: newValue as string[] })}
								renderTags={(value: string[], getTagProps) =>
									value.map((option: string, index: number) => (
										<Chip
											variant="filled"
											label={option}
											{...getTagProps({ index })}
											size="small"
											sx={{
												borderRadius: '4px',
												bgcolor: alpha(theme.palette.primary.main, 0.1),
												color: theme.palette.primary.main,
												fontWeight: 500
											}}
										/>
									))
								}
								renderInput={(params) => (
									<TextField
										{...params}
										placeholder="Add option and press Enter"
										size="small"
										onKeyDown={(e) => {
											if (e.key === ',') {
												e.preventDefault();
												const val = optionInputValue.trim();
												if (val && !newField.options?.includes(val)) {
													setNewField({
														...newField,
														options: [...(newField.options || []), val]
													});
													setOptionInputValue('');
												}
											}
										}}
										sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
									/>
								)}
							/>
						</Box>
					)}

					<Stack direction="row" spacing={4} alignItems="center">
						<Box sx={{ flexGrow: 1 }}>
							<Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#334155' }}>
								Required Field
							</Typography>
							<Typography variant="caption" sx={{ color: '#64748b' }}>
								If enabled, users must fill this field.
							</Typography>
						</Box>
						<Switch
							size="small"
							checked={newField.is_required}
							onChange={(e) => setNewField({ ...newField, is_required: e.target.checked })}
						/>
					</Stack>

					<Box>
						<Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#334155' }}>
							Display Sequence
						</Typography>
						<TextField
							type="number"
							fullWidth
							size="small"
							value={newField.order}
							onChange={(e) => setNewField({ ...newField, order: parseInt(e.target.value) || 0 })}
							sx={{
								maxWidth: 120,
								'& .MuiOutlinedInput-root': { borderRadius: '6px' }
							}}
						/>
					</Box>
				</Stack>
			</DialogContent>

			<DialogActions sx={{ p: 3, borderTop: '1px solid #f2f3f3', gap: 1.5 }}>
				<Button
					variant="text"
					onClick={onClose}
					sx={{
						textTransform: 'none',
						color: '#64748b',
						fontWeight: 600,
						'&:hover': { bgcolor: '#f8fafc' }
					}}
				>
					Cancel
				</Button>
				<Button
					variant="contained"
					disableElevation
					onClick={handleSave}
					sx={{
						bgcolor: theme.palette.primary.main,
						borderRadius: '6px',
						textTransform: 'none',
						fontWeight: 600,
						px: 4,
						py: 1
					}}
				>
					{editingField ? 'Save Changes' : 'Create Field'}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default FieldDialog;
