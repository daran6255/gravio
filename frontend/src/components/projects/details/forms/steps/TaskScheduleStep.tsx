import React from 'react';
import { Stack, TextField, MenuItem, Typography } from '@mui/material';
import { DatePicker } from '../../../../common/form';
import type { BillingType } from '../../../../../models/projects/projectTask';

interface TaskScheduleStepProps {
	startDate: string | null;
	setStartDate: (val: string | null) => void;
	dueDate: string | null;
	setDueDate: (val: string | null) => void;
	estimatedHours: string;
	setEstimatedHours: (val: string) => void;
	actualHours: string;
	setActualHours: (val: string) => void;
	billingType: BillingType;
	setBillingType: (val: BillingType) => void;
}

export const TaskScheduleStep: React.FC<TaskScheduleStepProps> = ({
	startDate,
	setStartDate,
	dueDate,
	setDueDate,
	estimatedHours,
	setEstimatedHours,
	actualHours,
	setActualHours,
	billingType,
	setBillingType,
}) => {
	return (
		<Stack spacing={2.5} sx={{ mt: 1 }}>
			<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
				<DatePicker label="Start Date" value={startDate} onChange={(v) => setStartDate(v || null)} format="DD-MMM-YYYY" />
				<DatePicker label="Due Date" value={dueDate} onChange={(v) => setDueDate(v || null)} format="DD-MMM-YYYY" minDate={startDate || undefined} />
			</Stack>

			<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>
				Time & Billing
			</Typography>

			<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
				<TextField
					label="Estimated Hours"
					type="number"
					value={estimatedHours}
					onChange={(e) => setEstimatedHours(e.target.value)}
					fullWidth
					slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
				/>
				<TextField
					label="Actual Hours"
					type="number"
					value={actualHours}
					onChange={(e) => setActualHours(e.target.value)}
					fullWidth
					slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
				/>
				<TextField
					select
					label="Billing Type"
					value={billingType}
					onChange={(e) => setBillingType(e.target.value as BillingType)}
					fullWidth
				>
					<MenuItem value="billable">Billable</MenuItem>
					<MenuItem value="non_billable">Non-billable</MenuItem>
				</TextField>
			</Stack>
		</Stack>
	);
};

export default TaskScheduleStep;
