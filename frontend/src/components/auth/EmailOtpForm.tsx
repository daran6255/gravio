import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Button, TextField, CircularProgress, InputAdornment } from '@mui/material';
import { MarkEmailReadOutlined as MarkEmailReadIcon, MailOutline as MailIcon } from '@mui/icons-material';
import authService from '../../services/authService';
import useToast from '../../hooks/useToast';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 120;

interface EmailOtpFormProps {
	/** Email address the code was (or will be) sent to. */
	email: string;
	/**
	 * When true, the email address isn't known yet — the form starts by asking
	 * for it and sending a fresh code, instead of assuming one was just sent.
	 * Used when this page is reached directly rather than right after registering.
	 */
	editableEmail?: boolean;
	/** Called with the backend's success message once the code is confirmed. */
	onVerified: (message: string) => void;
}

const formatCountdown = (seconds: number): string => {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}:${s.toString().padStart(2, '0')}`;
};

const EmailOtpForm: React.FC<EmailOtpFormProps> = ({ email, editableEmail = false, onVerified }) => {
	const toast = useToast();
	const [emailInput, setEmailInput] = useState(email);
	const [codeSent, setCodeSent] = useState(!editableEmail);
	const [sending, setSending] = useState(false);
	const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
	const [verifying, setVerifying] = useState(false);
	const [resending, setResending] = useState(false);
	const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);
	const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

	useEffect(() => {
		if (!codeSent || secondsLeft <= 0) return;
		const timer = setTimeout(() => setSecondsLeft((prev) => prev - 1), 1000);
		return () => clearTimeout(timer);
	}, [codeSent, secondsLeft]);

	const activeEmail = editableEmail ? emailInput.trim() : email;

	const sendCode = async () => {
		if (editableEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(activeEmail)) {
			toast.error('Please enter a valid email address.');
			return;
		}
		setSending(true);
		try {
			await authService.resendVerification(activeEmail);
			toast.success('Verification code sent — check your inbox (and spam folder).');
			setCodeSent(true);
			setSecondsLeft(RESEND_COOLDOWN_SECONDS);
		} catch (err: any) {
			const message =
				err?.response?.data?.error?.message ||
				err?.response?.data?.detail ||
				'Failed to send the verification code. Please try again.';
			toast.error(message);
		} finally {
			setSending(false);
		}
	};

	const handleResend = async () => {
		setResending(true);
		try {
			await authService.resendVerification(activeEmail);
			toast.success('Verification code sent — check your inbox (and spam folder).');
			setSecondsLeft(RESEND_COOLDOWN_SECONDS);
		} catch (err: any) {
			const message =
				err?.response?.data?.error?.message ||
				err?.response?.data?.detail ||
				'Failed to resend the verification code. Please try again.';
			toast.error(message);
		} finally {
			setResending(false);
		}
	};

	const setDigitAt = (index: number, value: string) => {
		setDigits((prev) => {
			const next = [...prev];
			next[index] = value;
			return next;
		});
	};

	const handleDigitChange = (index: number, rawValue: string) => {
		const value = rawValue.replace(/\D/g, '');
		if (!value) {
			setDigitAt(index, '');
			return;
		}
		// Handle pasting a full code into a single box
		if (value.length > 1) {
			const pasted = value.slice(0, OTP_LENGTH - index).split('');
			setDigits((prev) => {
				const next = [...prev];
				pasted.forEach((d, i) => {
					next[index + i] = d;
				});
				return next;
			});
			const nextIndex = Math.min(index + pasted.length, OTP_LENGTH - 1);
			inputRefs.current[nextIndex]?.focus();
			return;
		}
		setDigitAt(index, value);
		if (index < OTP_LENGTH - 1) {
			inputRefs.current[index + 1]?.focus();
		}
	};

	const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Backspace' && !digits[index] && index > 0) {
			inputRefs.current[index - 1]?.focus();
		}
	};

	const code = digits.join('');
	const codeComplete = code.length === OTP_LENGTH;

	const handleVerify = async () => {
		if (!codeComplete) return;
		setVerifying(true);
		try {
			const response = await authService.verifyEmail(activeEmail, code);
			onVerified(response.message || 'Your email address has been verified successfully!');
		} catch (err: any) {
			const message =
				err?.response?.data?.error?.message ||
				err?.response?.data?.detail ||
				'Verification failed. The code may be incorrect or expired.';
			toast.error(message);
			setDigits(Array(OTP_LENGTH).fill(''));
			inputRefs.current[0]?.focus();
		} finally {
			setVerifying(false);
		}
	};

	if (!codeSent) {
		return (
			<Box sx={{ textAlign: 'center', py: 2 }}>
				<MarkEmailReadIcon sx={{ fontSize: 72, color: '#8B7CF6', mb: 3 }} />
				<Typography variant="h5" sx={{ fontWeight: 700, color: '#F4F5F7', mb: 2 }}>
					Verify your email
				</Typography>
				<Typography variant="body2" sx={{ color: '#94A3B8', mb: 3 }}>
					Enter your email address and we'll send you a 6-digit verification code.
				</Typography>
				<TextField
					fullWidth
					type="email"
					placeholder="name@company.com"
					value={emailInput}
					onChange={(e) => setEmailInput(e.target.value)}
					autoComplete="email"
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<MailIcon sx={{ color: '#64748b', fontSize: 18, mr: 0.5 }} />
							</InputAdornment>
						),
					}}
					sx={{
						mb: 2.5,
						'& .MuiOutlinedInput-root': {
							bgcolor: '#191c28',
							borderRadius: 1.5,
							color: '#F4F5F7',
							border: '1px solid rgba(255, 255, 255, 0.08)',
							'& fieldset': { border: 'none' },
							'&:hover': { border: '1px solid rgba(255, 255, 255, 0.15)' },
							'&.Mui-focused': {
								border: '1px solid #8B7CF6',
								boxShadow: '0 0 0 3px rgba(139, 124, 246, 0.15)',
							},
						},
					}}
				/>
				<Button
					variant="contained"
					fullWidth
					onClick={sendCode}
					disabled={sending || !emailInput.trim()}
					sx={{
						py: 1.25,
						backgroundColor: '#8B7CF6',
						color: '#ffffff',
						'&:hover': { backgroundColor: '#7a6ae6', boxShadow: '0 4px 12px rgba(139, 124, 246, 0.3)' },
						'&.Mui-disabled': { backgroundColor: 'rgba(139, 124, 246, 0.12)', color: '#94A3B8' },
						textTransform: 'none',
						fontWeight: 700,
						borderRadius: 1.5,
					}}
				>
					{sending ? <CircularProgress size={20} color="inherit" /> : 'Send verification code'}
				</Button>
			</Box>
		);
	}

	return (
		<Box sx={{ textAlign: 'center', py: 2 }}>
			<MarkEmailReadIcon sx={{ fontSize: 72, color: '#10b981', mb: 3 }} />
			<Typography variant="h5" sx={{ fontWeight: 700, color: '#F4F5F7', mb: 2 }}>
				Check your email
			</Typography>
			<Typography variant="body2" sx={{ color: '#94A3B8', mb: 4 }}>
				We've sent a 6-digit code to{' '}
				<Box component="span" sx={{ color: '#F4F5F7', fontWeight: 600 }}>
					{activeEmail}
				</Box>
				. Enter it below to verify your account.
			</Typography>

			<Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
				{digits.map((digit, index) => (
					<TextField
						key={index}
						inputRef={(el) => { inputRefs.current[index] = el; }}
						value={digit}
						onChange={(e) => handleDigitChange(index, e.target.value)}
						onKeyDown={(e) => handleKeyDown(index, e)}
						inputProps={{
							inputMode: 'numeric',
							pattern: '[0-9]*',
							maxLength: OTP_LENGTH,
							style: { textAlign: 'center', fontSize: '1.25rem', fontWeight: 700, padding: '10px 0' },
							'aria-label': `Digit ${index + 1}`,
						}}
						sx={{
							width: 48,
							'& .MuiOutlinedInput-root': {
								bgcolor: '#191c28',
								borderRadius: 1.5,
								color: '#F4F5F7',
								border: '1px solid rgba(255, 255, 255, 0.08)',
								'& fieldset': { border: 'none' },
								'&:hover': { border: '1px solid rgba(255, 255, 255, 0.15)' },
								'&.Mui-focused': {
									border: '1px solid #8B7CF6',
									boxShadow: '0 0 0 3px rgba(139, 124, 246, 0.15)',
								},
							},
						}}
					/>
				))}
			</Box>

			<Button
				variant="contained"
				fullWidth
				onClick={handleVerify}
				disabled={verifying || !codeComplete}
				sx={{
					mb: 1.5,
					py: 1.25,
					backgroundColor: '#8B7CF6',
					color: '#ffffff',
					'&:hover': { backgroundColor: '#7a6ae6', boxShadow: '0 4px 12px rgba(139, 124, 246, 0.3)' },
					'&.Mui-disabled': { backgroundColor: 'rgba(139, 124, 246, 0.12)', color: '#94A3B8' },
					textTransform: 'none',
					fontWeight: 700,
					borderRadius: 1.5,
				}}
			>
				{verifying ? <CircularProgress size={20} color="inherit" /> : 'Verify email'}
			</Button>

			<Button
				variant="text"
				fullWidth
				onClick={handleResend}
				disabled={resending || secondsLeft > 0}
				sx={{
					py: 1,
					color: '#94A3B8',
					'&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.04)' },
					'&.Mui-disabled': { color: '#4b5563' },
					textTransform: 'none',
					fontWeight: 600,
				}}
			>
				{resending ? (
					<CircularProgress size={16} color="inherit" />
				) : secondsLeft > 0 ? (
					`Resend available in ${formatCountdown(secondsLeft)}`
				) : (
					'Resend code'
				)}
			</Button>
		</Box>
	);
};

export default EmailOtpForm;
