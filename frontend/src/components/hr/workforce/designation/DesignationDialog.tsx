import React, { useState, useEffect } from 'react';
import { Button, TextField, Stack, FormControl, InputLabel, Select, MenuItem, CircularProgress } from '@mui/material';
import { BaseDialog } from '../../../common/dialogbox';
import { useAppDispatch } from '../../../../store/hooks';
import { createDesignation, updateDesignation } from '../../../../store/slices/hrSlice';
import type { HRDesignationListItem, HRDesignationCreate, HRDepartmentListItem } from '../../../../models/hr';
import useToast from '../../../../hooks/useToast';

interface DesignationDialogProps {
	open: boolean;
	onClose: () => void;
	existing?: HRDesignationListItem | null;
	departments: HRDepartmentListItem[];
}

export const DesignationDialog: React.FC<DesignationDialogProps> = ({ open, onClose, existing, departments }) => {
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
		<BaseDialog
			open={open}
			onClose={onClose}
			title={existing ? 'Edit Designation' : 'Create Designation'}
			subtitle={existing ? `Update details for ${existing.name}` : 'Define a new job designation employees can be assigned to'}
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
		</BaseDialog>
	);
};

export default DesignationDialog;
