import React from 'react';
import {
	Grid,
	TextField,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Autocomplete,
	Typography,
	Box,
	InputAdornment,
	FormHelperText,
} from '@mui/material';
import {
	Business as BusinessIcon,
	Domain as IndustryIcon,
	Info as StatusIcon,
	Groups as SizeIcon,
} from '@mui/icons-material';
import type { Company } from '../../../../../models/company';
import { COMPANY_SIZES, COMPANY_STATUSES, COMPANY_INDUSTRIES } from '../../../../../data/companyData';

interface BasicInfoTabProps {
	formData: Partial<Company>;
	onChange: (field: string, value: unknown) => void;
}

/**
 * BasicInfoTab Component
 * Standardized form section for company identity and classification.
 * Follows enterprise-grade UX patterns with clear labeling and contextual icons.
 */
const BasicInfoTab: React.FC<BasicInfoTabProps> = ({ formData, onChange }) => {
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

	return (
		<Box sx={{ py: 1 }}>
			<Typography variant="subtitle2" color="text.secondary" sx={{ mb: 3, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
				Company Identity
			</Typography>

			<Grid container spacing={3}>
				{/* Company Name */}
				<Grid size={{ xs: 12, md: 8 }}>
					<TextField
						required
						fullWidth
						label="Company Legal Name"
						placeholder="e.g. WinVinaya Infosystems India Pvt Ltd"
						value={formData.name ?? ''}
						onChange={(e) => onChange('name', e.target.value)}
						variant="outlined"
						size="small"
						sx={inputSx}
						slotProps={{
							input: {
								startAdornment: (
									<InputAdornment position="start">
										<BusinessIcon fontSize="small" sx={{ color: 'text.secondary', opacity: 0.7 }} />
									</InputAdornment>
								),
							}
						}}
						helperText="The registered legal name of the organization"
					/>
				</Grid>

				{/* Status */}
				<Grid size={{ xs: 12, md: 4 }}>
					<FormControl fullWidth size="small" sx={inputSx}>
						<InputLabel>Business Status</InputLabel>
						<Select
							value={formData.status ?? 'prospect'}
							label="Business Status"
							onChange={(e) => onChange('status', e.target.value)}
							startAdornment={
								<InputAdornment position="start">
									<StatusIcon fontSize="small" sx={{ color: 'text.secondary', opacity: 0.7, mr: 1 }} />
								</InputAdornment>
							}
						>
							{COMPANY_STATUSES.map((s: { value: string; label: string }) => (
								<MenuItem key={s.value} value={s.value}>
									<Typography variant="body2">{s.label}</Typography>
								</MenuItem>
							))}
						</Select>
						<FormHelperText>Current partnership stage</FormHelperText>
					</FormControl>
				</Grid>

				{/* Industry */}
				<Grid size={{ xs: 12, md: 6 }}>
					<Autocomplete
						fullWidth
						size="small"
						options={COMPANY_INDUSTRIES}
						value={formData.industry || null}
						onChange={(_event, newValue) => onChange('industry', newValue)}
						renderInput={(params) => (
							<TextField
								{...params}
								label="Industry Sector"
								placeholder="Select primary industry"
								variant="outlined"
								sx={inputSx}
								slotProps={{
									input: {
										...params.InputProps,
										startAdornment: (
											<InputAdornment position="start">
												<IndustryIcon fontSize="small" sx={{ color: 'text.secondary', opacity: 0.7 }} />
											</InputAdornment>
										),
									}
								}}
							/>
						)}
					/>
					<FormHelperText sx={{ mt: 0.5, ml: 1.5 }}>Primary business vertical</FormHelperText>
				</Grid>

				{/* Company Size */}
				<Grid size={{ xs: 12, md: 6 }}>
					<FormControl fullWidth size="small" sx={inputSx}>
						<InputLabel>Organization Size</InputLabel>
						<Select
							value={formData.company_size ?? 'micro'}
							label="Organization Size"
							onChange={(e) => onChange('company_size', e.target.value)}
							startAdornment={
								<InputAdornment position="start">
									<SizeIcon fontSize="small" sx={{ color: 'text.secondary', opacity: 0.7, mr: 1 }} />
								</InputAdornment>
							}
						>
							{COMPANY_SIZES.map((s: { value: string; label: string }) => (
								<MenuItem key={s.value} value={s.value}>
									<Typography variant="body2">{s.label}</Typography>
								</MenuItem>
							))}
						</Select>
						<FormHelperText>Total employee count range</FormHelperText>
					</FormControl>
				</Grid>
			</Grid>
		</Box>
	);
};

export default BasicInfoTab;
