import React from 'react';
import { Box, Typography, Grid, TextField, useTheme } from '@mui/material';
import type { StepProps } from './types';
import { getInputSx } from './styles';

const UserBasicInfo: React.FC<StepProps> = ({
	formData,
	handleChange,
	loading,
	mode
}) => {
	const theme = useTheme();
	const inputSx = getInputSx(theme);

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
			<Box>
				<Typography variant="awsSectionTitle" sx={{ mb: 2, color: theme.palette.primary.main }}>
					Account Identity
				</Typography>
				<Grid container spacing={3}>
					<Grid size={{ xs: 12, md: 6 }}>
						<Typography variant="awsFieldLabel">Full Name</Typography>
						<TextField
							id="user-full-name"
							name="full_name"
							fullWidth
							size="small"
							value={formData.full_name}
							onChange={(e) => handleChange('full_name', e.target.value)}
							disabled={loading || mode === 'view'}
							placeholder="e.g. John Doe"
							sx={inputSx}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 6 }}>
						<Typography variant="awsFieldLabel">Username</Typography>
						<TextField
							id="user-username"
							name="username"
							fullWidth
							size="small"
							value={formData.username}
							onChange={(e) => handleChange('username', e.target.value)}
							disabled={loading || mode === 'view'}
							placeholder="unique_username"
							sx={inputSx}
						/>
					</Grid>
				</Grid>
			</Box>

			<Box>
				<Typography variant="awsSectionTitle" sx={{ mb: 2, color: theme.palette.primary.main }}>
					Communication Channels
				</Typography>
				<Grid container spacing={3}>
					<Grid size={{ xs: 12, md: 6 }}>
						<Typography variant="awsFieldLabel">Email Address</Typography>
						<TextField
							id="user-email"
							name="email"
							fullWidth
							size="small"
							value={formData.email}
							onChange={(e) => handleChange('email', e.target.value)}
							disabled={loading || mode === 'view'}
							placeholder="user@example.com"
							sx={inputSx}
						/>
					</Grid>
					<Grid size={{ xs: 12, md: 6 }}>
						<Typography variant="awsFieldLabel">WhatsApp Number</Typography>
						<TextField
							id="user-mobile"
							name="mobile"
							fullWidth
							size="small"
							value={formData.mobile}
							onChange={(e) => handleChange('mobile', e.target.value)}
							disabled={loading || mode === 'view'}
							placeholder="e.g. 919876543210"
							helperText={mode !== 'view' ? "Format: 91 followed by 10 digits" : ""}
							sx={inputSx}
						/>
					</Grid>
				</Grid>
			</Box>
		</Box>
	);
};

export default UserBasicInfo;
