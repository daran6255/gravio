import React, { useEffect, useMemo, useState } from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select, Stack, Typography, alpha, useTheme } from '@mui/material';
import BaseDialog from '../../../common/dialogbox/BaseDialog';
import { CancelButton, SubmitButton } from '../../../common/button';
import { useAppDispatch } from '../../../../store/hooks';
import { launchChecklistInstance } from '../../../../store/slices/hrSlice';
import type { ChecklistExitReason, HREmployeeListItem, HRChecklistTemplate } from '../../../../models/hr';
import useToast from '../../../../hooks/useToast';

interface LaunchChecklistDialogProps {
	open: boolean;
	onClose: () => void;
	onLaunched: () => void;
	employees: HREmployeeListItem[];
	templates: HRChecklistTemplate[];
}

const LaunchChecklistDialog: React.FC<LaunchChecklistDialogProps> = ({ open, onClose, onLaunched, employees, templates }) => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const { success, error } = useToast();

	const [employeeId, setEmployeeId] = useState<number | ''>('');
	const [templateId, setTemplateId] = useState<number | ''>('');
	const [exitReason, setExitReason] = useState<ChecklistExitReason>('resigned');
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (open) {
			setEmployeeId('');
			setTemplateId('');
			setExitReason('resigned');
		}
	}, [open]);

	const selectedTemplate = useMemo(() => templates.find((t) => t.id === templateId), [templates, templateId]);
	const isOffboarding = selectedTemplate?.checklist_type === 'offboarding';

	const handleLaunch = async () => {
		if (!employeeId || !templateId) return;
		setSaving(true);
		try {
			await dispatch(launchChecklistInstance({
				user_id: Number(employeeId),
				template_id: Number(templateId),
				others: isOffboarding ? { exit_reason: exitReason } : undefined,
			})).unwrap();
			success('Checklist launched successfully');
			onLaunched();
			onClose();
		} catch (e: any) {
			error(e || 'Failed to launch checklist');
		} finally {
			setSaving(false);
		}
	};

	return (
		<BaseDialog
			open={open}
			onClose={onClose}
			title="Launch Employee Checklist"
			subtitle="Start an onboarding or offboarding tracker for an employee"
			loading={saving}
			actions={
				<>
					<CancelButton onClick={onClose} disabled={saving} sx={{ borderRadius: '10px', fontWeight: 600, color: 'text.secondary' }} />
					<SubmitButton
						onClick={handleLaunch}
						loading={saving}
						disabled={!employeeId || !templateId}
						sx={{
							borderRadius: '10px', px: 3, color: 'white',
							boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.25)}`,
							background: theme.gradients.brand,
							'&:hover': { boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.35)}` },
						}}
					>
						Launch Tracker
					</SubmitButton>
				</>
			}
		>
			<Stack spacing={2.5}>
				<FormControl fullWidth>
					<InputLabel>Select Employee</InputLabel>
					<Select
						value={employeeId}
						label="Select Employee"
						onChange={(e) => setEmployeeId(e.target.value as number)}
						sx={{ borderRadius: '12px' }}
					>
						{employees.filter((emp) => emp.is_invited).map((emp) => (
							<MenuItem key={emp.user_id as number} value={emp.user_id as number}>
								{emp.full_name} ({emp.employee_id})
							</MenuItem>
						))}
					</Select>
				</FormControl>

				<FormControl fullWidth>
					<InputLabel>Select Checklist Template</InputLabel>
					<Select
						value={templateId}
						label="Select Checklist Template"
						onChange={(e) => setTemplateId(e.target.value as number)}
						sx={{ borderRadius: '12px' }}
					>
						{templates.filter((t) => t.is_active).map((tmpl) => (
							<MenuItem key={tmpl.id} value={tmpl.id}>
								{tmpl.name} ({tmpl.checklist_type.toUpperCase()})
							</MenuItem>
						))}
					</Select>
				</FormControl>

				{selectedTemplate && (
					<Box sx={{ p: 1.75, borderRadius: '14px', bgcolor: alpha(theme.palette.primary.main, 0.06) }}>
						<Typography variant="caption" color="text.secondary">
							{isOffboarding
								? 'Launching this will move the employee to "On Notice" now, and set their exit status once every task is complete.'
								: 'Launching this will move the employee to "Probation" until every task is complete, at which point they become "Active".'}
						</Typography>
					</Box>
				)}

				{isOffboarding && (
					<FormControl fullWidth>
						<InputLabel>Exit Reason</InputLabel>
						<Select
							value={exitReason}
							label="Exit Reason"
							onChange={(e) => setExitReason(e.target.value as ChecklistExitReason)}
							sx={{ borderRadius: '12px' }}
						>
							<MenuItem value="resigned">Resigned</MenuItem>
							<MenuItem value="terminated">Terminated</MenuItem>
						</Select>
					</FormControl>
				)}
			</Stack>
		</BaseDialog>
	);
};

export default LaunchChecklistDialog;
