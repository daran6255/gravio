import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { MarkEmailReadOutlined as MarkEmailReadIcon } from '@mui/icons-material';
import authService from '../../../services/authService';
import useToast from '../../../hooks/useToast';

const RESEND_COOLDOWN_SECONDS = 120;

interface SuccessStepProps {
	successMsg: string;
	email: string;
	onReturnToLogin: () => void;
}

const formatCountdown = (seconds: number): string => {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}:${s.toString().padStart(2, '0')}`;
};

const SuccessStep: React.FC<SuccessStepProps> = ({ successMsg, email, onReturnToLogin }) => {
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

			{secondsLeft > 0 ? (
				<Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2 }}>
					Didn't get it? You can request a new link in {formatCountdown(secondsLeft)}
				</Typography>
			) : (
				<Button
					variant="outlined"
					fullWidth
					onClick={handleResend}
					disabled={resending}
					sx={{
						mb: 2,
						py: 1.1,
						borderColor: 'rgba(139, 124, 246, 0.4)',
						color: '#8B7CF6',
						'&:hover': {
							borderColor: '#8B7CF6',
							backgroundColor: 'rgba(139, 124, 246, 0.08)',
						},
						textTransform: 'none',
						fontWeight: 700,
						borderRadius: 1.5,
					}}
				>
					{resending ? <CircularProgress size={20} color="inherit" /> : 'Resend verification email'}
				</Button>
			)}

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
