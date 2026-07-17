import React, { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { CheckCircleOutline as CheckCircleIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import EmailOtpForm from '../../EmailOtpForm';

interface SuccessStepProps {
	successMsg: string;
	email: string;
	onVerified?: () => void;
}

const SuccessStep: React.FC<SuccessStepProps> = ({ successMsg, email, onVerified }) => {
	const navigate = useNavigate();
	const [verified, setVerified] = useState(false);

	if (verified) {
		return (
			<Box sx={{ textAlign: 'center', py: 2 }}>
				<CheckCircleIcon sx={{ fontSize: 72, color: '#10b981', mb: 2 }} />
				<Typography variant="h5" sx={{ fontWeight: 700, color: '#F4F5F7', mb: 2 }}>
					Email Verified!
				</Typography>
				<Typography variant="body1" sx={{ color: '#94A3B8', mb: 4 }}>
					Your account is ready. You can log in now.
				</Typography>
				<Button
					variant="contained"
					fullWidth
					onClick={() => navigate('/auth/login')}
					sx={{
						py: 1.25,
						backgroundColor: '#8B7CF6',
						color: '#ffffff',
						'&:hover': {
							backgroundColor: '#7a6ae6',
							boxShadow: '0 4px 12px rgba(139, 124, 246, 0.3)',
						},
						textTransform: 'none',
						fontWeight: 700,
						borderRadius: 1.5,
					}}
				>
					Proceed to Sign In
				</Button>
			</Box>
		);
	}

	return (
		<Box>
			<Typography variant="body2" sx={{ color: '#94A3B8', textAlign: 'center', mb: 2 }}>
				{successMsg}
			</Typography>
			<EmailOtpForm
				email={email}
				onVerified={() => {
					setVerified(true);
					onVerified?.();
				}}
			/>
		</Box>
	);
};

export default SuccessStep;
