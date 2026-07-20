import React, { useState, useEffect, useMemo } from 'react';
import { TextField, Stack, FormControl, InputLabel, Select, MenuItem, FormHelperText, Box, Typography } from '@mui/material';
import { BaseDialog } from '../../../../common/dialogbox';
import { CancelButton, SubmitButton } from '../../../../common/button';
import { useAppDispatch } from '../../../../../store/hooks';
import { createDesignation, updateDesignation } from '../../../../../store/slices/hrSlice';
import type { HRDesignationListItem, HRDesignationCreate, HRDepartmentListItem } from '../../../../../models/hr';
import useToast from '../../../../../hooks/useToast';

interface DesignationDialogProps {
	open: boolean;
	onClose: () => void;
	existing?: HRDesignationListItem | null;
	departments: HRDepartmentListItem[];
}

const GRADE_LEVELS: Array<{ value: string; label: string; description: string }> = [
	{ value: 'L1', label: 'L1 — Associate', description: 'Entry-level role with guided, well-defined responsibilities.' },
	{ value: 'L2', label: 'L2 — Professional', description: 'Independent contributor handling a standard scope of work.' },
	{ value: 'L3', label: 'L3 — Senior', description: 'Senior contributor or team lead with broader ownership.' },
	{ value: 'L4', label: 'L4 — Management', description: 'Manages a team or function and is accountable for outcomes.' },
	{ value: 'L5', label: 'L5 — Executive', description: 'Organization-wide leadership and strategic decision-making.' },
];

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

	// Preserve a legacy free-text grade (set before this became a dropdown) as a selectable option.
	const gradeOptions = useMemo(() => {
		if (form.grade && !GRADE_LEVELS.some((g) => g.value === form.grade)) {
			return [{ value: form.grade, label: form.grade, description: 'Custom grade set previously.' }, ...GRADE_LEVELS];
		}
		return GRADE_LEVELS;
	}, [form.grade]);

	const selectedGrade = gradeOptions.find((g) => g.value === form.grade);

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
					<CancelButton onClick={onClose} disabled={saving} />
					<SubmitButton
						onClick={handleSave}
						loading={saving}
						disabled={!form.name.trim()}
					>
						{existing ? 'Update' : 'Create'}
					</SubmitButton>
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
				<FormControl fullWidth>
					<InputLabel>Grade / Level</InputLabel>
					<Select
						value={form.grade}
						label="Grade / Level"
						displayEmpty
						onChange={(e) => setForm({ ...form, grade: e.target.value })}
						renderValue={(value) => (value ? gradeOptions.find((g) => g.value === value)?.label || value : '')}
					>
						{gradeOptions.map((g) => (
							<MenuItem key={g.value} value={g.value} sx={{ alignItems: 'flex-start', py: 1 }}>
								<Box>
									<Typography variant="body2" fontWeight={700}>{g.label}</Typography>
									<Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
										{g.description}
									</Typography>
								</Box>
							</MenuItem>
						))}
					</Select>
					<FormHelperText>
						{selectedGrade ? selectedGrade.description : 'Choose the seniority tier this designation belongs to.'}
					</FormHelperText>
				</FormControl>
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
