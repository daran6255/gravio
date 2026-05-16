import React, { useState } from 'react';
import {
	Button,
	Box,
	Typography,
	Paper,
	TextField,
	CircularProgress,
	IconButton,
	InputAdornment,
	useTheme,
	Link,
	Checkbox,
	FormControlLabel,
} from '@mui/material';
import { Visibility, VisibilityOff, LockOutlined } from '@mui/icons-material';

interface LoginFormProps {
	loading: boolean;
	error: string | null;
	onLogin: (email: string, password: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ loading, error, onLogin }) => {
	const theme = useTheme();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [acceptedPolicy, setAcceptedPolicy] = useState(false);

	const handleTogglePasswordVisibility = () => {
		setShowPassword((prev) => !prev);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!acceptedPolicy) return;
		onLogin(email, password);
	};

	return (
		<Paper
			elevation={1}
			sx={{
				p: { xs: 3, sm: 4 },
				display: 'flex',
				flexDirection: 'column',
				borderRadius: 2,
				backgroundColor: theme.palette.background.paper,
				border: `1px solid ${theme.palette.divider}`,
				maxWidth: 400,
				width: '100%',
				position: 'relative',
				overflow: 'hidden',
				'&::before': {
					content: '""',
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					height: 4,
					backgroundColor: theme.palette.primary.main,
				}
			}}
		>
			<Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
				<Box
					sx={{
						backgroundColor: (theme) => `${theme.palette.primary.main}15`,
						p: 1,
						borderRadius: 1,
						display: 'flex'
					}}
				>
					<LockOutlined sx={{ color: theme.palette.primary.main }} />
				</Box>
				<Typography component="h2" variant="h5" sx={{ fontWeight: 600 }}>
					Sign in
				</Typography>
			</Box>

			<Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
				Enter your credentials to access your WinVinaya account.
			</Typography>

			{/* Accessible error announcement */}
			{error && (
				<Box
					role="alert"
					aria-live="assertive"
					sx={{
						mb: 3,
						p: 1.5,
						bgcolor: (theme) => `${theme.palette.error.main}10`,
						color: theme.palette.error.main,
						borderRadius: 1,
						border: `1px solid ${theme.palette.error.main}30`,
						fontSize: '0.875rem'
					}}
				>
					<Typography variant="body2" sx={{ fontWeight: 500 }}>
						{error}
					</Typography>
				</Box>
			)}

			<Box component="form" onSubmit={handleSubmit} noValidate>
				<Box sx={{ mb: 2 }}>
					<Typography variant="awsFieldLabel" sx={{ mb: 1 }}>
						Email Address
					</Typography>
					<TextField
						required
						fullWidth
						id="email"
						name="email"
						placeholder="email@example.com"
						autoComplete="email"
						autoFocus
						size="small"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						inputProps={{
							'aria-required': 'true'
						}}
						sx={{
							'& .MuiOutlinedInput-root': {
								borderRadius: 1,
							}
						}}
					/>
				</Box>

				<Box sx={{ mb: 2 }}>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
						<Typography variant="awsFieldLabel" sx={{ mb: 0 }}>
							Password
						</Typography>
						<Link
							href="/forgot-password"
							variant="body2"
							sx={{
								color: theme.palette.primary.main,
								textDecoration: 'none',
								fontWeight: 500,
								fontSize: '0.8rem',
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
							endAdornment: (
								<InputAdornment position="end">
									<IconButton
										aria-label={showPassword ? "hide password" : "show password"}
										onClick={handleTogglePasswordVisibility}
										edge="end"
										size="small"
										title={showPassword ? "Hide password" : "Show password"}
									>
										{showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
									</IconButton>
								</InputAdornment>
							),
							sx: { borderRadius: 1 }
						}}
					/>
				</Box>

				<Box sx={{ mb: 3 }}>
					<FormControlLabel
						control={
							<Checkbox
								size="small"
								checked={acceptedPolicy}
								onChange={(e) => setAcceptedPolicy(e.target.checked)}
								sx={{
									color: theme.palette.divider,
									'&.Mui-checked': {
										color: theme.palette.primary.main,
									},
								}}
							/>
						}
						label={
							<Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
								I agree to the{' '}
								<Link
									href="/privacy-policy"
									sx={{
										color: theme.palette.primary.main,
										textDecoration: 'none',
										fontWeight: 500,
										'&:hover': { textDecoration: 'underline' }
									}}
								>
									Privacy Policy
								</Link>{' '}
								and{' '}
								<Link
									href="/terms"
									sx={{
										color: theme.palette.primary.main,
										textDecoration: 'none',
										fontWeight: 500,
										'&:hover': { textDecoration: 'underline' }
									}}
								>
									Terms of Service
								</Link>
							</Typography>
						}
					/>
				</Box>

				<Button
					type="submit"
					fullWidth
					variant="contained"
					disabled={loading || !acceptedPolicy}
					aria-busy={loading}
					aria-label={loading ? "Signing in" : "Sign in"}
					sx={{
						py: 1.25,
						backgroundColor: theme.palette.primary.main,
						'&:hover': { 
							backgroundColor: theme.palette.primary.dark,
							boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
						},
						'&.Mui-disabled': {
							backgroundColor: theme.palette.action.disabledBackground,
							color: theme.palette.action.disabled,
						},
						textTransform: 'none',
						fontWeight: 700,
						fontSize: '0.95rem',
						transition: 'all 0.2s',
						borderRadius: 1,
					}}
				>
					{loading ? <CircularProgress size={24} color="inherit" aria-hidden="true" /> : 'Sign In'}
				</Button>
			</Box>
		</Paper>
	);
};

export default LoginForm;
