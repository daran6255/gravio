import React from 'react';
import { Box } from '@mui/material';
import Grid from '@mui/material/Grid';
import ApiSpeedometer from '../../components/dashboard/ApiSpeedometer';
import SystemHealthMonitor from '../../components/dashboard/SystemHealthMonitor';
import WelcomeHeader from '../../components/dashboard/WelcomeHeader';

const Dashboard: React.FC = () => {
	return (
		<Box component="main" sx={{ p: { xs: 1, sm: 0 } }}>
			<WelcomeHeader />

			<Grid container spacing={3} sx={{ mt: 1, alignItems: 'stretch' }}>
				<Grid size={{ xs: 12, md: 6 }}>
					<ApiSpeedometer />
				</Grid>
				<Grid size={{ xs: 12, md: 6 }}>
					<SystemHealthMonitor />
				</Grid>
			</Grid>
		</Box>
	);
};

export default Dashboard;
