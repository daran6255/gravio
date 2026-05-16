import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
	Dialog,
	Box,
	Typography,
	TextField,
	MenuItem,
	Chip,
	Autocomplete,
	InputAdornment,
	Fade,
	useTheme,
	alpha
} from '@mui/material';
import {
	AssignmentOutlined as ActivityIcon,
	EventRepeat as TimelineIcon,
	PeopleOutline as PersonnelIcon,
	Schedule as EffortIcon
} from '@mui/icons-material';

import type { DSRActivity, DSRActivityStatus } from '../../../../models/dsr';
import { DSRActivityStatusValues } from '../../../../models/dsr';
import type { User } from '../../../../models/user';
import userService from '../../../../services/userService';
import { useAppDispatch } from '../../../../store/hooks';
import { createActivity, updateActivity } from '../../../../store/slices/dsrSlice';

// Common Components
import { EnterpriseForm } from '../../../common/form';

interface ActivityDialogProps {
	open: boolean;
	activity: DSRActivity | null;
	projectId: string;
	onClose: () => void;
	onSuccess: () => void;
}

interface ActivityFormData {
	name: string;
	description: string;
	start_date: string;
	end_date: string;
	actual_end_date: string;
	status: DSRActivityStatus;
	estimated_hours: string;
	total_actual_hours: number;
	assigned_user_public_ids: string[];
}

/**
 * ActivityDialog - Flat Monolithic Edition (Enterprise Optimized)
 * Reconstructed as a single file per user preference while maintaining the high-fidelity EnterpriseForm logic.
 */
const ActivityDialog: React.FC<ActivityDialogProps> = ({
	open,
	activity,
	projectId,
	onClose,
	onSuccess
}) => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const [submitting, setSubmitting] = useState(false);
	const [users, setUsers] = useState<User[]>([]);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const [formData, setFormData] = useState<ActivityFormData>({
		name: '',
		description: '',
		start_date: '',
		end_date: '',
		actual_end_date: '',
		status: DSRActivityStatusValues.PLANNED,
		estimated_hours: '',
		total_actual_hours: 0,
		assigned_user_public_ids: []
	});

	// Initial data population
	useEffect(() => {
		if (open) {
			if (activity) {
				setFormData({
					name: activity.name,
					description: activity.description || '',
					start_date: activity.start_date ? activity.start_date.split('T')[0] : '',
					end_date: activity.end_date ? activity.end_date.split('T')[0] : '',
					actual_end_date: activity.actual_end_date ? activity.actual_end_date.split('T')[0] : '',
					status: activity.status,
					estimated_hours: activity.estimated_hours?.toString() || '',
					total_actual_hours: activity.total_actual_hours || 0,
					assigned_user_public_ids: activity.assigned_users?.map(u => u.public_id) || []
				});
			} else {
				setFormData({
					name: '',
					description: '',
					start_date: '',
					end_date: '',
					actual_end_date: '',
					status: DSRActivityStatusValues.PLANNED,
					estimated_hours: '',
					total_actual_hours: 0,
					assigned_user_public_ids: []
				});
			}
			setErrors({});
		}
	}, [activity, open]);

	// Fetch assignable users
	useEffect(() => {
		const fetchUsers = async () => {
			try {
				const response = await userService.getAll(0, 500);
				setUsers(response.items);
			} catch (error) {
				console.error('Failed to fetch users:', error);
			}
		};
		fetchUsers();
	}, []);

	const updateFormData = useCallback((updates: Partial<ActivityFormData>) => {
		setFormData(prev => ({ ...prev, ...updates }));
		if (Object.keys(updates).length > 0) {
			setErrors(prev => {
				const next = { ...prev };
				Object.keys(updates).forEach(key => delete next[key]);
				return next;
			});
		}
	}, []);

	const validate = () => {
		const newErrors: Record<string, string> = {};
		if (!formData.name.trim()) newErrors.name = 'Activity name is required';

		if (formData.start_date && formData.end_date) {
			if (new Date(formData.end_date) < new Date(formData.start_date)) {
				newErrors.end_date = 'End date cannot be before start date';
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSave = async () => {
		if (!validate()) return;

		setSubmitting(true);
		try {
			const payload = {
				project_public_id: projectId as any,
				name: formData.name,
				description: formData.description,
				start_date: formData.start_date || null,
				end_date: formData.end_date || null,
				actual_end_date: formData.actual_end_date || null,
				status: formData.status,
				estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
				assigned_user_public_ids: formData.assigned_user_public_ids
			};

			if (activity) {
				await dispatch(updateActivity({
					publicId: activity.public_id,
					data: payload as any
				})).unwrap();
			} else {
				await dispatch(createActivity(payload as any)).unwrap();
			}
			onSuccess();
		} catch (error) {
			console.error('Failed to save activity:', error);
			setErrors({ submit: 'Failed to save activity. Please try again.' });
		} finally {
			setSubmitting(false);
		}
	};

	// --- Step Components (Locally Defined for Flat Structure) ---

	const GeneralInfoStep = (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
			<Box sx={{ mb: 1 }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
					<ActivityIcon sx={{ color: theme.palette.primary.main, fontSize: '1.2rem' }} />
					<Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.text.primary, letterSpacing: '0.02em' }}>
						BASIC IDENTIFICATION
					</Typography>
				</Box>
				<Typography variant="caption" color="text.secondary">
					Define the core details and current status of this project activity.
				</Typography>
			</Box>

			<TextField
				label="Activity Name"
				fullWidth
				required
				placeholder="e.g., Requirement Analysis Phase 1"
				value={formData.name}
				onChange={(e) => updateFormData({ name: e.target.value })}
				disabled={submitting}
				error={!!errors.name}
				helperText={errors.name}
				sx={{ '& .MuiInputBase-root': { bgcolor: alpha(theme.palette.background.default, 0.4) } }}
			/>

			<TextField
				label="Description"
				fullWidth
				multiline
				rows={4}
				placeholder="Provide detailed context for this activity..."
				value={formData.description}
				onChange={(e) => updateFormData({ description: e.target.value })}
				disabled={submitting}
				sx={{ '& .MuiInputBase-root': { bgcolor: alpha(theme.palette.background.default, 0.4) } }}
			/>

			<TextField
				select
				label="Project Status"
				fullWidth
				required
				value={formData.status}
				onChange={(e) => {
					const newStatus = e.target.value as any;
					const updates: any = { status: newStatus };
					if (newStatus === DSRActivityStatusValues.COMPLETED) {
						if (!formData.actual_end_date) {
							updates.actual_end_date = new Date().toISOString().split('T')[0];
						}
					} else {
						updates.actual_end_date = '';
					}
					updateFormData(updates);
				}}
				disabled={submitting}
				sx={{ '& .MuiInputBase-root': { bgcolor: alpha(theme.palette.background.default, 0.4) } }}
			>
				{Object.values(DSRActivityStatusValues).map(s => (
					<MenuItem key={s} value={s}>{s.toUpperCase()}</MenuItem>
				))}
			</TextField>

			{formData.actual_end_date && (
				<Box sx={{
					p: 2,
					bgcolor: alpha(theme.palette.success.main, 0.05),
					border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
					borderRadius: '4px',
					display: 'flex',
					alignItems: 'center',
					gap: 1.5
				}}>
					<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: theme.palette.success.main }} />
					<Typography variant="body2" sx={{ color: theme.palette.success.dark, fontWeight: 600 }}>
						Completion date auto-recorded as {new Date(formData.actual_end_date).toLocaleDateString()}
					</Typography>
				</Box>
			)}
		</Box>
	);

	const TimelineStep = (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
			<Box>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
					<TimelineIcon sx={{ color: theme.palette.primary.main, fontSize: '1.2rem' }} />
					<Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.text.primary, letterSpacing: '0.02em' }}>
						EXECUTION TIMELINE
					</Typography>
				</Box>
				<Typography variant="caption" color="text.secondary">
					Set specific targets and effort estimates for accurate tracking.
				</Typography>
			</Box>

			<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
				<TextField
					label="Target Start Date"
					type="date"
					fullWidth
					value={formData.start_date}
					onChange={(e) => updateFormData({ start_date: e.target.value })}
					InputLabelProps={{ shrink: true }}
					disabled={submitting}
					sx={{ '& .MuiInputBase-root': { bgcolor: alpha(theme.palette.background.default, 0.4) } }}
				/>
				<TextField
					label="Deadline"
					type="date"
					fullWidth
					value={formData.end_date}
					onChange={(e) => updateFormData({ end_date: e.target.value })}
					error={!!errors.end_date}
					helperText={errors.end_date}
					InputLabelProps={{ shrink: true }}
					disabled={submitting}
					sx={{ '& .MuiInputBase-root': { bgcolor: alpha(theme.palette.background.default, 0.4) } }}
				/>
			</Box>

			<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
				<TextField
					label="Estimated Effort"
					type="number"
					fullWidth
					placeholder="0.0"
					value={formData.estimated_hours}
					onChange={(e) => updateFormData({ estimated_hours: e.target.value })}
					disabled={submitting}
					InputProps={{
						inputProps: { min: 0, step: 0.5 },
						startAdornment: (
							<InputAdornment position="start">
								<EffortIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
							</InputAdornment>
						),
						endAdornment: <InputAdornment position="end">HOURS</InputAdornment>
					}}
					sx={{ '& .MuiInputBase-root': { bgcolor: alpha(theme.palette.background.default, 0.4) } }}
				/>
				<TextField
					label="Actual Hours Logged"
					type="number"
					fullWidth
					value={formData.total_actual_hours}
					disabled
					helperText="Aggregated from DSR submissions"
					sx={{ '& .MuiInputBase-root': { bgcolor: alpha(theme.palette.background.default, 0.1) } }}
				/>
			</Box>

			<Box sx={{ mt: 1 }}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
					<PersonnelIcon sx={{ color: theme.palette.primary.main, fontSize: '1.2rem' }} />
					<Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.text.primary, letterSpacing: '0.02em' }}>
						RESOURCE ALLOCATION
					</Typography>
				</Box>
				<Typography variant="caption" color="text.secondary">
					Assign one or more users to be responsible for this activity.
				</Typography>
			</Box>

			<Autocomplete
				multiple
				options={users}
				getOptionLabel={(option) => option.full_name || option.username}
				value={users.filter(u => formData.assigned_user_public_ids.includes(u.public_id))}
				onChange={(_, newValue) => {
					updateFormData({ assigned_user_public_ids: newValue.map(u => u.public_id) });
				}}
				disabled={submitting}
				renderInput={(params) => (
					<TextField
						{...params}
						label="Responsible Personnel"
						placeholder="Search and select users..."
						sx={{ '& .MuiInputBase-root': { bgcolor: alpha(theme.palette.background.default, 0.4) } }}
					/>
				)}
				renderTags={(value, getTagProps) =>
					value.map((option, index) => (
						<Chip
							label={option.full_name || option.username}
							size="small"
							{...getTagProps({ index })}
							sx={{
								borderRadius: '4px',
								fontWeight: 700,
								bgcolor: alpha(theme.palette.primary.main, 0.1),
								color: theme.palette.primary.dark,
								border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
							}}
						/>
					))
				}
			/>
		</Box>
	);

	const steps = useMemo(() => [
		{
			label: 'Definition',
			description: 'Identification and status',
			content: GeneralInfoStep
		},
		{
			label: 'Execution',
			description: 'Timeline and resources',
			content: TimelineStep
		}
	], [formData, updateFormData, users, submitting, errors]);

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="md"
			fullWidth
			TransitionComponent={Fade}
			TransitionProps={{ timeout: 400 }}
			PaperProps={{
				sx: {
					borderRadius: '4px',
					bgcolor: 'transparent',
					backgroundImage: 'none',
					boxShadow: 'none',
					overflow: 'visible'
				}
			}}
		>
			<EnterpriseForm
				title={activity ? 'Edit Activity' : 'Plan New Activity'}
				subtitle={activity ? `ID: ${activity.public_id}` : 'Create a new tracked milestone for this project'}
				mode={activity ? 'edit' : 'create'}
				steps={steps}
				onSave={handleSave}
				onCancel={onClose}
				isSubmitting={submitting}
				saveButtonText={activity ? 'Commit Changes' : 'Initialize Activity'}
				error={errors.submit}
			/>
		</Dialog>
	);
};

export default ActivityDialog;
