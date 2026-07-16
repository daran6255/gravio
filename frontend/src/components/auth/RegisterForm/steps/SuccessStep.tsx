import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { MarkEmailReadOutlined as MarkEmailReadIcon } from '@mui/icons-material';
import authService from '../../../../services/authService';
import useToast from '../../../../hooks/useToast';

const RESEND_COOLDOWN_SECONDS = 120;

interface SuccessStepProps {
	successMsg: string;
	email: string;
}

const formatCountdown = (seconds: number): string => {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}:${s.toString().padStart(2, '0')}`;
};

const SuccessStep: React.FC<SuccessStepProps> = ({ successMsg, email }) => {
	const toast = useToast();
	const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);
	const [resending, setResending] = useState(false);

	useEffect(() => {
		if (secondsLeft <= 0) return;
		const timer = setTimeout(() => setSecondsLeft((prev) => prev - 1), 1000);
		return () => clearTimeout(timer);
	}, [secondsLeft]);

	const handleResend = async () => {
		setResending(true);
		try {
			await authService.resendVerification(email);
			toast.success("Verification email sent — check your inbox (and spam folder).");
			setSecondsLeft(RESEND_COOLDOWN_SECONDS);
		} catch (err: any) {
			const message =
				err?.response?.data?.error?.message ||
				err?.response?.data?.detail ||
				'Failed to resend the verification email. Please try again.';
			toast.error(message);
		} finally {
			setResending(false);
		}
	};

	return (
		<Box sx={{ textAlign: 'center', py: 2 }}>
			<MarkEmailReadIcon sx={{ fontSize: 72, color: '#10b981', mb: 3 }} />
			<Typography variant="h5" sx={{ fontWeight: 700, color: '#F4F5F7', mb: 2 }}>
				Check your email
			</Typography>
			<Typography variant="body1" sx={{ color: '#94A3B8', mb: 1 }}>
				{successMsg}
			</Typography>
			<Typography variant="body2" sx={{ color: '#94A3B8', mb: 4 }}>
				We've sent a verification link to{' '}
				<Box component="span" sx={{ color: '#F4F5F7', fontWeight: 600 }}>
					{email}
				</Box>
				. You must verify your email before you can log in.
			</Typography>

			<Button
				variant="contained"
				fullWidth
				onClick={handleResend}
				disabled={resending || secondsLeft > 0}
				sx={{
					mb: 1.5,
					py: 1.25,
					backgroundColor: '#8B7CF6',
					color: '#ffffff',
					'&:hover': {
						backgroundColor: '#7a6ae6',
						boxShadow: '0 4px 12px rgba(139, 124, 246, 0.3)'
					},
					'&.Mui-disabled': {
						backgroundColor: 'rgba(139, 124, 246, 0.12)',
						color: '#94A3B8',
					},
					textTransform: 'none',
					fontWeight: 700,
					borderRadius: 1.5,
				}}
			>
				{resending ? (
					<CircularProgress size={20} color="inherit" />
				) : secondsLeft > 0 ? (
					`Resend available in ${formatCountdown(secondsLeft)}`
				) : (
					'Resend verification email'
				)}
			</Button>
		</Box>
	);
};

export default SuccessStep;
