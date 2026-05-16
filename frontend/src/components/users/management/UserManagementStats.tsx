import React from 'react';
import { Box } from '@mui/material';
import UserStatCards from '../stats/UserStatCards';

interface UserManagementStatsProps {
	refreshKey: number;
}

const UserManagementStats: React.FC<UserManagementStatsProps> = ({ refreshKey }) => {
	return (
		<Box sx={{ mb: 4 }}>
			<UserStatCards key={`stats-${refreshKey}`} />
		</Box>
	);
};

export default UserManagementStats;
