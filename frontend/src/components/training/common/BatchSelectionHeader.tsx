import React, { memo } from 'react';
import {
	Box,
	Typography,
	Autocomplete,
	TextField,
	useTheme,
	alpha
} from '@mui/material';
import { ExpandMore as ExpandIcon } from '@mui/icons-material';
import type { TrainingBatch } from '../../../models/training';

interface BatchSelectionHeaderProps {
	batches: TrainingBatch[];
	selectedBatch: TrainingBatch | null;
	onBatchChange: (batch: TrainingBatch | null) => void;
}

const BatchSelectionHeader: React.FC<BatchSelectionHeaderProps> = memo(({
	batches,
	selectedBatch,
	onBatchChange,
}) => {
	const theme = useTheme();

	return (
		<Box sx={{ width: '100%', maxWidth: 340 }}>
			<Typography
				variant="caption"
				sx={{
					fontWeight: 800,
					color: alpha(theme.palette.common.white, 0.5),
					display: 'block',
					mb: 0.75,
					textTransform: 'uppercase',
					letterSpacing: '0.1em',
					fontSize: '0.65rem'
				}}
			>
				Select Training Batch
			</Typography>
			<Autocomplete
				options={batches}
				getOptionLabel={(option) => option.batch_name}
				value={selectedBatch}
				onChange={(_e, newValue) => onBatchChange(newValue)}
				size="small"
				popupIcon={<ExpandIcon sx={{ fontSize: 20 }} />}
				renderInput={(params) => (
					<TextField
						{...params}
						placeholder="Search batches..."
						variant="outlined"
						sx={{
							'& .MuiOutlinedInput-root': {
								color: 'common.white',
								fontSize: '0.875rem',
								fontWeight: 600,
								bgcolor: alpha(theme.palette.common.white, 0.05),
								borderRadius: 2,
								transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
								height: 40,
								'& fieldset': {
									borderColor: alpha(theme.palette.common.white, 0.15),
									borderWidth: '1px'
								},
								'&:hover fieldset': {
									borderColor: alpha(theme.palette.common.white, 0.3)
								},
								'&.Mui-focused fieldset': {
									borderColor: theme.palette.primary.main,
									borderWidth: '1.5px'
								},
							},
							'& .MuiAutocomplete-input': {
								py: 0
							},
							'& .MuiInputBase-input::placeholder': {
								color: alpha(theme.palette.common.white, 0.4),
								opacity: 1
							}
						}}
					/>
				)}
				sx={{
					width: '100%',
					'& .MuiAutocomplete-popupIndicator': { 
						color: alpha(theme.palette.common.white, 0.6),
						'&:hover': { bgcolor: alpha(theme.palette.common.white, 0.05) }
					},
					'& .MuiAutocomplete-clearIndicator': { 
						color: alpha(theme.palette.common.white, 0.6),
						'&:hover': { bgcolor: alpha(theme.palette.common.white, 0.05) }
					}
				}}
			/>
		</Box>
	);
});

BatchSelectionHeader.displayName = 'BatchSelectionHeader';

export default BatchSelectionHeader;
