import React from 'react';
import { Box } from '@mui/material';
import WelcomeHeader from '../../components/dashboard/WelcomeHeader';
import { InfraHealthPanel } from '../../components/dashboard/InfraHealthPanel';

const Dashboard: React.FC = () => {
	return (
		<Box component="main" sx={{ p: { xs: 1, sm: 0 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
			<WelcomeHeader />
			<InfraHealthPanel />
		</Box>
	);
};

export default Dashboard;
