import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { CheckCircleOutline as CheckCircleIcon } from '@mui/icons-material';

interface SuccessStepProps {
	successMsg: string;
	onReturnToLogin: () => void;
}

const SuccessStep: React.FC<SuccessStepProps> = ({ successMsg, onReturnToLogin }) => {
	return (
		<Box sx={{ textAlign: 'center', py: 2 }}>
			<CheckCircleIcon sx={{ fontSize: 72, color: '#10b981', mb: 3 }} />
			<Typography variant="h5" sx={{ fontWeight: 700, color: '#F4F5F7', mb: 2 }}>
				Registration Success!
			</Typography>
			<Typography variant="body1" sx={{ color: '#94A3B8', mb: 4 }}>
				{successMsg}
			</Typography>
			<Button
				variant="contained"
				fullWidth
				onClick={onReturnToLogin}
				sx={{
					py: 1.25,
					backgroundColor: '#8B7CF6',
					color: '#ffffff',
					'&:hover': {
						backgroundColor: '#7a6ae6',
						boxShadow: '0 4px 12px rgba(139, 124, 246, 0.3)'
					},
					textTransform: 'none',
					fontWeight: 700,
					borderRadius: 1.5,
				}}
			>
				Return to Login
			</Button>
		</Box>
	);
};

export default SuccessStep;
