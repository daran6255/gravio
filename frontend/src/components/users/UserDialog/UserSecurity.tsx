import React, { useState } from 'react';
import { Box, Typography, Grid, TextField, InputAdornment, IconButton, alpha, useTheme } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import type { StepProps } from './types';
import { getInputSx } from './styles';

const UserSecurity: React.FC<StepProps> = ({
	formData,
	handleChange,
	loading,
	mode
}) => {
	const theme = useTheme();
	const inputSx = getInputSx(theme);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
			<Box>
				<Typography variant="awsSectionTitle" sx={{ mb: 2, color: theme.palette.primary.main }}>
					Credential Policy
				</Typography>
				{mode === 'view' ? (
					<Box sx={{ py: 6, px: 2, textAlign: 'center', bgcolor: alpha(theme.palette.info.main, 0.03), border: `1px dashed ${theme.palette.info.light}`, borderRadius: '4px' }}>
						<Typography variant="body2" color="info.main" sx={{ fontWeight: 600 }}>
							Individual secrets are encrypted and managed via the identity provider.
						</Typography>
					</Box>
				) : (
					<Grid container spacing={3}>
						{/* Hidden honey-pot fields to capture browser autofill and prevent it from leaking to table search */}
						<input 
							type="text" 
							name="email" 
							id="honey-pot-email" 
							style={{ display: 'none' }} 
							tabIndex={-1} 
							autoComplete="username"
						/>
						
						<Grid size={{ xs: 12, md: 6 }}>
							<Typography variant="awsFieldLabel">
								{mode === 'edit' ? 'Update Domain Password' : 'Initial Password'}
							</Typography>
							<TextField
								id="user-password"
								name="password"
								fullWidth
								size="small"
								type={showPassword ? 'text' : 'password'}
								value={formData.password}
								onChange={(e) => handleChange('password', e.target.value)}
								disabled={loading}
								placeholder={mode === 'edit' ? "Enter only if updating" : "Complexity required"}
								sx={inputSx}
								inputProps={{
									autoComplete: 'new-password'
								}}
								InputProps={{
									endAdornment: (
										<InputAdornment position="end">
											<IconButton onClick={() => setShowPassword(!showPassword)} size="small">
												{showPassword ? <VisibilityOff /> : <Visibility />}
											</IconButton>
										</InputAdornment>
									),
								}}
							/>
						</Grid>
						{(mode === 'add' || formData.password) && (
							<Grid size={{ xs: 12, md: 6 }}>
								<Typography variant="awsFieldLabel">Verify Lifecycle Credentials</Typography>
								<TextField
									id="user-confirm-password"
									name="confirm-password"
									fullWidth
									size="small"
									type={showConfirmPassword ? 'text' : 'password'}
									value={formData.confirmPassword}
									onChange={(e) => handleChange('confirmPassword', e.target.value)}
									disabled={loading}
									placeholder="Re-enter for verification"
									sx={inputSx}
									inputProps={{
										autoComplete: 'new-password'
									}}
									InputProps={{
										endAdornment: (
											<InputAdornment position="end">
												<IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} size="small">
													{showConfirmPassword ? <VisibilityOff /> : <Visibility />}
												</IconButton>
											</InputAdornment>
										),
									}}
								/>
							</Grid>
						)}
					</Grid>
				)}
			</Box>
		</Box>
	);
};

export default UserSecurity;
