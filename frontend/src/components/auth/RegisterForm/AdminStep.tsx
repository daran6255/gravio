import React from 'react';
import {
	Box,
	Typography,
	Button,
	TextField,
	InputAdornment,
	IconButton,
	CircularProgress,
} from '@mui/material';
import {
	Visibility,
	VisibilityOff,
	PersonOutline as PersonIcon,
	BadgeOutlined as BadgeIcon,
	MailOutline as MailIcon,
	LockOutlined as LockIcon,
} from '@mui/icons-material';

interface AdminStepProps {
	adminName: string;
	setAdminName: (val: string) => void;
	adminUsername: string;
	setAdminUsername: (val: string) => void;
	adminEmail: string;
	setAdminEmail: (val: string) => void;
	adminPassword: string;
	setAdminPassword: (val: string) => void;
	showPassword: boolean;
	setShowPassword: (val: boolean) => void;
	usernameSuggestion: string;
	setUsernameSuggestion: (val: string) => void;
	isUsernameValid: boolean;
	isEmailValid: boolean;
	isPasswordValid: boolean;
	loading: boolean;
	onBack: () => void;
	onSubmit: (e: React.FormEvent) => void;
}

const AdminStep: React.FC<AdminStepProps> = ({
	adminName,
	setAdminName,
	adminUsername,
	setAdminUsername,
	adminEmail,
	setAdminEmail,
	adminPassword,
	setAdminPassword,
	showPassword,
	setShowPassword,
	usernameSuggestion,
	setUsernameSuggestion,
	isUsernameValid,
	isEmailValid,
	isPasswordValid,
	loading,
	onBack,
	onSubmit,
}) => {
	return (
		<Box component="form" onSubmit={onSubmit}>
			<Box sx={{ mb: 1.25 }}>
				<Typography
					sx={{
						fontSize: '0.675rem',
						fontWeight: 700,
						color: '#94A3B8',
						textTransform: 'uppercase',
						letterSpacing: '0.05em',
						mb: 0.75,
						display: 'block'
					}}
				>
					Full Name *
				</Typography>
				<TextField
					required
					fullWidth
					id="adminName"
					placeholder="Jane Doe"
					size="small"
					value={adminName}
					onChange={(e) => setAdminName(e.target.value)}
					error={adminName.length > 0 && adminName.trim().length < 2}
					helperText={adminName.length > 0 && adminName.trim().length < 2 ? "Full Name must be at least 2 characters" : ""}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<PersonIcon sx={{ color: '#64748b', fontSize: 18, mr: 0.5 }} />
							</InputAdornment>
						)
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
								boxShadow: '0 0 0 3px rgba(139, 124, 246, 0.15)'
							}
						},
						'& input::placeholder': { color: '#64748b', opacity: 1 }
					}}
				/>
			</Box>

			<Box sx={{ mb: 1.25 }}>
				<Typography
					sx={{
						fontSize: '0.675rem',
						fontWeight: 700,
						color: '#94A3B8',
						textTransform: 'uppercase',
						letterSpacing: '0.05em',
						mb: 0.75,
						display: 'block'
					}}
				>
					Username *
				</Typography>
				<TextField
					required
					fullWidth
					id="adminUsername"
					placeholder="janedoe"
					size="small"
					value={adminUsername}
					onChange={(e) => {
						setAdminUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
						setUsernameSuggestion('');
					}}
					error={adminUsername.length > 0 && !isUsernameValid}
					helperText={adminUsername.length > 0 && !isUsernameValid ? "Username must be at least 3 characters" : "Lowercase letters, numbers, and underscores only."}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<BadgeIcon sx={{ color: '#64748b', fontSize: 18, mr: 0.5 }} />
							</InputAdornment>
						)
					}}
					FormHelperTextProps={{
						sx: { color: '#64748b', fontSize: '0.65rem', mt: 0.25 }
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
								boxShadow: '0 0 0 3px rgba(139, 124, 246, 0.15)'
							}
						},
						'& input::placeholder': { color: '#64748b', opacity: 1 }
					}}
				/>
				{usernameSuggestion && (
					<Box 
						sx={{ 
							mt: 1, 
							p: 1, 
							bgcolor: 'rgba(139, 124, 246, 0.05)', 
							borderRadius: 1.5, 
							border: '1px dashed rgba(139, 124, 246, 0.3)', 
							display: 'flex', 
							alignItems: 'center', 
							justifyContent: 'space-between' 
						}}
					>
						<Typography variant="caption" sx={{ color: '#94A3B8' }}>
							Username is taken. Try: <strong style={{ color: '#8B7CF6' }}>{usernameSuggestion}</strong>
						</Typography>
						<Button 
							size="small" 
							variant="text" 
							onClick={() => {
								setAdminUsername(usernameSuggestion);
								setUsernameSuggestion('');
							}}
							sx={{ 
								color: '#8B7CF6', 
								textTransform: 'none', 
								fontWeight: 700,
								fontSize: '0.7rem',
								p: 0,
								minWidth: 0,
								ml: 1,
								'&:hover': { textDecoration: 'underline', background: 'transparent' }
							}}
						>
							Use Suggestion
						</Button>
					</Box>
				)}
			</Box>

			<Box sx={{ mb: 1.25 }}>
				<Typography
					sx={{
						fontSize: '0.675rem',
						fontWeight: 700,
						color: '#94A3B8',
						textTransform: 'uppercase',
						letterSpacing: '0.05em',
						mb: 0.75,
						display: 'block'
					}}
				>
					Email Address *
				</Typography>
				<TextField
					required
					fullWidth
					id="adminEmail"
					type="email"
					placeholder="jane@company.com"
					size="small"
					value={adminEmail}
					onChange={(e) => setAdminEmail(e.target.value)}
					error={adminEmail.length > 0 && !isEmailValid}
					helperText={adminEmail.length > 0 && !isEmailValid ? "Please enter a valid email address" : ""}
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
							'& fieldset': { border: 'none' },
							'&:hover': { border: '1px solid rgba(255, 255, 255, 0.15)' },
							'&.Mui-focused': {
								border: '1px solid #8B7CF6',
								boxShadow: '0 0 0 3px rgba(139, 124, 246, 0.15)'
							}
						},
						'& input::placeholder': { color: '#64748b', opacity: 1 }
					}}
				/>
			</Box>

			<Box sx={{ mb: 2 }}>
				<Typography
					sx={{
						fontSize: '0.675rem',
						fontWeight: 700,
						color: '#94A3B8',
						textTransform: 'uppercase',
						letterSpacing: '0.05em',
						mb: 0.75,
						display: 'block'
					}}
				>
					Password *
				</Typography>
				<TextField
					required
					fullWidth
					id="adminPassword"
					type={showPassword ? 'text' : 'password'}
					placeholder="••••••••"
					size="small"
					value={adminPassword}
					onChange={(e) => setAdminPassword(e.target.value)}
					error={adminPassword.length > 0 && !isPasswordValid}
					helperText={adminPassword.length > 0 && !isPasswordValid ? "Min 8 characters, 1 uppercase, 1 number, 1 special character" : "Min. 8 characters with an uppercase letter, number, and special character."}
					FormHelperTextProps={{
						sx: { color: '#64748b', fontSize: '0.65rem', mt: 0.25 }
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
									aria-label={showPassword ? 'hide password' : 'show password'}
									onClick={() => setShowPassword(!showPassword)}
									edge="end"
									size="small"
									sx={{ color: '#64748b' }}
								>
									{showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
								</IconButton>
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
								boxShadow: '0 0 0 3px rgba(139, 124, 246, 0.15)'
							}
						},
						'& input::placeholder': { color: '#64748b', opacity: 1 }
					}}
				/>
			</Box>

			<Box sx={{ display: 'flex', gap: 2 }}>
				<Button
					variant="outlined"
					fullWidth
					onClick={onBack}
					sx={{
						py: 1.15,
						borderColor: 'rgba(255, 255, 255, 0.12)',
						color: '#94A3B8',
						textTransform: 'none',
						fontWeight: 600,
						borderRadius: 1.5,
						'&:hover': {
							borderColor: '#94A3B8',
							color: '#F4F5F7',
							backgroundColor: 'rgba(255, 255, 255, 0.02)',
						},
					}}
				>
					Back
				</Button>
				<Button
					type="submit"
					variant="contained"
					fullWidth
					disabled={loading}
					sx={{
						py: 1.15,
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
						borderRadius: 1.5,
					}}
				>
					{loading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
				</Button>
			</Box>
		</Box>
	);
};

export default AdminStep;
