import React, { useMemo } from 'react';
import {
	Grid,
	TextField,
	Autocomplete,
	Box,
	Paper,
	Stack,
	Typography,
	Divider,
	FormControl,
	Select,
	MenuItem,
	Chip
} from '@mui/material';
import {
	LocationOnOutlined as PlaceIcon,
	WorkOutline as WorkplaceIcon,
	InfoOutlined as InfoIcon
} from '@mui/icons-material';
import { Country, State, City } from 'country-state-city';
import { awsStyles } from '../../../../../theme/theme';
import type { JobRole } from '../../../../../models/jobRole';

interface LocationWorkplaceTabProps {
	formData: Partial<JobRole>;
	handleNestedChange: (parent: string, field: string, value: any) => void;
	workplaceTypes: string[];
	jobTypes: string[];
	highlightMissing?: boolean;
}

const LocationWorkplaceTab: React.FC<LocationWorkplaceTabProps> = ({
	formData,
	handleNestedChange,
	workplaceTypes,
	jobTypes,
	highlightMissing
}) => {
	const { awsPanel, helperBox } = awsStyles;

	const getFieldStyle = (value: any, isRequired: boolean = false) => {
		const isEmpty = Array.isArray(value) ? value.length === 0 : !value;
		const isMissing = highlightMissing && isRequired && isEmpty;
		return {
			...commonTextFieldProps.sx,
			'& .MuiInputBase-root': {
				...commonTextFieldProps.sx['& .MuiInputBase-root'],
				border: isMissing ? '1px dashed #ec7211' : 'none',
				bgcolor: isMissing ? 'rgba(236, 114, 17, 0.03)' : '#fcfcfc',
			}
		};
	};

	const commonTextFieldProps = {
		size: 'small' as const,
		sx: {
			'& .MuiInputBase-root': {
				borderRadius: '2px',
				bgcolor: '#fcfcfc',
			},
			'& .MuiOutlinedInput-notchedOutline': { borderColor: '#d5dbdb' },
			'&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#879596' },
			'&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#ec7211' }
		}
	};

	// Dynamic Location Data Fetching
	const countries = useMemo(() => Country.getAllCountries(), []);
	
	const selectedCountryObj = useMemo(() => 
		countries.find(c => c.name === formData.location?.country),
		[countries, formData.location?.country]
	);

	const states = useMemo(() => 
		selectedCountryObj ? State.getStatesOfCountry(selectedCountryObj.isoCode) : [],
		[selectedCountryObj]
	);

	const selectedStatesObjs = useMemo(() => 
		states.filter(s => (formData.location?.states || []).includes(s.name)),
		[states, formData.location?.states]
	);

	const cities = useMemo(() => {
		if (!selectedCountryObj || selectedStatesObjs.length === 0) return [];
		
		// Aggregate cities from all selected states
		const allCities: any[] = [];
		selectedStatesObjs.forEach(stateObj => {
			const stateCities = City.getCitiesOfState(selectedCountryObj.isoCode, stateObj.isoCode);
			allCities.push(...stateCities);
		});
		return allCities;
	}, [selectedCountryObj, selectedStatesObjs]);

	return (
		<Stack spacing={4}>
			{/* Location Section */}
			<Paper elevation={0} sx={awsPanel}>
				<Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
					<Box sx={{ bgcolor: 'secondary.main', p: 0.5, borderRadius: '2px', display: 'flex' }}>
						<PlaceIcon sx={{ color: '#ffffff', fontSize: 20 }} />
					</Box>
					<Typography variant="awsSectionTitle">Workplace & Geospatial Details</Typography>
				</Stack>

				<Box sx={helperBox}>
					<InfoIcon sx={{ color: '#007eb9', mt: 0.25, fontSize: 20 }} />
					<Typography variant="body2" sx={{ color: '#007eb9', fontWeight: 500 }}>
						Select the country and state to define the primary work geography. Multiple cities can be assigned for mobile or field roles.
					</Typography>
				</Box>

				<Divider sx={{ mb: 4, borderColor: '#eaeded' }} />

				<Grid container spacing={3}>
					<Grid size={{ xs: 12, md: 4 }}>
						<Box>
							<Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 0.5, flexWrap: 'nowrap' }}>
								<Typography variant="awsFieldLabel" sx={{ mb: 0, whiteSpace: 'nowrap' }}>Primary Country</Typography>
								{highlightMissing && !formData.location?.country && (
									<Typography variant="caption" sx={{ color: '#ec7211', fontWeight: 800, fontSize: '0.6rem', lineHeight: 1.2, pb: 0.2 }}>VERIFICATION REQUIRED</Typography>
								)}
							</Stack>
							<Autocomplete
								options={countries}
								getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
								value={selectedCountryObj || null}
								isOptionEqualToValue={(option, value) => option.name === (typeof value === 'string' ? value : value?.name)}
								onChange={(_, v) => {
									const countryName = v && typeof v !== 'string' ? v.name : '';
									handleNestedChange('location', 'country', countryName);
									// Cascading reset
									handleNestedChange('location', 'states', []);
									handleNestedChange('location', 'cities', []);
								}}
								renderInput={(params) => (
									<TextField 
										{...params} 
										placeholder="Select Country" 
										{...commonTextFieldProps} 
										sx={getFieldStyle(formData.location?.country, true)}
									/>
								)}
							/>
						</Box>
					</Grid>
					<Grid size={{ xs: 12, md: 4 }}>
						<Box>
							<Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 0.5, flexWrap: 'nowrap' }}>
								<Typography variant="awsFieldLabel" sx={{ mb: 0, whiteSpace: 'nowrap' }}>State/Province</Typography>
								{highlightMissing && !formData.location?.states?.length && (
									<Typography variant="caption" sx={{ color: '#ec7211', fontWeight: 800, fontSize: '0.6rem', lineHeight: 1.2, pb: 0.2 }}>VERIFICATION REQUIRED</Typography>
								)}
							</Stack>
							<Autocomplete
								multiple
								options={states}
								getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
								value={selectedStatesObjs}
								isOptionEqualToValue={(option, value) => option.name === (typeof value === 'string' ? value : value?.name)}
								disabled={!selectedCountryObj}
								onChange={(_, v) => {
									const stateNames = v.map(item => typeof item === 'string' ? item : item.name);
									handleNestedChange('location', 'states', stateNames);

									// Smart filter for cities: remove cities that don't belong to any remaining states
									const remainingStateIsos = v.map(item => item.isoCode);
									const currentCities = formData.location?.cities || [];
									
									if (selectedCountryObj) {
										const validCities = currentCities.filter(cityName => {
											return remainingStateIsos.some(iso => {
												return City.getCitiesOfState(selectedCountryObj.isoCode, iso).some(c => c.name === cityName);
											});
										});
										if (validCities.length !== currentCities.length) {
											handleNestedChange('location', 'cities', validCities);
										}
									}
								}}
								renderTags={(value, getTagProps) =>
									value.map((option, index) => {
										const { key: _key, ...rest } = getTagProps({ index });
										return (
											<Chip
												key={option.name}
												label={option.name}
												size="small"
												{...rest}
												variant="outlined"
												sx={{ borderRadius: '2px' }}
											/>
										);
									})
								}
								renderInput={(params) => (
									<TextField 
										{...params} 
										placeholder={selectedCountryObj ? "Select States" : "Select Country first"} 
										{...commonTextFieldProps} 
										sx={getFieldStyle(formData.location?.states, true)}
									/>
								)}
							/>
						</Box>
					</Grid>
					<Grid size={{ xs: 12, md: 4 }}>
						<Box>
							<Typography variant="awsFieldLabel">City (Multiple Selection)</Typography>
							<Autocomplete
								multiple
								options={cities.map(c => c.name)}
								getOptionLabel={(option) => option}
								value={formData.location?.cities || []}
								disabled={selectedStatesObjs.length === 0}
								onChange={(_, v) => handleNestedChange('location', 'cities', v)}
								renderTags={(value, getTagProps) =>
									value.map((option, index) => {
										const { key: _key, ...rest } = getTagProps({ index });
										return (
											<Chip
												key={`${option}-${index}`}
												label={option}
												size="small"
												{...rest}
												variant="outlined"
												sx={{ borderRadius: '2px' }}
											/>
										);
									})
								}
								renderInput={(params) => <TextField {...params} placeholder={selectedStatesObjs.length > 0 ? "Select cities" : "Select State first"} {...commonTextFieldProps} />}
							/>
						</Box>
					</Grid>
				</Grid>
			</Paper>

			{/* Workplace Settings Section */}
			<Paper elevation={0} sx={awsPanel}>
				<Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
					<Box sx={{ bgcolor: 'secondary.main', p: 0.5, borderRadius: '2px', display: 'flex' }}>
						<WorkplaceIcon sx={{ color: '#ffffff', fontSize: 20 }} />
					</Box>
					<Typography variant="awsSectionTitle">Employment Configuration</Typography>
				</Stack>

				<Grid container spacing={3}>
					<Grid size={{ xs: 12, md: 6 }}>
						<Box>
							<Typography variant="awsFieldLabel">Workplace Type</Typography>
							<FormControl fullWidth size="small">
								<Select
									value={(formData as any).job_details?.workplace_type || 'Onsite'}
									onChange={(e) => handleNestedChange('job_details', 'workplace_type', e.target.value)}
									sx={commonTextFieldProps.sx}
								>
									{workplaceTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
								</Select>
							</FormControl>
						</Box>
					</Grid>
					<Grid size={{ xs: 12, md: 6 }}>
						<Box>
							<Typography variant="awsFieldLabel">Job Classification</Typography>
							<FormControl fullWidth size="small">
								<Select
									value={(formData as any).job_details?.job_type || 'Full Time'}
									onChange={(e) => handleNestedChange('job_details', 'job_type', e.target.value)}
									sx={commonTextFieldProps.sx}
								>
									{jobTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
								</Select>
							</FormControl>
						</Box>
					</Grid>
				</Grid>
			</Paper>
		</Stack>
	);
};

export default LocationWorkplaceTab;
