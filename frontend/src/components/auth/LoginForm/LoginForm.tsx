import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
	Button,
	Box,
	Typography,
	TextField,
	CircularProgress,
	IconButton,
	InputAdornment,
	Link,
	Checkbox,
	FormControlLabel,
} from '@mui/material';
import {
	Visibility,
	VisibilityOff,
	MailOutline as MailIcon,
	LockOutlined as LockIcon,
	Login as LoginIcon,
} from '@mui/icons-material';
import { useLoginForm } from './hooks/useLoginForm';

interface LoginFormProps {
	loading: boolean;
	error: string | null;
	onLogin: (identifier: string, password: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ loading, error, onLogin }) => {
	const {
		identifier,
		setIdentifier,
		password,
		setPassword,
		showPassword,
		rememberDevice,
		setRememberDevice,
		handleTogglePasswordVisibility,
		handleSubmit,
	} = useLoginForm(onLogin);

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				width: '100%',
				position: 'relative',
			}}
		>
			{/* Heading and Subheading */}
			<Box sx={{ mb: 4, textAlign: 'center' }}>
				<Typography component="h1" variant="h5" sx={{ fontWeight: 700, color: '#F4F5F7', mb: 1 }}>
					Sign in to your account
				</Typography>
				<Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 500 }}>
					Enter your credentials to access the platform
				</Typography>
			</Box>

			{/* Accessible error announcement */}
			{error && (
				<Box
					role="alert"
					aria-live="assertive"
					sx={{
						mb: 3,
						p: 1.5,
						bgcolor: 'rgba(239, 68, 68, 0.1)',
						color: '#ef4444',
						borderRadius: 1,
						border: '1px solid rgba(239, 68, 68, 0.2)',
						fontSize: '0.875rem'
					}}
				>
					<Typography variant="body2" sx={{ fontWeight: 500 }}>
						{error}
					</Typography>
				</Box>
			)}

			<Box component="form" onSubmit={handleSubmit} noValidate>
				{/* Email or Username */}
				<Box sx={{ mb: 2.5 }}>
					<Typography
						sx={{
							fontSize: '0.7rem',
							fontWeight: 700,
							color: '#94A3B8',
							textTransform: 'uppercase',
							letterSpacing: '0.05em',
							mb: 1,
							display: 'block'
						}}
					>
						Email or Username
					</Typography>
					<TextField
						required
						fullWidth
						id="identifier"
						name="identifier"
						placeholder="name@company.com or username"
						autoComplete="username"
						autoFocus
						size="small"
						value={identifier}
						onChange={(e) => setIdentifier(e.target.value)}
						inputProps={{
							'aria-required': 'true'
						}}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<MailIcon sx={{ color: '#64748b', fontSize: 18, mr: 0.5 }} />
								</InputAdornment>
							)
						}}
						sx={{
							'& .MuiOutlinedInput-root': {
								bgcolor: '#191c28',
								borderRadius: 1.5,
								color: '#F4F5F7',
								border: '1px solid rgba(255, 255, 255, 0.08)',
								'& fieldset': {
									border: 'none',
								},
								'&:hover': {
									border: '1px solid rgba(255, 255, 255, 0.15)',
								},
								'&.Mui-focused': {
									border: '1px solid #8B7CF6',
									boxShadow: '0 0 0 3px rgba(139, 124, 246, 0.15)',
								},
							},
							'& input::placeholder': {
								color: '#64748b',
								opacity: 1,
							}
						}}
					/>
				</Box>

				{/* Password */}
				<Box sx={{ mb: 3 }}>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
						<Typography
							sx={{
								fontSize: '0.7rem',
								fontWeight: 700,
								color: '#94A3B8',
								textTransform: 'uppercase',
								letterSpacing: '0.05em',
								mb: 0,
								display: 'block'
							}}
						>
							Password
						</Typography>
						<Link
							component={RouterLink}
							to="/auth/forgot-password"
							variant="body2"
							sx={{
								color: '#8B7CF6',
								textDecoration: 'none',
								fontWeight: 600,
								fontSize: '0.75rem',
								'&:hover': { textDecoration: 'underline' }
							}}
						>
							Forgot password?
						</Link>
					</Box>
					<TextField
						required
						fullWidth
						name="password"
						type={showPassword ? 'text' : 'password'}
						id="password"
						placeholder="••••••••"
						autoComplete="current-password"
						size="small"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						inputProps={{
							'aria-required': 'true'
						}}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<LockIcon sx={{ color: '#64748b', fontSize: 18, mr: 0.5 }} />
								</InputAdornment>
							),
							endAdornment: (
								<InputAdornment position="end">
									<IconButton
										aria-label={showPassword ? "hide password" : "show password"}
										onClick={handleTogglePasswordVisibility}
										edge="end"
										size="small"
										title={showPassword ? "Hide password" : "Show password"}
										sx={{ color: '#64748b' }}
									>
										{showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
									</IconButton>
								</InputAdornment>
							)
						}}
						sx={{
							'& .MuiOutlinedInput-root': {
								bgcolor: '#191c28',
								borderRadius: 1.5,
								color: '#F4F5F7',
								border: '1px solid rgba(255, 255, 255, 0.08)',
								'& fieldset': {
									border: 'none',
								},
								'&:hover': {
									border: '1px solid rgba(255, 255, 255, 0.15)',
								},
								'&.Mui-focused': {
									border: '1px solid #8B7CF6',
									boxShadow: '0 0 0 3px rgba(139, 124, 246, 0.15)',
								},
							},
							'& input::placeholder': {
								color: '#64748b',
								opacity: 1,
							}
						}}
					/>
				</Box>

				{/* Remember Device Box */}
				<Box sx={{ mb: 3 }}>
					<FormControlLabel
						control={
							<Checkbox
								size="small"
								checked={rememberDevice}
								onChange={(e) => setRememberDevice(e.target.checked)}
								sx={{
									color: 'rgba(255, 255, 255, 0.15)',
									'&.Mui-checked': {
										color: '#8B7CF6',
									},
								}}
							/>
						}
						label={
							<Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 500 }}>
								Remember this device for 30 days
							</Typography>
						}
					/>
				</Box>

				{/* Submit Button */}
				<Button
					type="submit"
					fullWidth
					variant="contained"
					disabled={loading}
					aria-busy={loading}
					aria-label={loading ? "Signing in" : "Sign in"}
					endIcon={!loading && <LoginIcon sx={{ fontSize: 18 }} />}
					sx={{
						py: 1.25,
						backgroundColor: '#8B7CF6',
						color: '#ffffff',
						'&:hover': { 
							backgroundColor: '#7a6ae6',
							boxShadow: '0 4px 12px rgba(139, 124, 246, 0.3)'
						},
						'&.Mui-disabled': {
							backgroundColor: 'rgba(255, 255, 255, 0.05)',
							color: 'rgba(255, 255, 255, 0.3)',
						},
						textTransform: 'none',
						fontWeight: 700,
						fontSize: '0.95rem',
						transition: 'all 0.2s',
						borderRadius: 1.5,
					}}
				>
					{loading ? <CircularProgress size={24} color="inherit" aria-hidden="true" /> : 'Sign In'}
				</Button>

				{/* Redirect Link */}
				<Box sx={{ mt: 3.5, textAlign: 'center' }}>
					<Typography variant="body2" sx={{ color: '#94A3B8' }}>
						Don't have an account?{' '}
						<Link
							component={RouterLink}
							to="/auth/register"
							sx={{
								color: '#8B7CF6',
								textDecoration: 'none',
								fontWeight: 600,
								'&:hover': { textDecoration: 'underline' }
							}}
						>
							Create an account
						</Link>
					</Typography>
				</Box>
			</Box>
		</Box>
	);
};

export default LoginForm;
