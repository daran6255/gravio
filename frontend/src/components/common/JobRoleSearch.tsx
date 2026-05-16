import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
	Box,
	Typography,
	TextField,
	Autocomplete,
	Chip,
	useTheme,
	alpha,
	Stack,
	CircularProgress
} from '@mui/material';
import { Info as InfoIcon, Work as WorkIcon, Business as BusinessIcon, LocationOn as LocationIcon } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchJobRoles } from '../../store/slices/jobRoleSlice';
import type { JobRole } from '../../models/jobRole';

interface JobRoleSearchProps {
	value: string[];
	onChange: (roles: string[]) => void;
	placeholder?: string;
}

/**
 * JobRoleSearch - Standalone component for professional job role selection.
 * Integrated with the JobRole Redux slice for state management.
 */
const JobRoleSearch: React.FC<JobRoleSearchProps> = ({
	value,
	onChange,
	placeholder = "Search by job title or company..."
}) => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const [inputValue, setInputValue] = useState('');
	
	// Get job roles from Redux store instead of local state
	const { list: options, loading } = useAppSelector((state) => state.jobRoles);
	const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const loadJobRoles = useCallback((search: string) => {
		dispatch(fetchJobRoles({
			search: search || undefined,
			limit: 50,
			skip: 0
		}));
	}, [dispatch]);

	useEffect(() => {
		if (debounceTimer.current) clearTimeout(debounceTimer.current);
		
		// If user typed the first character, fetch immediately for responsiveness
		if (inputValue.length === 1) {
			loadJobRoles(inputValue);
			return;
		}

		debounceTimer.current = setTimeout(() => {
			loadJobRoles(inputValue);
		}, 300);

		return () => {
			if (debounceTimer.current) clearTimeout(debounceTimer.current);
		};
	}, [inputValue, loadJobRoles]);

	const formatValue = (val: string | JobRole) => {
		if (typeof val === 'string') return val;
		return val.title;
	};

	return (
		<Box>
			<Typography variant="awsFieldLabel">Suggested Job Roles / Recommendations</Typography>
			<Box sx={{
				display: 'flex',
				gap: 1.5,
				p: 2,
				bgcolor: alpha(theme.palette.primary.main, 0.05),
				border: '1px solid',
				borderColor: alpha(theme.palette.primary.main, 0.2),
				borderRadius: 1,
				mt: 1.5,
				mb: 2,
				alignItems: 'flex-start'
			}}>
				<InfoIcon sx={{ color: 'primary.main', mt: 0.25, fontSize: 20 }} />
				<Box>
					<Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 0.5 }}>Recommendation Instructions</Typography>
					<Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.6, display: 'block' }}>
						• Type to search our internal <strong>Placement Job Roles</strong>.<br />
						• Select a role from the list or press <strong>Enter</strong> to add a custom recommendation.<br />
						• Use formal designations (e.g., "Software Architect" instead of "Lead Dev").
					</Typography>
				</Box>
			</Box>

			<Autocomplete
				multiple
				freeSolo
				openOnFocus
				filterOptions={(x) => x}
				options={options}
				loading={loading}
				getOptionLabel={formatValue}
				inputValue={inputValue}
				onInputChange={(_, newInputValue) => {
					setInputValue(newInputValue);
				}}
				value={value}
				onChange={(_, newValue) => {
					const finalValue = newValue.map(v => typeof v === 'string' ? v : v.title);
					onChange(finalValue);
					setInputValue('');
				}}
				renderOption={(props, option) => {
					const { key, ...optionProps } = props;
					// When using freeSolo, option can be a string, but here options is JobRole[]
					const job = option as JobRole;
					return (
						<li {...optionProps} key={key}>
							<Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', py: 0.5 }}>
								<Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
									{job.title}
								</Typography>
								<Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
									{job.company && (
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
											<BusinessIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
											<Typography variant="caption" color="text.secondary">
												{job.company.name}
											</Typography>
										</Box>
									)}
									{job.location?.cities && job.location.cities.length > 0 && (
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
											<LocationIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
											<Typography variant="caption" color="text.secondary">
												{job.location.cities.join(', ')}
											</Typography>
										</Box>
									)}
								</Stack>
							</Box>
						</li>
					);
				}}
				renderInput={(params) => (
					<TextField
						{...params}
						placeholder={value.length === 0 ? placeholder : ""}
						size="small"
						fullWidth
						onFocus={() => {
							if (options.length === 0) loadJobRoles(inputValue);
						}}
						sx={{
							'& .MuiOutlinedInput-root': {
								borderRadius: 1,
								bgcolor: 'background.paper',
								'& fieldset': { borderColor: 'divider' },
								'&:hover fieldset': { borderColor: theme.palette.primary.main },
								'&.Mui-focused fieldset': { borderColor: theme.palette.primary.main }
							}
						}}
						InputProps={{
							...params.InputProps,
							endAdornment: (
								<React.Fragment>
									{loading ? <CircularProgress color="inherit" size={16} /> : null}
									{params.InputProps.endAdornment}
								</React.Fragment>
							),
						}}
					/>
				)}
				renderTags={(tagValue, getTagProps) =>
					tagValue.map((option, index: number) => {
						const label = typeof option === 'string' ? option : option.title;
						return (
							<Chip
								{...getTagProps({ index })}
								key={index}
								icon={<WorkIcon sx={{ fontSize: '1rem !important' }} />}
								label={label}
								sx={{
									borderRadius: 1,
									bgcolor: alpha(theme.palette.primary.main, 0.08),
									border: '1px solid',
									borderColor: alpha(theme.palette.primary.main, 0.2),
									color: 'primary.main',
									fontWeight: 600,
									height: 32,
									'& .MuiChip-deleteIcon': {
										color: 'primary.main',
										fontSize: 18,
										'&:hover': { color: 'error.main' }
									}
								}}
							/>
						);
					})
				}
			/>
		</Box>
	);
};

export default JobRoleSearch;
