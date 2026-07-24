import React, { useState, useEffect } from 'react';
import { TextField, Stack, FormControlLabel, Switch, InputAdornment } from '@mui/material';
import { BaseDialog } from '../../../common/dialogbox';
import { CancelButton, SubmitButton } from '../../../common/button';
import { useAppDispatch } from '../../../../store/hooks';
import { createLeaveType, updateLeaveType } from '../../../../store/slices/hrSlice';
import type { HRLeaveTypeListItem, HRLeaveTypeCreate } from '../../../../models/hr';
import useToast from '../../../../hooks/useToast';

interface LeaveTypeDialogProps {
	open: boolean;
	onClose: () => void;
	existing?: HRLeaveTypeListItem | null;
}

const DEFAULT_FORM: HRLeaveTypeCreate = {
	name: '',
	code: '',
	description: '',
	default_allocation: 12,
	is_carry_forward: false,
	max_carry_forward: 0,
	is_lop: false,
};

export const LeaveTypeDialog: React.FC<LeaveTypeDialogProps> = ({ open, onClose, existing }) => {
	const dispatch = useAppDispatch();
	const { success, error } = useToast();
	const [saving, setSaving] = useState(false);
	const [form, setForm] = useState<HRLeaveTypeCreate>(DEFAULT_FORM);

	useEffect(() => {
		if (existing) {
			setForm({
				name: existing.name,
				code: existing.code,
				description: existing.description || '',
				default_allocation: existing.default_allocation,
				is_carry_forward: existing.is_carry_forward,
				max_carry_forward: existing.max_carry_forward,
				is_lop: existing.is_lop,
			});
		} else {
			setForm(DEFAULT_FORM);
		}
	}, [existing, open]);

	const handleSave = async () => {
		if (!form.name.trim() || !form.code.trim()) return;
		setSaving(true);
		try {
			const payload = { ...form, code: form.code.trim().toUpperCase() };
			if (existing) {
				await dispatch(updateLeaveType({ id: existing.id, payload })).unwrap();
				success('Leave type updated');
			} else {
				await dispatch(createLeaveType(payload)).unwrap();
				success('Leave type created');
			}
			onClose();
		} catch (e: any) {
			error(e || 'Failed to save leave type');
		} finally {
			setSaving(false);
		}
	};

	return (
		<BaseDialog
			open={open}
			onClose={onClose}
			title={existing ? 'Edit Leave Type' : 'Create Leave Type'}
			subtitle={existing ? `Update the policy for ${existing.name}` : 'Define a new leave type employees can request against'}
			maxWidth="sm"
			loading={saving}
			actions={
				<>
					<CancelButton onClick={onClose} disabled={saving} />
					<SubmitButton onClick={handleSave} loading={saving} disabled={!form.name.trim() || !form.code.trim()}>
						{existing ? 'Update' : 'Create'}
					</SubmitButton>
				</>
			}
		>
			<Stack spacing={2.5}>
				<Stack direction="row" spacing={2}>
					<TextField
						label="Leave Type Name"
						required
						fullWidth
						value={form.name}
						onChange={(e) => setForm({ ...form, name: e.target.value })}
						placeholder="e.g. Sick Leave"
					/>
					<TextField
						label="Code"
						required
						sx={{ maxWidth: 140 }}
						value={form.code}
						onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
						placeholder="SL"
						inputProps={{ maxLength: 20, style: { textTransform: 'uppercase' } }}
					/>
				</Stack>

				<TextField
					label="Description"
					fullWidth
					multiline
					rows={2}
					value={form.description}
					onChange={(e) => setForm({ ...form, description: e.target.value })}
				/>

				<TextField
					label="Default Yearly Allocation"
					type="number"
					fullWidth
					value={form.default_allocation}
					onChange={(e) => setForm({ ...form, default_allocation: Math.max(0, Number(e.target.value)) })}
					InputProps={{ endAdornment: <InputAdornment position="end">days / year</InputAdornment> }}
					disabled={form.is_lop}
					helperText={form.is_lop ? 'Loss of Pay leave has no allocation -- it is always available.' : 'Prorated automatically for employees who join partway through the year.'}
				/>

				<FormControlLabel
					control={
						<Switch
							checked={form.is_lop}
							onChange={(e) => setForm({ ...form, is_lop: e.target.checked, is_carry_forward: e.target.checked ? false : form.is_carry_forward })}
						/>
					}
					label="Loss of Pay (unpaid, no balance limit)"
				/>

				{!form.is_lop && (
					<>
						<FormControlLabel
							control={
								<Switch
									checked={form.is_carry_forward}
									onChange={(e) => setForm({ ...form, is_carry_forward: e.target.checked })}
								/>
							}
							label="Allow unused days to carry forward into next year"
						/>
						{form.is_carry_forward && (
							<TextField
								label="Max Carry-Forward"
								type="number"
								fullWidth
								value={form.max_carry_forward}
								onChange={(e) => setForm({ ...form, max_carry_forward: Math.max(0, Number(e.target.value)) })}
								InputProps={{ endAdornment: <InputAdornment position="end">days</InputAdornment> }}
								helperText="Capped automatically each year-end -- unused days beyond this are forfeited."
							/>
						)}
					</>
				)}
			</Stack>
		</BaseDialog>
	);
};

export default LeaveTypeDialog;
