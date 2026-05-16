import React from 'react';
import {
	TextField,
	Typography,
	Stack,
	MenuItem,
	Grid,
	Select,
	FormControl,
	InputLabel,
	Autocomplete,
	Chip,
	Box,
	alpha,
	useTheme
} from '@mui/material';
import { InfoOutlined as InfoIcon } from '@mui/icons-material';
import type { TrainingBatch } from '../../../../../models/training';
import { disabilityTypes } from '../../../../../data/Disabilities';
import { TRAINING_MODES, DOMAINS } from '../../../../../data/Training';

interface BasicConfigTabProps {
	formData: Partial<TrainingBatch>;
	onChange: (field: keyof TrainingBatch, value: any) => void;
	onOtherChange: (key: string, value: any) => void;
	availableTags: string[];
	tagsLoading: boolean;
}

const BasicConfigTab: React.FC<BasicConfigTabProps> = ({
	formData,
	onChange,
	onOtherChange,
	availableTags,
	tagsLoading
}) => {
	const theme = useTheme();

	return (
		<Stack spacing={4}>
			<Box>
				<Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
					<InfoIcon fontSize="small" color="primary" /> Basic Configuration
				</Typography>
				<Grid container spacing={3}>
					<Grid size={{ xs: 12 }}>
						<TextField
							fullWidth
							label="Batch Display Name"
							placeholder="e.g. IT-JAN-2024-WIN"
							value={formData.batch_name}
							onChange={(e) => onChange('batch_name', e.target.value)}
							variant="outlined"
						/>
					</Grid>
					<Grid size={{ xs: 12 }}>
						<Autocomplete
							multiple
							options={disabilityTypes}
							value={Array.isArray(formData.disability_types) ? formData.disability_types : []}
							onChange={(_e, val) => onChange('disability_types', val)}
							renderInput={(params) => (
								<TextField {...params} label="Target Candidate Category" required />
							)}
							renderTags={(tagValue, getTagProps) =>
								tagValue.map((option, index) => {
									const { key, ...tagProps } = getTagProps({ index });
									return (
										<Chip
											key={key}
											label={option}
											{...tagProps}
											size="small"
											sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), fontWeight: 600 }}
										/>
									);
								})
							}
						/>
					</Grid>
					<Grid size={{ xs: 12, sm: 6 }}>
						<FormControl fullWidth>
							<InputLabel>Select Domain</InputLabel>
							<Select
								value={formData.domain || ''}
								label="Select Domain"
								onChange={(e) => onChange('domain', e.target.value)}
							>
								{DOMAINS.map(d => (
									<MenuItem key={d} value={d}>{d}</MenuItem>
								))}
							</Select>
						</FormControl>
					</Grid>
					<Grid size={{ xs: 12, sm: 6 }}>
						<FormControl fullWidth>
							<InputLabel>Training Mode</InputLabel>
							<Select
								value={formData.training_mode || ''}
								label="Training Mode"
								onChange={(e) => onChange('training_mode', e.target.value)}
							>
								{TRAINING_MODES.map(mode => (
									<MenuItem key={mode} value={mode}>{mode}</MenuItem>
								))}
							</Select>
						</FormControl>
					</Grid>
					<Grid size={{ xs: 12 }}>
						<FormControl fullWidth>
							<InputLabel>Batch Tag</InputLabel>
							<Select
								value={formData.other?.tag || ''}
								label="Batch Tag"
								onChange={(e) => onOtherChange('tag', e.target.value)}
								disabled={tagsLoading}
							>
								<MenuItem value=""><em>None</em></MenuItem>
								{availableTags.map(tag => (
									<MenuItem key={tag} value={tag}>{tag}</MenuItem>
								))}
							</Select>
						</FormControl>
					</Grid>
				</Grid>
			</Box>
		</Stack>
	);
};

export default BasicConfigTab;
