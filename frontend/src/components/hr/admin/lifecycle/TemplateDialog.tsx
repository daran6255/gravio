import React, { useEffect, useState } from 'react';
import {
	Box, Button, Chip, FormControl, Grid, IconButton, InputLabel, MenuItem,
	Select, Stack, TextField, Typography, alpha, useTheme,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import BaseDialog from '../../../common/dialogbox/BaseDialog';
import { useAppDispatch } from '../../../../store/hooks';
import { createChecklistTemplate, updateChecklistTemplate } from '../../../../store/slices/hrSlice';
import type { ChecklistType, HRChecklistTemplate } from '../../../../models/hr';
import useToast from '../../../../hooks/useToast';

interface TemplateTask {
	id: string;
	title: string;
	role_required: string;
	due_days?: number | null;
}

interface TemplateDialogProps {
	open: boolean;
	onClose: () => void;
	onSaved: () => void;
	existing: HRChecklistTemplate | null;
}

const ROLE_OPTIONS = [
	{ value: 'hr_admin', label: 'HR Admin' },
	{ value: 'hr_manager', label: 'HR Manager' },
	{ value: 'admin', label: 'System Admin' },
	{ value: 'manager', label: 'Reporting Manager' },
];

const TemplateDialog: React.FC<TemplateDialogProps> = ({ open, onClose, onSaved, existing }) => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const { success, error } = useToast();
	const isEditing = !!existing;

	const [name, setName] = useState('');
	const [type, setType] = useState<ChecklistType>('onboarding');
	const [tasks, setTasks] = useState<TemplateTask[]>([]);
	const [newTaskTitle, setNewTaskTitle] = useState('');
	const [newTaskRole, setNewTaskRole] = useState('hr_manager');
	const [newTaskDueDays, setNewTaskDueDays] = useState('');
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (open) {
			if (existing) {
				setName(existing.name);
				setType(existing.checklist_type);
				setTasks(existing.tasks);
			} else {
				setName('');
				setType('onboarding');
				setTasks([]);
			}
			setNewTaskTitle('');
			setNewTaskRole('hr_manager');
			setNewTaskDueDays('');
		}
	}, [open, existing]);

	const handleAddTask = () => {
		if (!newTaskTitle.trim()) return;
		const id = `task_${Date.now()}`;
		const due_days = newTaskDueDays.trim() ? parseInt(newTaskDueDays, 10) : undefined;
		setTasks([...tasks, { id, title: newTaskTitle.trim(), role_required: newTaskRole, due_days }]);
		setNewTaskTitle('');
		setNewTaskDueDays('');
	};

	const handleRemoveTask = (idx: number) => {
		setTasks(tasks.filter((_, i) => i !== idx));
	};

	const handleSave = async () => {
		if (!name.trim()) return;
		setSaving(true);
		try {
			const payload = {
				name: name.trim(),
				checklist_type: type,
				tasks,
				is_active: existing ? existing.is_active : true,
			};
			if (existing) {
				await dispatch(updateChecklistTemplate({ id: existing.id, payload })).unwrap();
				success('Template updated successfully');
			} else {
				await dispatch(createChecklistTemplate(payload)).unwrap();
				success('Template created successfully');
			}
			onSaved();
			onClose();
		} catch (e: any) {
			error(e || 'Failed to save template');
		} finally {
			setSaving(false);
		}
	};

	return (
		<BaseDialog
			open={open}
			onClose={onClose}
			title={isEditing ? 'Edit Template' : 'New Checklist Template'}
			subtitle="Define the tasks required to complete this lifecycle stage"
			maxWidth="md"
			loading={saving}
			actions={
				<>
					<Button onClick={onClose} disabled={saving} sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px', color: 'text.secondary' }}>
						Cancel
					</Button>
					<Button
						variant="contained"
						onClick={handleSave}
						disabled={saving || !name.trim()}
						sx={{
							textTransform: 'none', fontWeight: 700, borderRadius: '10px', px: 3, color: 'white',
							boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.25)}`,
							background: theme.gradients.brand,
							'&:hover': { boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.35)}` },
						}}
					>
						{saving ? 'Saving…' : 'Save Template'}
					</Button>
				</>
			}
		>
			<Grid container spacing={2.5}>
				<Grid size={{ xs: 12, sm: 6 }}>
					<TextField
						label="Template Name"
						fullWidth
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="e.g. Software Engineer Onboarding"
						required
						sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
					/>
				</Grid>
				<Grid size={{ xs: 12, sm: 6 }}>
					<FormControl fullWidth>
						<InputLabel>Checklist Type</InputLabel>
						<Select value={type} label="Checklist Type" onChange={(e) => setType(e.target.value as ChecklistType)} sx={{ borderRadius: '12px' }}>
							<MenuItem value="onboarding">Onboarding</MenuItem>
							<MenuItem value="offboarding">Offboarding</MenuItem>
						</Select>
					</FormControl>
				</Grid>

				<Grid size={12}>
					<Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
						Tasks ({tasks.length} defined)
					</Typography>

					<Box sx={{ p: 2, mb: 2, borderRadius: '14px', bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
						<Grid container spacing={1.5} alignItems="center">
							<Grid size={{ xs: 12, sm: 5 }}>
								<TextField
									label="Task Description"
									fullWidth
									size="small"
									value={newTaskTitle}
									onChange={(e) => setNewTaskTitle(e.target.value)}
									placeholder="e.g. Collect signatures"
									sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
								/>
							</Grid>
							<Grid size={{ xs: 7, sm: 3 }}>
								<FormControl fullWidth size="small">
									<InputLabel>Role Required</InputLabel>
									<Select value={newTaskRole} label="Role Required" onChange={(e) => setNewTaskRole(e.target.value)} sx={{ borderRadius: '10px' }}>
										{ROLE_OPTIONS.map((r) => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
									</Select>
								</FormControl>
							</Grid>
							<Grid size={{ xs: 5, sm: 2 }}>
								<TextField
									label="Due (days)"
									type="number"
									fullWidth
									size="small"
									value={newTaskDueDays}
									onChange={(e) => setNewTaskDueDays(e.target.value)}
									placeholder="Optional"
									inputProps={{ min: 0 }}
									sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
								/>
							</Grid>
							<Grid size={{ xs: 12, sm: 2 }}>
								<Button variant="contained" fullWidth startIcon={<AddIcon />} onClick={handleAddTask} sx={{ borderRadius: '10px' }}>
									Add
								</Button>
							</Grid>
						</Grid>
					</Box>

					<Stack spacing={1}>
						{tasks.map((t, idx) => (
							<Box
								key={t.id}
								sx={{
									p: 1.5, borderRadius: '12px', border: '1px solid', borderColor: 'divider',
									display: 'flex', justifyContent: 'space-between', alignItems: 'center',
								}}
							>
								<Stack direction="row" spacing={1.25} alignItems="center">
									<Chip label={idx + 1} size="small" sx={{ fontWeight: 800 }} />
									<Typography variant="body2" fontWeight={600}>{t.title}</Typography>
									<Chip label={`Role: ${t.role_required}`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
									{!!t.due_days && (
										<Chip label={`Due in ${t.due_days}d`} size="small" color="warning" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
									)}
								</Stack>
								<IconButton size="small" color="error" onClick={() => handleRemoveTask(idx)}>
									<DeleteIcon sx={{ fontSize: '0.9rem' }} />
								</IconButton>
							</Box>
						))}
					</Stack>
				</Grid>
			</Grid>
		</BaseDialog>
	);
};

export default TemplateDialog;
