import React from 'react';
import {
	Box,
	Typography,
	Button,
	TextField,
	InputAdornment,
	Autocomplete,
	MenuItem,
	CircularProgress,
} from '@mui/material';
import {
	BusinessOutlined as BusinessIcon,
	RoomOutlined as RoomIcon,
	PeopleAltOutlined as PeopleIcon,
	WorkOutline as WorkIcon,
} from '@mui/icons-material';

interface OrganizationStepProps {
	orgName: string;
	setOrgName: (val: string) => void;
	orgNameStatus: 'idle' | 'validating' | 'available' | 'error';
	orgNameMessage: string;
	orgLocation: string;
	setOrgLocation: (val: string) => void;
	companySize: string;
	setCompanySize: (val: string) => void;
	industry: string;
	setIndustry: (val: string) => void;
	locationOptions: string[];
	locationLoading: boolean;
	locationInputValue: string;
	setLocationInputValue: (val: string) => void;
	onNext: () => void;
	nextDisabled: boolean;
}

const OrganizationStep: React.FC<OrganizationStepProps> = ({
	orgName,
	setOrgName,
	orgNameStatus,
	orgNameMessage,
	orgLocation,
	setOrgLocation,
	companySize,
	setCompanySize,
	industry,
	setIndustry,
	locationOptions,
	locationLoading,
	locationInputValue,
	setLocationInputValue,
	onNext,
	nextDisabled,
}) => {
	return (
		<Box component="div">

			<Box sx={{ mb: 1.25 }}>
				<Typography
					sx={{
						fontSize: '0.675rem',
						fontWeight: 700,
						color: '#94A3B8',
						textTransform: 'uppercase',
						letterSpacing: '0.05em',
						mb: 0.75,
						display: 'block'
					}}
				>
					Organization Name *
				</Typography>
				<TextField
					required
					fullWidth
					id="orgName"
					placeholder="e.g. Acme Corporation"
					size="small"
					value={orgName}
					onChange={(e) => setOrgName(e.target.value)}
					error={orgNameStatus === 'error'}
					helperText={orgNameMessage}
					FormHelperTextProps={{
						sx: {
							color: orgNameStatus === 'available' ? '#10b981' : orgNameStatus === 'error' ? '#ef4444' : '#64748b',
							fontSize: '0.725rem',
							mt: 0.5
						}
					}}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<BusinessIcon sx={{ color: '#64748b', fontSize: 18, mr: 0.5 }} />
							</InputAdornment>
						),
						endAdornment: orgNameStatus === 'validating' ? (
							<InputAdornment position="end">
								<CircularProgress size={16} color="inherit" sx={{ color: '#64748b' }} />
							</InputAdornment>
						) : null
					}}
					sx={{
						'& .MuiOutlinedInput-root': {
							bgcolor: '#191c28',
							borderRadius: 1.5,
							color: '#F4F5F7',
							border: orgNameStatus === 'available' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
							'& fieldset': { border: 'none' },
							'&:hover': { border: orgNameStatus === 'available' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.15)' },
							'&.Mui-focused': {
								border: orgNameStatus === 'available' ? '1px solid #10b981' : orgNameStatus === 'error' ? '1px solid #ef4444' : '1px solid #8B7CF6',
								boxShadow: orgNameStatus === 'available' ? '0 0 0 3px rgba(16, 185, 129, 0.15)' : orgNameStatus === 'error' ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : '0 0 0 3px rgba(139, 124, 246, 0.15)'
							}
						},
						'& input::placeholder': { color: '#64748b', opacity: 1 },
						'& input:-webkit-autofill': {
							WebkitBoxShadow: '0 0 0 1000px #191c28 inset !important',
							WebkitTextFillColor: '#F4F5F7 !important',
						}
					}}
				/>
			</Box>

			{/* Location Autocomplete (dynamic enterprise geocoding) */}
			<Box sx={{ mb: 1.5 }}>
				<Typography
					sx={{
						fontSize: '0.675rem',
						fontWeight: 700,
						color: '#94A3B8',
						textTransform: 'uppercase',
						letterSpacing: '0.05em',
						mb: 0.75,
						display: 'block'
					}}
				>
					Location *
				</Typography>
				<Autocomplete
					id="orgLocation"
					freeSolo
					options={locationOptions}
					loading={locationLoading}
					value={orgLocation}
					onChange={(_, newValue) => setOrgLocation(newValue || '')}
					inputValue={locationInputValue}
					onInputChange={(_, newInputValue) => setLocationInputValue(newInputValue)}
					// Options already come pre-filtered by the geocoding API for the typed
					// text — MUI's default client-side filter re-matches the input against
					// the option label, which hides results whenever the search term is a
					// misspelling/alias of the returned name (e.g. "Bangalore" input vs a
					// "Bengaluru, Karnataka" result). Disable it so server results always show.
					filterOptions={(options) => options}
					slotProps={{
						paper: {
							sx: {
								bgcolor: '#11141e',
								color: '#F4F5F7',
								border: '1px solid rgba(255, 255, 255, 0.08)',
								'& .MuiAutocomplete-option': {
									'&:hover': {
										bgcolor: 'rgba(255, 255, 255, 0.05)',
									},
									'&[aria-selected="true"]': {
										bgcolor: 'rgba(139, 124, 246, 0.2)',
										'&:hover': {
											bgcolor: 'rgba(139, 124, 246, 0.3)',
										}
									}
								}
							}
						}
					}}
					renderInput={(params) => (
						<TextField
							{...params}
							required
							placeholder="Search location (e.g. Bangalore, Karnataka)"
							size="small"
							InputProps={{
								...params.InputProps,
								startAdornment: (
									<InputAdornment position="start">
										<RoomIcon sx={{ color: '#64748b', fontSize: 18, mr: 0.5 }} />
									</InputAdornment>
								),
								endAdornment: (
									<>
										{locationLoading ? <CircularProgress color="inherit" size={16} /> : null}
										{params.InputProps.endAdornment}
									</>
								)
							}}
							sx={{
								'& .MuiOutlinedInput-root': {
									bgcolor: '#191c28',
									borderRadius: 1.5,
									color: '#F4F5F7',
									border: '1px solid rgba(255, 255, 255, 0.08)',
									'& fieldset': { border: 'none' },
									'&:hover': { border: '1px solid rgba(255, 255, 255, 0.15)' },
									'&.Mui-focused': {
										border: '1px solid #8B7CF6',
										boxShadow: '0 0 0 3px rgba(139, 124, 246, 0.15)'
									}
								},
								'& input::placeholder': { color: '#64748b', opacity: 1 },
								'& input:-webkit-autofill': {
									WebkitBoxShadow: '0 0 0 1000px #191c28 inset !important',
									WebkitTextFillColor: '#F4F5F7 !important',
								}
							}}
						/>
					)}
				/>
			</Box>

			{/* Company Size Select */}
			<Box sx={{ mb: 1.5 }}>
				<Typography
					sx={{
						fontSize: '0.675rem',
						fontWeight: 700,
						color: '#94A3B8',
						textTransform: 'uppercase',
						letterSpacing: '0.05em',
						mb: 0.75,
						display: 'block'
					}}
				>
					Company Size *
				</Typography>
				<TextField
					select
					required
					fullWidth
					id="companySize"
					size="small"
					value={companySize}
					onChange={(e) => setCompanySize(e.target.value)}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<PeopleIcon sx={{ color: '#64748b', fontSize: 18, mr: 0.5 }} />
							</InputAdornment>
						)
					}}
					SelectProps={{
						displayEmpty: true,
						MenuProps: {
							PaperProps: {
								sx: {
									bgcolor: '#11141e',
									color: '#F4F5F7',
									border: '1px solid rgba(255, 255, 255, 0.08)',
									'& .MuiMenuItem-root:hover': {
										bgcolor: 'rgba(255, 255, 255, 0.05)',
									},
									'& .MuiMenuItem-root.Mui-selected': {
										bgcolor: 'rgba(139, 124, 246, 0.2)',
										'&:hover': {
											bgcolor: 'rgba(139, 124, 246, 0.3)',
										}
									}
								}
							}
						}
					}}
					sx={{
						'& .MuiOutlinedInput-root': {
							bgcolor: '#191c28',
							borderRadius: 1.5,
							color: '#F4F5F7',
							border: '1px solid rgba(255, 255, 255, 0.08)',
							'& fieldset': { border: 'none' },
							'&:hover': { border: '1px solid rgba(255, 255, 255, 0.15)' },
							'&.Mui-focused': {
								border: '1px solid #8B7CF6',
								boxShadow: '0 0 0 3px rgba(139, 124, 246, 0.15)'
							}
						},
						'& .MuiSvgIcon-root': {
							color: '#64748b'
						}
					}}
				>
					<MenuItem value="" disabled sx={{ color: '#64748b' }}>Select company size</MenuItem>
					<MenuItem value="1-10">1-10 employees</MenuItem>
					<MenuItem value="11-50">11-50 employees</MenuItem>
					<MenuItem value="51-200">51-200 employees</MenuItem>
					<MenuItem value="201-500">201-500 employees</MenuItem>
					<MenuItem value="500+">500+ employees</MenuItem>
				</TextField>
			</Box>

			{/* Industry Select */}
			<Box sx={{ mb: 2 }}>
				<Typography
					sx={{
						fontSize: '0.675rem',
						fontWeight: 700,
						color: '#94A3B8',
						textTransform: 'uppercase',
						letterSpacing: '0.05em',
						mb: 0.75,
						display: 'block'
					}}
				>
					Industry *
				</Typography>
				<TextField
					select
					required
					fullWidth
					id="industry"
					size="small"
					value={industry}
					onChange={(e) => setIndustry(e.target.value)}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<WorkIcon sx={{ color: '#64748b', fontSize: 18, mr: 0.5 }} />
							</InputAdornment>
						)
					}}
					SelectProps={{
						displayEmpty: true,
						MenuProps: {
							PaperProps: {
								sx: {
									bgcolor: '#11141e',
									color: '#F4F5F7',
									border: '1px solid rgba(255, 255, 255, 0.08)',
									'& .MuiMenuItem-root:hover': {
										bgcolor: 'rgba(255, 255, 255, 0.05)',
									},
									'& .MuiMenuItem-root.Mui-selected': {
										bgcolor: 'rgba(139, 124, 246, 0.2)',
										'&:hover': {
											bgcolor: 'rgba(139, 124, 246, 0.3)',
										}
									}
								}
							}
						}
					}}
					sx={{
						'& .MuiOutlinedInput-root': {
							bgcolor: '#191c28',
							borderRadius: 1.5,
							color: '#F4F5F7',
							border: '1px solid rgba(255, 255, 255, 0.08)',
							'& fieldset': { border: 'none' },
							'&:hover': { border: '1px solid rgba(255, 255, 255, 0.15)' },
							'&.Mui-focused': {
								border: '1px solid #8B7CF6',
								boxShadow: '0 0 0 3px rgba(139, 124, 246, 0.15)'
							}
						},
						'& .MuiSvgIcon-root': {
							color: '#64748b'
						}
					}}
				>
					<MenuItem value="" disabled sx={{ color: '#64748b' }}>Select industry</MenuItem>
					<MenuItem value="Technology">Technology & Software</MenuItem>
					<MenuItem value="Healthcare">Healthcare & Life Sciences</MenuItem>
					<MenuItem value="Finance">Finance & Insurance</MenuItem>
					<MenuItem value="Education">Education & E-Learning</MenuItem>
					<MenuItem value="Non-Profit">Non-Profit & NGO</MenuItem>
					<MenuItem value="Professional Services">Professional Services & Consulting</MenuItem>
					<MenuItem value="Manufacturing">Manufacturing & Logistics</MenuItem>
					<MenuItem value="Retail">Retail & E-Commerce</MenuItem>
					<MenuItem value="Other">Other</MenuItem>
				</TextField>
			</Box>

			<Button
				variant="contained"
				fullWidth
				onClick={onNext}
				disabled={nextDisabled}
				sx={{
					py: 1.15,
					backgroundColor: '#8B7CF6',
					color: '#ffffff',
					'&:hover': {
						backgroundColor: '#7a6ae6',
						boxShadow: '0 4px 12px rgba(139, 124, 246, 0.3)'
					},
					textTransform: 'none',
					fontWeight: 700,
					borderRadius: 1.5,
				}}
			>
				Next
			</Button>
		</Box>
	);
};

export default OrganizationStep;
