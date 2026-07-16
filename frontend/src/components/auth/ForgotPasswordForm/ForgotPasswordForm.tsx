import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
	Box,
	Typography,
	TextField,
	Button,
	CircularProgress,
	InputAdornment,
	Link,
} from '@mui/material';
import {
	MailOutline as MailIcon,
	ArrowBackOutlined as BackIcon,
	MarkEmailReadOutlined as MarkEmailReadIcon,
} from '@mui/icons-material';
import authService from '../../../services/authService';
import useToast from '../../../hooks/useToast';

const ForgotPasswordForm: React.FC = () => {
	const toast = useToast();
	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);
	const [sent, setSent] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			await authService.forgotPassword(email.trim());
			setSent(true);
		} catch (err: any) {
			const message =
				err?.response?.data?.error?.message ||
				err?.response?.data?.detail ||
				'Something went wrong. Please try again.';
			toast.error(message);
		} finally {
			setLoading(false);
		}
	};

	if (sent) {
		return (
			<Box sx={{ textAlign: 'center', py: 2 }}>
				<MarkEmailReadIcon sx={{ fontSize: 72, color: '#10b981', mb: 3 }} />
				<Typography variant="h5" sx={{ fontWeight: 700, color: '#F4F5F7', mb: 2 }}>
					Check your email
				</Typography>
				<Typography variant="body2" sx={{ color: '#94A3B8', mb: 4 }}>
					If an account exists for{' '}
					<Box component="span" sx={{ color: '#F4F5F7', fontWeight: 600 }}>
						{email}
					</Box>
					, we've sent a link to reset your password.
				</Typography>
				<Link
					component={RouterLink}
					to="/auth/login"
					sx={{
						display: 'inline-flex',
						alignItems: 'center',
						gap: 0.75,
						color: '#8B7CF6',
						textDecoration: 'none',
						fontWeight: 600,
						fontSize: '0.875rem',
						'&:hover': { textDecoration: 'underline' },
					}}
				>
					<BackIcon sx={{ fontSize: 16 }} />
					Back to login
				</Link>
			</Box>
		);
	}

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', position: 'relative' }}>
			<Box sx={{ mb: 4, textAlign: 'center' }}>
				<Typography component="h1" variant="h5" sx={{ fontWeight: 700, color: '#F4F5F7', mb: 1 }}>
					Forgot your password?
				</Typography>
				<Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 500 }}>
					No worries — enter your email and we'll send you a reset link.
				</Typography>
			</Box>

			<Box component="form" onSubmit={handleSubmit} noValidate>
				<Box sx={{ mb: 3 }}>
					<Typography
						sx={{
							fontSize: '0.7rem',
							fontWeight: 700,
							color: '#94A3B8',
							textTransform: 'uppercase',
							letterSpacing: '0.05em',
							mb: 1,
							display: 'block',
						}}
					>
						Email Address
					</Typography>
					<TextField
						required
						fullWidth
						type="email"
						id="forgotEmail"
						name="email"
						placeholder="name@company.com"
						autoComplete="email"
						autoFocus
						size="small"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						inputProps={{ 'aria-required': 'true' }}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<MailIcon sx={{ color: '#64748b', fontSize: 18, mr: 0.5 }} />
								</InputAdornment>
							),
						}}
						sx={{
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
							'& input::placeholder': { color: '#64748b', opacity: 1 },
						}}
					/>
				</Box>

				<Button
					type="submit"
					fullWidth
					variant="contained"
					disabled={loading || !email.trim()}
					aria-busy={loading}
					sx={{
						py: 1.25,
						backgroundColor: '#8B7CF6',
						color: '#ffffff',
						'&:hover': {
							backgroundColor: '#7a6ae6',
							boxShadow: '0 4px 12px rgba(139, 124, 246, 0.3)',
						},
						'&.Mui-disabled': {
							backgroundColor: 'rgba(255, 255, 255, 0.05)',
							color: 'rgba(255, 255, 255, 0.3)',
						},
						textTransform: 'none',
						fontWeight: 700,
						fontSize: '0.95rem',
						borderRadius: 1.5,
					}}
				>
					{loading ? <CircularProgress size={24} color="inherit" /> : 'Send reset link'}
				</Button>

				<Box sx={{ mt: 3.5, textAlign: 'center' }}>
					<Link
						component={RouterLink}
						to="/auth/login"
						sx={{
							display: 'inline-flex',
							alignItems: 'center',
							gap: 0.75,
							color: '#94A3B8',
							textDecoration: 'none',
							fontWeight: 600,
							fontSize: '0.875rem',
							'&:hover': { color: '#F4F5F7', textDecoration: 'underline' },
						}}
					>
						<BackIcon sx={{ fontSize: 16 }} />
						Back to login
					</Link>
				</Box>
			</Box>
		</Box>
	);
};

export default ForgotPasswordForm;
