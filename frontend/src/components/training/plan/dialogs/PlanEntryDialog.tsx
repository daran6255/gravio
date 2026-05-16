import React from 'react';
import {
	Button,
	Stack,
	Box,
	Typography,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	TextField,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { createPlanEntry, updatePlanEntry } from '../../../../store/slices/trainingPlanSlice';
import { useSnackbar } from 'notistack';
import type { TrainingBatch, TrainingBatchPlan } from '../../../../models/training';
import type { User } from '../../../../models/user';
import type { RootState } from '../../../../store/store';
import {
	ACTIVITY_TYPES,
	BREAK_OPTIONS,
	HR_OPTIONS,
	MOCK_OPTIONS
} from '../utils/planConstants';
import { BaseDialog } from '../../../common/dialogbox';

interface PlanEntryDialogProps {
	open: boolean;
	onClose: () => void;
	selectedEntry: Partial<TrainingBatchPlan> | null;
	setSelectedEntry: (entry: Partial<TrainingBatchPlan> | null) => void;
	formLoading: boolean;
	setFormLoading: (loading: boolean) => void;
	selectedBatch: TrainingBatch;
	formErrors: Record<string, string>;
	setFormErrors: (errors: Record<string, string>) => void;
	validatePlan: (entry: Partial<TrainingBatchPlan>) => Record<string, string> | null;
}

const PlanEntryDialog: React.FC<PlanEntryDialogProps> = ({
	open,
	onClose,
	selectedEntry,
	setSelectedEntry,
	formLoading,
	setFormLoading,
	selectedBatch,
	formErrors,
	setFormErrors,
	validatePlan
}) => {
	const dispatch = useAppDispatch();
	const { enqueueSnackbar } = useSnackbar();
	const { users } = useAppSelector((state: RootState) => state.users);
	const courses = selectedBatch?.courses || [];

	// Derive the trainer's public ID — try all possible sources
	const trainerValue = (
		selectedEntry?.trainer_user_public_id
		|| selectedEntry?.trainer_user?.public_id
		|| (selectedEntry?.trainer
			? (users.find(u => u.full_name === selectedEntry.trainer)?.public_id
				|| users.find(u => u.username === selectedEntry.trainer)?.public_id)
			: undefined)
		|| ''
	) as string;

	const handleSaveEntry = async () => {
		if (!selectedEntry) return;

		const entryToSave = {
			...selectedEntry,
			trainer_user_public_id: selectedEntry.trainer_user_public_id 
				|| selectedEntry.trainer_user?.public_id 
				|| trainerValue
				|| null
		};

		const errors = validatePlan(entryToSave);
		if (errors) {
			setFormErrors(errors);
			return;
		}

		setFormLoading(true);
		try {
			if (entryToSave.public_id) {
				const { public_id, id, date, batch_id, created_at, updated_at, trainer_user, ...updateData } = entryToSave as any;
				await dispatch(updatePlanEntry({
					publicId: entryToSave.public_id,
					data: updateData
				})).unwrap();
				enqueueSnackbar('Entry updated successfully', { variant: 'success' });
			} else {
				await dispatch(createPlanEntry({
					...entryToSave,
					batch_public_id: selectedBatch.public_id
				})).unwrap();
				enqueueSnackbar('Entry created successfully', { variant: 'success' });
			}
			onClose();
		} catch (error: any) {
			enqueueSnackbar(error || 'Failed to save entry', { variant: 'error' });
		} finally {
			setFormLoading(false);
		}
	};

	return (
		<BaseDialog
			open={open}
			onClose={onClose}
			maxWidth="xs"
			title={selectedEntry?.public_id ? 'Edit Plan Entry' : 'Add Plan Entry'}
			subtitle={selectedEntry?.public_id ? `Entry ID: ${selectedEntry.public_id}` : 'Schedule a new activity'}
			loading={formLoading}
			actions={
				<>
					<Button 
						onClick={onClose} 
						disabled={formLoading} 
						color="inherit"
						sx={{ fontWeight: 600 }}
					>
						Cancel
					</Button>
					<Button
						variant="contained"
						onClick={handleSaveEntry}
						disabled={formLoading}
						color="primary"
						sx={{ px: 3 }}
					>
						{formLoading ? 'Saving...' : 'Save Entry'}
					</Button>
				</>
			}
		>
			<Stack spacing={3}>
				<Box sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
					<Typography variant="awsSectionTitle" sx={{ mb: 0.5 }}>
						Schedule Date
					</Typography>
					<Typography variant="body1" color="primary" sx={{ fontWeight: 700 }}>
						{selectedEntry?.date}
					</Typography>
				</Box>

				<FormControl fullWidth error={!!formErrors.activity_type}>
					<InputLabel>Activity Type</InputLabel>
					<Select
						value={selectedEntry?.activity_type || 'course'}
						label="Activity Type"
						onChange={(e) => {
							const newType = e.target.value as any;
							const isCoreTraining = ['course', 'hr_session', 'mock_interview'].includes(newType);
							setSelectedEntry({
								...selectedEntry,
								activity_type: newType,
								activity_name: newType === 'break' ? 'General Break' : '',
								...(isCoreTraining ? {} : {
									trainer: '',
									trainer_user_public_id: '',
									trainer_user: undefined
								})
							});
							if (formErrors.activity_type) setFormErrors({ ...formErrors, activity_type: '' });
						}}
					>
						{ACTIVITY_TYPES.map(type => (
							<MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
						))}
					</Select>
					{formErrors.activity_type && <Typography variant="caption" color="error" sx={{ mx: 2, mt: 0.5 }}>{formErrors.activity_type}</Typography>}
				</FormControl>

				{selectedEntry?.activity_type === 'course' && (
					<FormControl fullWidth required error={!!formErrors.activity_name}>
						<InputLabel>Course</InputLabel>
						<Select
							value={selectedEntry?.activity_name || ''}
							label="Course"
							onChange={(e) => {
								setSelectedEntry({ ...selectedEntry, activity_name: e.target.value });
								if (formErrors.activity_name) setFormErrors({ ...formErrors, activity_name: '' });
							}}
						>
							{courses.map((c: any) => {
								const name = typeof c === 'string' ? c : c.name;
								return <MenuItem key={name} value={name}>{name}</MenuItem>;
							})}
							{courses.length === 0 && <MenuItem disabled>No courses in batch</MenuItem>}
						</Select>
						{formErrors.activity_name && <Typography variant="caption" color="error" sx={{ mx: 2, mt: 0.5 }}>{formErrors.activity_name}</Typography>}
					</FormControl>
				)}

				{selectedEntry?.activity_type === 'break' && (
					<FormControl fullWidth required>
						<InputLabel>Break Type</InputLabel>
						<Select
							value={selectedEntry?.activity_name || ''}
							label="Break Type"
							onChange={(e) => setSelectedEntry({ ...selectedEntry, activity_name: e.target.value })}
						>
							{BREAK_OPTIONS.map(opt => (
								<MenuItem key={opt} value={opt}>{opt}</MenuItem>
							))}
						</Select>
					</FormControl>
				)}

				{selectedEntry?.activity_type === 'hr_session' && (
					<FormControl fullWidth required>
						<InputLabel>HR Activity</InputLabel>
						<Select
							value={selectedEntry?.activity_name || ''}
							label="HR Activity"
							onChange={(e) => setSelectedEntry({ ...selectedEntry, activity_name: e.target.value })}
						>
							{HR_OPTIONS.map(opt => (
								<MenuItem key={opt} value={opt}>{opt}</MenuItem>
							))}
						</Select>
					</FormControl>
				)}

				{selectedEntry?.activity_type === 'mock_interview' && (
					<FormControl fullWidth required>
						<InputLabel>Interview Type</InputLabel>
						<Select
							value={selectedEntry?.activity_name || ''}
							label="Interview Type"
							onChange={(e) => setSelectedEntry({ ...selectedEntry, activity_name: e.target.value })}
						>
							{MOCK_OPTIONS.map(opt => (
								<MenuItem key={opt} value={opt}>{opt}</MenuItem>
							))}
						</Select>
					</FormControl>
				)}

				{['event', 'other'].includes(selectedEntry?.activity_type || '') && (
					<TextField
						label="Activity Name"
						fullWidth
						required
						error={!!formErrors.activity_name}
						helperText={formErrors.activity_name}
						value={selectedEntry?.activity_name || ''}
						onChange={(e) => {
							setSelectedEntry({ ...selectedEntry, activity_name: e.target.value });
							if (formErrors.activity_name) setFormErrors({ ...formErrors, activity_name: '' });
						}}
					/>
				)}

				<Stack direction="row" spacing={2}>
					<TextField
						label="Start Time"
						type="time"
						fullWidth
						required
						error={!!formErrors.start_time}
						helperText={formErrors.start_time}
						value={selectedEntry?.start_time || ''}
						onChange={(e) => {
							setSelectedEntry({ ...selectedEntry, start_time: e.target.value });
							if (formErrors.start_time) setFormErrors({ ...formErrors, start_time: '' });
						}}
						InputLabelProps={{ shrink: true }}
						inputProps={{ step: 300 }}
					/>
					<TextField
						label="End Time"
						type="time"
						fullWidth
						required
						error={!!formErrors.end_time}
						helperText={formErrors.end_time}
						value={selectedEntry?.end_time || ''}
						onChange={(e) => {
							setSelectedEntry({ ...selectedEntry, end_time: e.target.value });
							if (formErrors.end_time) setFormErrors({ ...formErrors, end_time: '' });
						}}
						InputLabelProps={{ shrink: true }}
						inputProps={{ step: 300 }}
					/>
				</Stack>

				{['course', 'hr_session', 'mock_interview'].includes(selectedEntry?.activity_type || '') && (
					<FormControl fullWidth error={!!formErrors.trainer}>
						<InputLabel>Trainer / Faculty</InputLabel>
						<Select
							required
							label="Trainer / Faculty"
							value={trainerValue}
							onChange={(e) => {
								const user = users.find(u => u.public_id === e.target.value);
								setSelectedEntry({ 
									...selectedEntry, 
									trainer_user_public_id: e.target.value as string,
									trainer: user?.full_name || user?.username || ''
								});
								if (formErrors.trainer) setFormErrors({ ...formErrors, trainer: '' });
							}}
							renderValue={(selected) => {
								const user = users.find(u => u.public_id === selected);
								return user?.full_name || user?.username || (selected ? 'Unknown Trainer' : 'Select Trainer');
							}}
						>
							{users
								.filter(u => u.full_name && u.is_active)
								.map((u: User) => (
									<MenuItem key={u.public_id} value={u.public_id}>
										<Box>
											<Typography variant="body2" sx={{ fontWeight: 700 }}>{u.full_name}</Typography>
											<Typography variant="caption" color="text.secondary">{u.email} • {u.role}</Typography>
										</Box>
									</MenuItem>
								))}
						</Select>
						{formErrors.trainer && <Typography variant="caption" color="error" sx={{ mx: 2, mt: 0.5 }}>{formErrors.trainer}</Typography>}
					</FormControl>
				)}

				<TextField
					label="Notes (Optional)"
					fullWidth
					multiline
					rows={2}
					value={selectedEntry?.notes || ''}
					onChange={(e) => setSelectedEntry({ ...selectedEntry, notes: e.target.value })}
				/>
			</Stack>
		</BaseDialog>
	);
};

export default PlanEntryDialog;
