import React, { useEffect } from 'react';
import { Container, Box, Alert, Skeleton, Typography, Paper, useTheme, alpha } from '@mui/material';
import HRLayout from '../../../components/hr/HRLayout';
import EmployeeDetailsPanel from '../../../components/hr/user/profile/EmployeeDetailsPanel';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchEmployeeByUserId } from '../../../store/slices/hrSlice';

export const EmployeeProfilePage: React.FC = () => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const currentUser = useAppSelector((state) => state.auth.user);
	const { currentEmployee, currentEmployeeLoading, currentEmployeeError } = useAppSelector((state) => state.hr);

	useEffect(() => {
		if (currentUser?.id) {
			dispatch(fetchEmployeeByUserId(currentUser.id));
		}
	}, [dispatch, currentUser?.id]);

	return (
		<HRLayout title="My HR Profile" subtitle="View and manage your employment records and details.">
			<Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
				{currentEmployeeLoading && (
					<Box sx={{ width: '100%' }}>
						<Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2, mb: 3 }} />
						<Grid container spacing={3}>
							<Grid size={{ xs: 12, md: 6 }}>
								<Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} />
							</Grid>
							<Grid size={{ xs: 12, md: 6 }}>
								<Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} />
							</Grid>
						</Grid>
					</Box>
				)}

				{!currentEmployeeLoading && currentEmployeeError && (
					<Alert severity="error" sx={{ mb: 3 }}>
						{currentEmployeeError}
					</Alert>
				)}

				{!currentEmployeeLoading && !currentEmployeeError && !currentEmployee && (
					<Paper
						sx={{
							p: 5,
							textAlign: 'center',
							background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.03)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
							border: `1px dashed ${theme.palette.warning.light}`,
							borderRadius: 2,
						}}
					>
						<Typography variant="h6" fontWeight={700} gutterBottom>
							Profile Record Not Found
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Your official employee profile has not been registered in the HR system by your administrator yet. 
							Please contact HR admin to complete your workforce onboarding.
						</Typography>
					</Paper>
				)}

				{!currentEmployeeLoading && !currentEmployeeError && currentEmployee && (
					<EmployeeDetailsPanel employee={currentEmployee} />
				)}
			</Container>
		</HRLayout>
	);
};

// Helper grid wrapper since MUI Grid is imported in DetailsPanel but needed for Skeleton
import { Grid } from '@mui/material';

export default EmployeeProfilePage;
