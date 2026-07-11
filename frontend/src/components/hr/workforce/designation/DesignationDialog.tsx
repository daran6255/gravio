import React, { useState, useEffect } from 'react';
import {
	Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
	Stack, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
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

export default DesignationDialog;
