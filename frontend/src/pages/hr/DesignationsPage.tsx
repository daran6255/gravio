import React, { useState, useEffect } from 'react';
import {
	Box, Typography, Button, Card, CardContent, Grid, Chip,
	IconButton, Tooltip, TextField, Dialog, DialogTitle,
	DialogContent, DialogActions, Stack, Skeleton,
	FormControl, InputLabel, Select, MenuItem, alpha, useTheme
} from '@mui/material';
import {
	Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
	WorkOutlined as DesignationIcon,
} from '@mui/icons-material';
import HRLayout from '../../components/hr/HRLayout';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchDesignations, createDesignation, updateDesignation, deleteDesignation, fetchDepartments } from '../../store/slices/hrSlice';
import type { HRDesignationListItem, HRDesignationCreate, HRDepartmentListItem } from '../../models/hr';
import useToast from '../../hooks/useToast';

// ---------------------------------------------------------------------------
// Create / Edit Dialog
// ---------------------------------------------------------------------------

interface DesignationDialogProps {
	open: boolean;
	onClose: () => void;
	existing?: HRDesignationListItem | null;
	departments: HRDepartmentListItem[];
}

const DesignationDialog: React.FC<DesignationDialogProps> = ({ open, onClose, existing, departments }) => {
	const dispatch = useAppDispatch();
	const { success, error } = useToast();
	const [saving, setSaving] = useState(false);
	const [form, setForm] = useState<HRDesignationCreate>({
		name: '', department_id: null, grade: '', description: ''
	});

	useEffect(() => {
		if (existing) {
			setForm({
				name: existing.name,
				department_id: existing.department_id,
				grade: existing.grade || '',
				description: '',
			});
		} else {
			setForm({ name: '', department_id: null, grade: '', description: '' });
		}
	}, [existing, open]);

	const handleSave = async () => {
		if (!form.name.trim()) return;
		setSaving(true);
		try {
			if (existing) {
				await dispatch(updateDesignation({ id: existing.id, payload: form })).unwrap();
				success('Designation updated');
			} else {
				await dispatch(createDesignation(form)).unwrap();
				success('Designation created');
			}
			onClose();
		} catch (e: any) {
			error(e || 'Failed to save designation');
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
			<DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
				{existing ? 'Edit Designation' : 'Create Designation'}
			</DialogTitle>
			<DialogContent>
				<Stack spacing={2.5} sx={{ mt: 1 }}>
					<TextField
						label="Designation Name"
						required fullWidth
						value={form.name}
						onChange={(e) => setForm({ ...form, name: e.target.value })}
					/>
					<FormControl fullWidth>
						<InputLabel>Department</InputLabel>
						<Select
							value={form.department_id || ''}
							label="Department"
							onChange={(e) => setForm({ ...form, department_id: e.target.value as number | null || null })}
						>
							<MenuItem value="">None</MenuItem>
							{departments.map((d) => (
								<MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
							))}
						</Select>
					</FormControl>
					<TextField
						label="Grade / Level (e.g. L1, L2, Senior)"
						fullWidth
						value={form.grade}
						onChange={(e) => setForm({ ...form, grade: e.target.value })}
					/>
					<TextField
						label="Description"
						fullWidth multiline rows={2}
						value={form.description}
						onChange={(e) => setForm({ ...form, description: e.target.value })}
					/>
				</Stack>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2.5 }}>
				<Button onClick={onClose} disabled={saving}>Cancel</Button>
				<Button variant="contained" onClick={handleSave} disabled={saving || !form.name.trim()}>
					{saving ? 'Saving…' : existing ? 'Update' : 'Create'}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const DesignationsPage: React.FC = () => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const { error, success } = useToast();
	const { designations, designationsLoading: loading, departments } = useAppSelector((state) => state.hr);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<HRDesignationListItem | null>(null);
	const [deptFilter, setDeptFilter] = useState<number | ''>('');

	useEffect(() => {
		dispatch(fetchDepartments(undefined));
	}, [dispatch]);

	useEffect(() => {
		dispatch(fetchDesignations(deptFilter as number | undefined)).unwrap().catch(() => error('Failed to load designations'));
	}, [dispatch, deptFilter]);

	const handleDelete = async (d: HRDesignationListItem) => {
		if (!window.confirm(`Delete "${d.name}"?`)) return;
		try {
			await dispatch(deleteDesignation(d.id)).unwrap();
			success('Designation deleted');
		} catch {
			error('Failed to delete designation');
		}
	};

	const headerActions = (
		<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
			<FormControl size="small" sx={{ minWidth: 180 }}>
				<InputLabel>Filter by Department</InputLabel>
				<Select
					value={deptFilter}
					label="Filter by Department"
					onChange={(e) => setDeptFilter(e.target.value as number | '')}
				>
					<MenuItem value="">All Departments</MenuItem>
					{departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
				</Select>
			</FormControl>
			<Button
				variant="contained"
				startIcon={<AddIcon />}
				size="small"
				onClick={() => { setEditTarget(null); setDialogOpen(true); }}
				sx={{ fontWeight: 600 }}
			>
				New Designation
			</Button>
		</Box>
	);

	return (
		<HRLayout
			title="Designations"
			subtitle={`${designations.length} designation${designations.length !== 1 ? 's' : ''} defined`}
			actions={headerActions}
		>
			{loading ? (
				<Grid container spacing={2}>
					{Array.from({ length: 8 }).map((_, i) => (
						<Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={i}>
							<Skeleton variant="rounded" height={100} />
						</Grid>
					))}
				</Grid>
			) : designations.length === 0 ? (
				<Box
					sx={{
						textAlign: 'center', py: 10,
						borderRadius: 3,
						border: `2px dashed ${alpha(theme.palette.divider, 0.6)}`,
					}}
				>
					<DesignationIcon sx={{ fontSize: '3rem', color: 'text.disabled', mb: 2 }} />
					<Typography variant="h6" fontWeight={600} gutterBottom>No designations yet</Typography>
					<Typography variant="body2" color="text.secondary" mb={3}>
						{deptFilter ? 'No designations in this department.' : 'Define job designations to assign to employees.'}
					</Typography>
					{!deptFilter && (
						<Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditTarget(null); setDialogOpen(true); }}>
							Create Designation
						</Button>
					)}
				</Box>
			) : (
				<Grid container spacing={2}>
					{designations.map((d) => (
						<Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={d.id}>
							<Card
								sx={{
									border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
									transition: 'all 0.18s ease',
									'&:hover': {
										boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.08)}`,
										borderColor: alpha(theme.palette.primary.main, 0.25),
									},
								}}
							>
								<CardContent sx={{ p: 2 }}>
									<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
										<Box>
											<Typography variant="subtitle2" fontWeight={700}>{d.name}</Typography>
											{d.department_name && (
												<Chip
													label={d.department_name}
													size="small"
													variant="outlined"
													sx={{ mt: 0.5, height: 18, fontSize: '0.65rem' }}
												/>
											)}
											{d.grade && (
												<Typography variant="caption" color="text.disabled" display="block" mt={0.5}>
													Grade: {d.grade}
												</Typography>
											)}
										</Box>
										<Box>
											<Tooltip title="Edit">
												<IconButton size="small" onClick={() => { setEditTarget(d); setDialogOpen(true); }}>
													<EditIcon sx={{ fontSize: '0.9rem' }} />
												</IconButton>
											</Tooltip>
											<Tooltip title="Delete">
												<IconButton size="small" color="error" onClick={() => handleDelete(d)}>
													<DeleteIcon sx={{ fontSize: '0.9rem' }} />
												</IconButton>
											</Tooltip>
										</Box>
									</Box>
								</CardContent>
							</Card>
						</Grid>
					))}
				</Grid>
			)}

			<DesignationDialog
				open={dialogOpen}
				onClose={() => { setDialogOpen(false); setEditTarget(null); }}
				existing={editTarget}
				departments={departments}
			/>
		</HRLayout>
	);
};

export default DesignationsPage;
