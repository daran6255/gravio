import React from 'react';
import {
	Box,
	TextField,
	Autocomplete,
	CircularProgress,
	FormControlLabel,
	Switch,
	Typography,
	Button,
	useTheme
} from '@mui/material';
import type { User } from '../../../../models/user';
import type { TrainingBatch } from '../../../../models/training';
import type { ProjectFormData } from './types';

interface ProjectFormFieldsProps {
	formData: ProjectFormData;
	handleChange: (field: keyof ProjectFormData, value: string | boolean | User | TrainingBatch[] | null) => void;
	users: User[];
	batches: TrainingBatch[];
	loadingUsers: boolean;
	loadingBatches: boolean;
	mode: 'create' | 'edit' | 'view';
	submitting: boolean;
}

const ProjectFormFields: React.FC<ProjectFormFieldsProps> = ({
	formData,
	handleChange,
	users,
	batches,
	loadingUsers,
	loadingBatches,
	mode,
	submitting
}) => {
	const theme = useTheme();
	const isView = mode === 'view';

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
			{/* Project Type Selection */}
			<Box>
				<Typography variant="body2" sx={{ mb: 1.5, fontWeight: 700, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>
					Classification
				</Typography>
				<Box sx={{ display: 'flex', gap: 1 }}>
					<Button
						variant={formData.project_type === 'standard' ? 'contained' : 'outlined'}
						onClick={() => handleChange('project_type', 'standard')}
						disabled={submitting || isView}
						size="small"
						fullWidth
						sx={{ 
							textTransform: 'none', 
							fontWeight: 600,
							borderRadius: '4px',
							boxShadow: 'none'
						}}
					>
						Standard Project
					</Button>
					<Button
						variant={formData.project_type === 'training' ? 'contained' : 'outlined'}
						onClick={() => handleChange('project_type', 'training')}
						disabled={submitting || isView}
						size="small"
						fullWidth
						sx={{ 
							textTransform: 'none', 
							fontWeight: 600,
							borderRadius: '4px',
							boxShadow: 'none'
						}}
					>
						Training Program
					</Button>
				</Box>
			</Box>

			{formData.project_type === 'training' && (
				<Autocomplete
					multiple
					options={batches}
					getOptionLabel={(option) => option.batch_name}
					value={formData.selectedBatches}
					onChange={(_, newValue) => handleChange('selectedBatches', newValue)}
					loading={loadingBatches}
					disabled={submitting || isView}
					isOptionEqualToValue={(option, value) => option.public_id === value.public_id}
					renderInput={(params) => (
						<TextField
							{...params}
							label="Associated Training Batches"
							placeholder="Select batches..."
							required
							helperText="Linking batches syncs activities from lesson plans"
							InputProps={{
								...params.InputProps,
								endAdornment: (
									<React.Fragment>
										{loadingBatches ? <CircularProgress color="inherit" size={20} /> : null}
										{params.InputProps.endAdornment}
									</React.Fragment>
								),
							}}
						/>
					)}
				/>
			)}

			<Box>
				<Typography variant="body2" sx={{ mb: 1.5, fontWeight: 700, color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>
					Identity & Governance
				</Typography>
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
					<TextField
						label="Project Name"
						fullWidth
						required
						value={formData.name}
						onChange={(e) => handleChange('name', e.target.value)}
						disabled={submitting || isView}
						placeholder={formData.project_type === 'training' && formData.selectedBatches.length > 0 ? formData.selectedBatches[0].batch_name : 'e.g. Internal Infrastructure'}
					/>
					
					<Autocomplete
						options={users}
						getOptionLabel={(option) => option.full_name || option.username}
						value={formData.owner}
						onChange={(_, newValue) => handleChange('owner', newValue)}
						loading={loadingUsers}
						disabled={submitting || isView}
						isOptionEqualToValue={(option, value) => option.public_id === value.public_id}
						renderInput={(params) => (
							<TextField
								{...params}
								label="Primary Owner / Manager"
								required
								InputProps={{
									...params.InputProps,
									endAdornment: (
										<React.Fragment>
											{loadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
											{params.InputProps.endAdornment}
										</React.Fragment>
									),
								}}
							/>
						)}
					/>
				</Box>
			</Box>

			<Box sx={{ p: 2, bgcolor: theme.palette.action.hover, borderRadius: '4px', border: `1px solid ${theme.palette.divider}` }}>
				<FormControlLabel
					control={
						<Switch
							checked={formData.is_active}
							onChange={(e) => handleChange('is_active', e.target.checked)}
							disabled={submitting || isView}
							color="primary"
						/>
					}
					label={
						<Box>
							<Typography variant="body2" sx={{ fontWeight: 700 }}>Operational Status</Typography>
							<Typography variant="caption" color="text.secondary">Inactive projects are hidden from daily activity logging</Typography>
						</Box>
					}
				/>
			</Box>
		</Box>
	);
};

export default ProjectFormFields;
