import React from 'react';
import { Box } from '@mui/material';
import WelcomeHeader from '../../components/dashboard/WelcomeHeader';

const Dashboard: React.FC = () => {
	return (
		<Box component="main" sx={{ p: { xs: 1, sm: 0 } }}>
			<WelcomeHeader />
		</Box>
	);
};

export default Dashboard;
