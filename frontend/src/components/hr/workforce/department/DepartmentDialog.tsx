import React, { useState, useEffect } from 'react';
import { Button, TextField, Stack, Select, MenuItem, FormControl, InputLabel, CircularProgress } from '@mui/material';
import { BaseDialog } from '../../../common/dialogbox';
import { useAppDispatch } from '../../../../store/hooks';
import { createDepartment, updateDepartment } from '../../../../store/slices/hrSlice';
import type { HRDepartmentListItem, HRDepartmentCreate, HRDepartmentUpdate } from '../../../../models/hr';
import useToast from '../../../../hooks/useToast';

interface DepartmentDialogProps {
	open: boolean;
	onClose: () => void;
	existing?: HRDepartmentListItem | null;
	departments: HRDepartmentListItem[];
}

export const DepartmentDialog: React.FC<DepartmentDialogProps> = ({ open, onClose, existing, departments }) => {
	const dispatch = useAppDispatch();
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
				await dispatch(updateDepartment({ id: existing.id, payload: { ...form } as HRDepartmentUpdate })).unwrap();
				success('Department updated');
			} else {
				await dispatch(createDepartment(form)).unwrap();
				success('Department created');
			}
			onClose();
		} catch (e: any) {
			error(e || 'Failed to save department');
		} finally {
			setSaving(false);
		}
	};

	return (
		<BaseDialog
			open={open}
			onClose={onClose}
			title={existing ? 'Edit Department' : 'Create Department'}
			subtitle={existing ? `Update details for ${existing.name}` : 'Add a new department to your organization structure'}
			maxWidth="sm"
			loading={saving}
			actions={
				<>
					<Button onClick={onClose} disabled={saving} sx={{ borderRadius: 3 }}>Cancel</Button>
					<Button
						variant="contained"
						onClick={handleSave}
						disabled={saving || !form.name.trim()}
						sx={{ borderRadius: 3, fontWeight: 700 }}
					>
						{saving ? <CircularProgress size={20} color="inherit" /> : existing ? 'Update' : 'Create'}
					</Button>
				</>
			}
		>
			<Stack spacing={2.5}>
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
		</BaseDialog>
	);
};

export default DepartmentDialog;
