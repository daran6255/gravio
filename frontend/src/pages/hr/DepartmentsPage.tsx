import React, { useState, useEffect } from 'react';
import {
	Box, Typography, Button, Card, CardContent, Grid, Chip,
	IconButton, Tooltip, TextField, Dialog, DialogTitle,
	DialogContent, DialogActions, Stack, Divider, Avatar,
	Skeleton, alpha, useTheme, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import {
	Add as AddIcon,
	AccountTreeOutlined as DeptIcon,
	Edit as EditIcon,
	Delete as DeleteIcon,
	PeopleAlt as PeopleIcon,
	WorkOutlined as DesignationIcon,
	PersonOutlined as HODIcon,
} from '@mui/icons-material';
import HRLayout from '../../components/hr/HRLayout';
import { hrDepartmentApi } from '../../services/hrService';
import type { HRDepartmentListItem, HRDepartmentCreate, HRDepartmentUpdate } from '../../models/hr';
import useToast from '../../hooks/useToast';

// ---------------------------------------------------------------------------
// Create / Edit Dialog
// ---------------------------------------------------------------------------

interface DepartmentDialogProps {
	open: boolean;
	onClose: () => void;
	onSave: () => void;
	existing?: HRDepartmentListItem | null;
	departments: HRDepartmentListItem[];
}

const DepartmentDialog: React.FC<DepartmentDialogProps> = ({ open, onClose, onSave, existing, departments }) => {
	const { success, error } = useToast();
	const [saving, setSaving] = useState(false);
	const [form, setForm] = useState<HRDepartmentCreate>({
		name: '',
		description: '',
		parent_id: null,
		head_user_id: null,
	});

	useEffect(() => {
		if (existing) {
			setForm({
				name: existing.name,
				description: existing.description || '',
				parent_id: existing.parent_id,
				head_user_id: existing.head_user_id,
			});
		} else {
			setForm({ name: '', description: '', parent_id: null, head_user_id: null });
		}
	}, [existing, open]);

	const handleSave = async () => {
		if (!form.name.trim()) return;
		setSaving(true);
		try {
			if (existing) {
				await hrDepartmentApi.update(existing.id, { ...form } as HRDepartmentUpdate);
				success('Department updated');
			} else {
				await hrDepartmentApi.create(form);
				success('Department created');
			}
			onSave();
			onClose();
		} catch (e: any) {
			error(e?.response?.data?.detail || 'Failed to save department');
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
			<DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
				{existing ? 'Edit Department' : 'Create Department'}
			</DialogTitle>
			<DialogContent sx={{ pt: 1 }}>
				<Stack spacing={2.5} sx={{ mt: 1 }}>
					<TextField
						label="Department Name"
						required
						fullWidth
						value={form.name}
						onChange={(e) => setForm({ ...form, name: e.target.value })}
					/>
					<TextField
						label="Description"
						fullWidth
						multiline
						rows={2}
						value={form.description}
						onChange={(e) => setForm({ ...form, description: e.target.value })}
					/>
					<FormControl fullWidth>
						<InputLabel>Parent Department</InputLabel>
						<Select
							value={form.parent_id || ''}
							label="Parent Department"
							onChange={(e) => setForm({ ...form, parent_id: e.target.value as number | null || null })}
						>
							<MenuItem value="">None (Top-level)</MenuItem>
							{departments
								.filter((d) => d.id !== existing?.id)
								.map((d) => (
									<MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
								))}
						</Select>
					</FormControl>
				</Stack>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2.5 }}>
				<Button onClick={onClose} disabled={saving}>Cancel</Button>
				<Button
					variant="contained"
					onClick={handleSave}
					disabled={saving || !form.name.trim()}
				>
					{saving ? 'Saving…' : existing ? 'Update' : 'Create'}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

// ---------------------------------------------------------------------------
// Department Card
// ---------------------------------------------------------------------------

interface DepartmentCardProps {
	dept: HRDepartmentListItem;
	onEdit: () => void;
	onDelete: () => void;
}

const DepartmentCard: React.FC<DepartmentCardProps> = ({ dept, onEdit, onDelete }) => {
	const theme = useTheme();
	return (
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
			<CardContent sx={{ p: 2.5 }}>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
					<Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flex: 1 }}>
						<Avatar
							sx={{
								width: 40, height: 40,
								bgcolor: alpha(theme.palette.primary.main, 0.12),
								color: 'primary.main',
							}}
						>
							<DeptIcon sx={{ fontSize: '1.1rem' }} />
						</Avatar>
						<Box>
							<Typography variant="subtitle2" fontWeight={700}>{dept.name}</Typography>
							{dept.description && (
								<Typography variant="caption" color="text.secondary" noWrap>
									{dept.description}
								</Typography>
							)}
						</Box>
					</Box>
					<Box>
						<Tooltip title="Edit">
							<IconButton size="small" onClick={onEdit}>
								<EditIcon sx={{ fontSize: '1rem' }} />
							</IconButton>
						</Tooltip>
						<Tooltip title="Delete">
							<IconButton size="small" color="error" onClick={onDelete}>
								<DeleteIcon sx={{ fontSize: '1rem' }} />
							</IconButton>
						</Tooltip>
					</Box>
				</Box>

				<Divider sx={{ my: 1.5 }} />

				<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
						<PeopleIcon sx={{ fontSize: '0.85rem', color: 'text.disabled' }} />
						<Typography variant="caption" color="text.secondary">
							<strong>{dept.employee_count ?? 0}</strong> employees
						</Typography>
					</Box>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
						<DesignationIcon sx={{ fontSize: '0.85rem', color: 'text.disabled' }} />
						<Typography variant="caption" color="text.secondary">
							<strong>{dept.designation_count ?? 0}</strong> designations
						</Typography>
					</Box>
					{dept.head_user_name && (
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
							<HODIcon sx={{ fontSize: '0.85rem', color: 'text.disabled' }} />
							<Typography variant="caption" color="text.secondary">
								HOD: <strong>{dept.head_user_name}</strong>
							</Typography>
						</Box>
					)}
				</Box>

				{!dept.is_active && (
					<Chip label="Inactive" size="small" color="default" sx={{ mt: 1.5, height: 18, fontSize: '0.65rem' }} />
				)}
			</CardContent>
		</Card>
	);
};

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const DepartmentsPage: React.FC = () => {
	const theme = useTheme();
	const { success, error } = useToast();
	const [departments, setDepartments] = useState<HRDepartmentListItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<HRDepartmentListItem | null>(null);

	const fetchDepartments = async () => {
		setLoading(true);
		try {
			const data = await hrDepartmentApi.list(true);
			setDepartments(data);
		} catch {
			error('Failed to load departments');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { fetchDepartments(); }, []);

	const handleDelete = async (dept: HRDepartmentListItem) => {
		if (!window.confirm(`Delete "${dept.name}"? This cannot be undone.`)) return;
		try {
			await hrDepartmentApi.delete(dept.id);
			success('Department deleted');
			fetchDepartments();
		} catch {
			error('Failed to delete department');
		}
	};

	const headerActions = (
		<Button
			variant="contained"
			startIcon={<AddIcon />}
			size="small"
			onClick={() => { setEditTarget(null); setDialogOpen(true); }}
			sx={{ fontWeight: 600 }}
		>
			New Department
		</Button>
	);

	return (
		<HRLayout
			title="Departments"
			subtitle={`${departments.length} department${departments.length !== 1 ? 's' : ''} configured`}
			actions={headerActions}
		>
			{loading ? (
				<Grid container spacing={2}>
					{Array.from({ length: 6 }).map((_, i) => (
						<Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
							<Skeleton variant="rounded" height={140} />
						</Grid>
					))}
				</Grid>
			) : departments.length === 0 ? (
				<Box
					sx={{
						textAlign: 'center', py: 10,
						borderRadius: 3,
						border: `2px dashed ${alpha(theme.palette.divider, 0.6)}`,
					}}
				>
					<DeptIcon sx={{ fontSize: '3rem', color: 'text.disabled', mb: 2 }} />
					<Typography variant="h6" fontWeight={600} gutterBottom>No departments yet</Typography>
					<Typography variant="body2" color="text.secondary" mb={3}>
						Create your first department to structure your organization.
					</Typography>
					<Button
						variant="contained"
						startIcon={<AddIcon />}
						onClick={() => { setEditTarget(null); setDialogOpen(true); }}
					>
						Create Department
					</Button>
				</Box>
			) : (
				<Grid container spacing={2}>
					{departments.map((dept) => (
						<Grid size={{ xs: 12, sm: 6, md: 4 }} key={dept.id}>
							<DepartmentCard
								dept={dept}
								onEdit={() => { setEditTarget(dept); setDialogOpen(true); }}
								onDelete={() => handleDelete(dept)}
							/>
						</Grid>
					))}
				</Grid>
			)}

			<DepartmentDialog
				open={dialogOpen}
				onClose={() => { setDialogOpen(false); setEditTarget(null); }}
				onSave={fetchDepartments}
				existing={editTarget}
				departments={departments}
			/>
		</HRLayout>
	);
};

export default DepartmentsPage;
