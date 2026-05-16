import React from 'react';
import { Box, Typography, Grid, FormControl, Select, MenuItem, FormControlLabel, Switch, alpha, useTheme } from '@mui/material';
import { format } from 'date-fns';
import type { StepProps } from './types';

const UserPermissions: React.FC<StepProps> = ({
	formData,
	handleChange,
	loading,
	mode,
	roles = [],
	user
}) => {
	const theme = useTheme();

	const formatRoleName = (role: string) => {
		return role
			.split('_')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	};

	const formatDate = (dateString?: string) => {
		if (!dateString) return '-';
		try {
			return format(new Date(dateString), 'PPP');
		} catch {
			return '-';
		}
	};

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
			<Box>
				<Typography variant="awsSectionTitle" sx={{ mb: 2, color: theme.palette.primary.main }}>
					System Authorization
				</Typography>
				<Grid container spacing={3}>
					<Grid size={{ xs: 12, md: 6 }}>
						<Typography variant="awsFieldLabel">Managed Security Role</Typography>
						<FormControl fullWidth size="small">
							<Select
								value={formData.role}
								onChange={(e) => handleChange('role', e.target.value)}
								disabled={loading || mode === 'view'}
								sx={{ borderRadius: '4px', bgcolor: theme.palette.background.paper }}
							>
								{roles.map((role) => (
									<MenuItem key={role} value={role}>
										{formatRoleName(role)}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Grid>
				</Grid>
			</Box>

			{mode !== 'add' && (
				<Box>
					<Typography variant="awsSectionTitle" sx={{ mb: 2, color: theme.palette.primary.main }}>
						Lifecycle Governance
					</Typography>
					<Box sx={{ p: 3, bgcolor: alpha(theme.palette.background.paper, 0.4), border: `1px solid ${theme.palette.divider}`, borderRadius: '4px' }}>
						<FormControlLabel
							control={
								<Switch
									checked={formData.is_active}
									onChange={(e) => handleChange('is_active', e.target.checked)}
									disabled={loading || mode === 'view'}
									color="success"
								/>
							}
							label={
								<Typography variant="body2" sx={{ fontWeight: 700 }}>
									ACCOUNT STATE: {formData.is_active ? 'ACTIVE' : 'LOCKED'}
								</Typography>
							}
						/>
						<Grid container spacing={3} sx={{ mt: 2 }}>
							{mode === 'view' && user && (
								<>
									<Grid size={{ xs: 6 }}>
										<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled', display: 'block' }}>AUDIT: INITIALIZED</Typography>
										<Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDate(user.created_at)}</Typography>
									</Grid>
									<Grid size={{ xs: 6 }}>
										<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled', display: 'block' }}>AUDIT: LAST SYNC</Typography>
										<Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDate(user.updated_at)}</Typography>
									</Grid>
								</>
							)}
						</Grid>
					</Box>
				</Box>
			)}
		</Box>
	);
};

export default UserPermissions;
