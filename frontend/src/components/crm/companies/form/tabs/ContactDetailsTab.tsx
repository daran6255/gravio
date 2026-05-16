import React from 'react';
import {
	Grid,
	TextField,
	Typography,
	Box,
	InputAdornment
} from '@mui/material';
import {
	Email as EmailIcon,
	Language as WebIcon
} from '@mui/icons-material';
import { MuiTelInput } from 'mui-tel-input';
import usePhoneValidation from '../../../../../hooks/usePhoneValidation';
import type { Company } from '../../../../../models/company';

interface ContactDetailsTabProps {
	formData: Partial<Company>;
	onChange: (field: string, value: unknown) => void;
}

/**
 * ContactDetailsTab Component
 * Standardized form section for corporate communication channels.
 * Features enterprise-grade input validation cues and clear visual hierarchy.
 */
const ContactDetailsTab: React.FC<ContactDetailsTabProps> = ({ formData, onChange }) => {
	const { validatePhoneChange } = usePhoneValidation();

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
				Communication Channels
			</Typography>

			<Grid container spacing={3}>
				{/* Work Email */}
				<Grid size={{ xs: 12, md: 6 }}>
					<TextField
						fullWidth
						label="Corporate Email"
						placeholder="e.g. contact@winvinaya.com"
						type="email"
						value={formData.email ?? ''}
						onChange={(e) => onChange('email', e.target.value)}
						variant="outlined"
						size="small"
						sx={inputSx}
						slotProps={{
							input: {
								startAdornment: (
									<InputAdornment position="start">
										<EmailIcon fontSize="small" sx={{ color: 'text.secondary', opacity: 0.7 }} />
									</InputAdornment>
								),
							}
						}}
						helperText="Primary business email address"
					/>
				</Grid>

				{/* Phone Number */}
				<Grid size={{ xs: 12, md: 6 }}>
					<MuiTelInput
						fullWidth
						label="Contact Number"
						placeholder="e.g. +91 98765 43210"
						value={formData.phone ?? ''}
						onChange={(value, info) => {
							if (validatePhoneChange(info)) {
								onChange('phone', value);
							}
						}}
						defaultCountry="IN"
						preferredCountries={['IN', 'US', 'GB']}
						variant="outlined"
						size="small"
						sx={inputSx}
						helperText="Direct or office contact number"
					/>
				</Grid>

				{/* Website */}
				<Grid size={{ xs: 12 }}>
					<TextField
						fullWidth
						label="Company Website"
						value={formData.website ?? ''}
						placeholder="e.g. https://winvinaya.com"
						onChange={(e) => onChange('website', e.target.value)}
						variant="outlined"
						size="small"
						sx={inputSx}
						slotProps={{
							input: {
								startAdornment: (
									<InputAdornment position="start">
										<WebIcon fontSize="small" sx={{ color: 'text.secondary', opacity: 0.7 }} />
									</InputAdornment>
								),
							}
						}}
						helperText="Official website URL for company profile"
					/>
				</Grid>
			</Grid>
		</Box>
	);
};

export default ContactDetailsTab;
