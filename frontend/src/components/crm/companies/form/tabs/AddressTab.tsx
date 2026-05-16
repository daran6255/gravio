import React, { useMemo } from 'react';
import {
	Grid,
	TextField,
	Autocomplete,
	Typography,
	Box,
	InputAdornment
} from '@mui/material';
import {
	Home as AddressIcon,
	Public as CountryIcon,
	Map as StateIcon,
	LocationCity as CityIcon,
	PinDrop as ZipIcon
} from '@mui/icons-material';
import { Country, State, City } from 'country-state-city';
import type { Company } from '../../../../../models/company';

interface AddressTabProps {
	formData: Partial<Company>;
	onChange: (field: string, value: unknown) => void;
}

/**
 * AddressTab Component
 * Enterprise-grade address management section.
 * Implements dynamic country-state-city cascades with standardized AWS-style input patterns.
 */
const AddressTab: React.FC<AddressTabProps> = ({ formData, onChange }) => {
	// Standardized enterprise input styling
	const inputSx = {
		'& .MuiOutlinedInput-root': {
			borderRadius: 1,
			'& fieldset': {
				borderColor: 'divider',
			},
			'&:hover fieldset': {
				borderColor: 'primary.main',
			},
		},
		'& .MuiInputLabel-root': {
			fontSize: '0.875rem',
		}
	};

	const countries = useMemo(() => Country.getAllCountries(), []);

	const selectedCountryObj = useMemo(
		() => countries.find((c) => c.name === formData.address?.country),
		[countries, formData.address?.country]
	);

	const states = useMemo(
		() => (selectedCountryObj ? State.getStatesOfCountry(selectedCountryObj.isoCode) : []),
		[selectedCountryObj]
	);

	const selectedStateObj = useMemo(
		() => states.find((s) => s.name === formData.address?.state),
		[states, formData.address?.state]
	);

	const cities = useMemo(
		() =>
			selectedCountryObj && selectedStateObj
				? City.getCitiesOfState(selectedCountryObj.isoCode, selectedStateObj.isoCode)
				: [],
		[selectedCountryObj, selectedStateObj]
	);

	return (
		<Box sx={{ py: 1 }}>
			<Typography variant="subtitle2" color="text.secondary" sx={{ mb: 3, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
				Office Location
			</Typography>

			<Grid container spacing={3}>
				{/* Street Address */}
				<Grid size={{ xs: 12 }}>
					<TextField
						fullWidth
						label="Street Address"
						placeholder="e.g. 123 Business Park, 4th Floor"
						value={formData.address?.street ?? ''}
						onChange={(e) => onChange('address.street', e.target.value)}
						variant="outlined"
						size="small"
						sx={inputSx}
						slotProps={{
							input: {
								startAdornment: (
									<InputAdornment position="start">
										<AddressIcon fontSize="small" sx={{ color: 'text.secondary', opacity: 0.7 }} />
									</InputAdornment>
								),
							}
						}}
						helperText="Registered office or building address"
					/>
				</Grid>

				{/* Country */}
				<Grid size={{ xs: 12, md: 6 }}>
					<Autocomplete
						options={countries}
						getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
						value={selectedCountryObj || null}
						isOptionEqualToValue={(option, value) =>
							option.name === (typeof value === 'string' ? value : value?.name)
						}
						onChange={(_, v) => {
							const countryName = v && typeof v !== 'string' ? v.name : '';
							onChange('address.country', countryName);
							onChange('address.state', '');
							onChange('address.city', '');
						}}
						renderInput={(params) => (
							<TextField
								{...params}
								label="Country"
								placeholder="Select Country"
								size="small"
								sx={inputSx}
								slotProps={{
									input: {
										...params.InputProps,
										startAdornment: (
											<>
												<InputAdornment position="start">
													<CountryIcon fontSize="small" sx={{ color: 'text.secondary', opacity: 0.7 }} />
												</InputAdornment>
												{params.InputProps.startAdornment}
											</>
										),
									}
								}}
							/>
						)}
					/>
				</Grid>

				{/* State */}
				<Grid size={{ xs: 12, md: 6 }}>
					<Autocomplete
						options={states}
						getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
						value={selectedStateObj || null}
						isOptionEqualToValue={(option, value) =>
							option.name === (typeof value === 'string' ? value : value?.name)
						}
						disabled={!selectedCountryObj}
						onChange={(_, v) => {
							const stateName = v && typeof v !== 'string' ? v.name : '';
							onChange('address.state', stateName);
							onChange('address.city', '');
						}}
						renderInput={(params) => (
							<TextField
								{...params}
								label="State / Province"
								placeholder="Select State"
								size="small"
								sx={inputSx}
								slotProps={{
									input: {
										...params.InputProps,
										startAdornment: (
											<>
												<InputAdornment position="start">
													<StateIcon fontSize="small" sx={{ color: 'text.secondary', opacity: 0.7 }} />
												</InputAdornment>
												{params.InputProps.startAdornment}
											</>
										),
									}
								}}
							/>
						)}
					/>
				</Grid>

				{/* City */}
				<Grid size={{ xs: 12, md: 6 }}>
					<Autocomplete
						options={cities}
						getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
						value={cities.find((c) => c.name === formData.address?.city) || null}
						isOptionEqualToValue={(option, value) =>
							option.name === (typeof value === 'string' ? value : value?.name)
						}
						disabled={!selectedStateObj}
						onChange={(_, v) => {
							const cityName = v && typeof v !== 'string' ? v.name : '';
							onChange('address.city', cityName);
						}}
						renderInput={(params) => (
							<TextField
								{...params}
								label="City"
								placeholder="Select City"
								size="small"
								sx={inputSx}
								slotProps={{
									input: {
										...params.InputProps,
										startAdornment: (
											<>
												<InputAdornment position="start">
													<CityIcon fontSize="small" sx={{ color: 'text.secondary', opacity: 0.7 }} />
												</InputAdornment>
												{params.InputProps.startAdornment}
											</>
										),
									}
								}}
							/>
						)}
					/>
				</Grid>

				{/* Pincode */}
				<Grid size={{ xs: 12, md: 6 }}>
					<TextField
						fullWidth
						label="Pincode / ZIP"
						placeholder="e.g. 560001"
						value={formData.address?.pincode ?? ''}
						onChange={(e) => onChange('address.pincode', e.target.value)}
						variant="outlined"
						size="small"
						sx={inputSx}
						slotProps={{
							input: {
								startAdornment: (
									<InputAdornment position="start">
										<ZipIcon fontSize="small" sx={{ color: 'text.secondary', opacity: 0.7 }} />
									</InputAdornment>
								),
							}
						}}
						helperText="Postal code for the office location"
					/>
				</Grid>
			</Grid>
		</Box>
	);
};

export default AddressTab;
