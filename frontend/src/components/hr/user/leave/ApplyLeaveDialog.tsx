import React, { useEffect, useState } from 'react';
import {
	Box, Checkbox, FormControl, FormControlLabel, InputLabel, MenuItem,
	Select, Stack, TextField, Typography, alpha, useTheme,
} from '@mui/material';
import BaseDialog from '../../../common/dialogbox/BaseDialog';
import { SubmitButton, CancelButton } from '../../../common/button';
import { useAppDispatch } from '../../../../store/hooks';
import { createLeaveRequest, fetchMyLeaveBalances } from '../../../../store/slices/hrSlice';
import type { HRLeaveBalanceResponse, HRLeaveRequestCreate, HRLeaveTypeListItem } from '../../../../models/hr';
import useToast from '../../../../hooks/useToast';

interface ApplyLeaveDialogProps {
	open: boolean;
	onClose: () => void;
	onSaved: () => void;
	leaveTypes: HRLeaveTypeListItem[];
	balances: HRLeaveBalanceResponse[];
}

const emptyForm = (): HRLeaveRequestCreate => ({
	leave_type_id: 0,
	from_date: new Date().toISOString().split('T')[0],
	to_date: new Date().toISOString().split('T')[0],
	is_half_day: false,
	half_day_session: 'forenoon',
	reason: '',
});

const ApplyLeaveDialog: React.FC<ApplyLeaveDialogProps> = ({ open, onClose, onSaved, leaveTypes, balances }) => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const { success, error } = useToast();
	const [saving, setSaving] = useState(false);
	const [form, setForm] = useState<HRLeaveRequestCreate>(emptyForm());

	useEffect(() => {
		if (open) {
			setForm((f) => ({ ...emptyForm(), leave_type_id: f.leave_type_id || leaveTypes[0]?.id || 0 }));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, leaveTypes]);

	const selectedBalance = balances.find((b) => b.leave_type_id === form.leave_type_id);
	const selectedLeaveType = leaveTypes.find((t) => t.id === form.leave_type_id);

	const fromD = new Date(form.from_date);
	const toD = new Date(form.to_date);
	let requestedDays = 0;
	if (!isNaN(fromD.getTime()) && !isNaN(toD.getTime()) && toD >= fromD) {
		requestedDays = form.is_half_day ? 0.5 : (toD.getTime() - fromD.getTime()) / (1000 * 3600 * 24) + 1;
	}

	const canSave = form.leave_type_id !== 0 && requestedDays > 0 && !!form.reason?.trim();

	const handleSave = async () => {
		if (!canSave) return;
		setSaving(true);
		try {
			await dispatch(createLeaveRequest(form)).unwrap();
			dispatch(fetchMyLeaveBalances(undefined));
			success('Leave request submitted successfully');
			onSaved();
			onClose();
		} catch (e: any) {
			error(e || 'Failed to submit leave request');
		} finally {
			setSaving(false);
		}
	};

	return (
		<BaseDialog
			open={open}
			onClose={onClose}
			title="Apply for Leave"
			subtitle="Submit a new leave request for approval"
			loading={saving}
			actions={
				<>
					<CancelButton onClick={onClose} disabled={saving} sx={{ borderRadius: '10px', color: 'text.secondary' }} />
					<SubmitButton
						onClick={handleSave}
						loading={saving}
						disabled={!canSave}
						sx={{ borderRadius: '10px', px: 3 }}
					>
						Submit Application
					</SubmitButton>
				</>
			}
		>
			<Stack spacing={2.5}>
				<FormControl fullWidth>
					<InputLabel>Leave Type</InputLabel>
					<Select
						value={form.leave_type_id}
						label="Leave Type"
						onChange={(e) => setForm({ ...form, leave_type_id: e.target.value as number })}
						sx={{ borderRadius: '12px' }}
					>
						{leaveTypes.map((t) => (
							<MenuItem key={t.id} value={t.id}>{t.name} ({t.code})</MenuItem>
						))}
					</Select>
				</FormControl>

				{selectedBalance && (
					<Box
						sx={{
							p: 1.75,
							borderRadius: '14px',
							bgcolor: alpha(theme.palette.primary.main, 0.06),
							border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
						}}
					>
						<Typography variant="caption" color="text.secondary" fontWeight={600}>
							Available balance: <strong style={{ color: theme.palette.primary.main }}>
								{selectedBalance.allocated - selectedBalance.used - selectedBalance.pending} days
							</strong>
							{selectedLeaveType?.is_lop && ' (Loss of Pay allowed)'}
						</Typography>
					</Box>
				)}

				<Stack direction="row" spacing={2}>
					<TextField
						type="date"
						label="From Date"
						fullWidth
						InputLabelProps={{ shrink: true }}
						value={form.from_date}
						onChange={(e) => setForm({ ...form, from_date: e.target.value })}
						sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
					/>
					<TextField
						type="date"
						label="To Date"
						fullWidth
						InputLabelProps={{ shrink: true }}
						value={form.to_date}
						onChange={(e) => setForm({ ...form, to_date: e.target.value })}
						disabled={form.is_half_day}
						sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
					/>
				</Stack>

				<FormControlLabel
					control={
						<Checkbox
							checked={form.is_half_day || false}
							onChange={(e) => {
								const checked = e.target.checked;
								setForm({ ...form, is_half_day: checked, to_date: checked ? form.from_date : form.to_date });
							}}
						/>
					}
					label="Half Day Request"
				/>

				{form.is_half_day && (
					<FormControl fullWidth>
						<InputLabel>Session</InputLabel>
						<Select
							value={form.half_day_session || 'forenoon'}
							label="Session"
							onChange={(e) => setForm({ ...form, half_day_session: e.target.value as string })}
							sx={{ borderRadius: '12px' }}
						>
							<MenuItem value="forenoon">Forenoon (First half)</MenuItem>
							<MenuItem value="afternoon">Afternoon (Second half)</MenuItem>
						</Select>
					</FormControl>
				)}

				<TextField
					label="Reason for Leave"
					required
					multiline
					rows={3}
					value={form.reason}
					onChange={(e) => setForm({ ...form, reason: e.target.value })}
					sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
				/>

				{requestedDays > 0 && (
					<Typography variant="subtitle2" color="primary.main" fontWeight={700}>
						Total Requested: {requestedDays} day{requestedDays !== 1 ? 's' : ''}
					</Typography>
				)}
			</Stack>
		</BaseDialog>
	);
};

export default ApplyLeaveDialog;
