import React from 'react';
import {
	Box,
	Typography,
	Button,
	TextField,
	InputAdornment,
	IconButton,
	CircularProgress,
	Chip,
} from '@mui/material';
import {
	Visibility,
	VisibilityOff,
	PersonOutline as PersonIcon,
	BadgeOutlined as BadgeIcon,
	MailOutline as MailIcon,
	LockOutlined as LockIcon,
} from '@mui/icons-material';

interface PasswordStrengthInfo {
	score: number;
	label: 'Too Weak' | 'Weak' | 'Medium' | 'Strong';
	color: string;
	requirements: {
		length: boolean;
		uppercase: boolean;
		number: boolean;
		special: boolean;
	};
}

interface AdminStepProps {
	adminName: string;
	setAdminName: (val: string) => void;
	adminUsername: string;
	setAdminUsername: (val: string) => void;
	usernameStatus: 'idle' | 'validating' | 'available' | 'error';
	usernameMessage: string;
	usernameSuggestions: string[];
	adminEmail: string;
	setAdminEmail: (val: string) => void;
	emailStatus: 'idle' | 'validating' | 'available' | 'error';
	emailMessage: string;
	adminPassword: string;
	setAdminPassword: (val: string) => void;
	showPassword: boolean;
	setShowPassword: (val: boolean) => void;
	passwordStrength: PasswordStrengthInfo;
	loading: boolean;
	onBack: () => void;
	onSubmit: (e: React.FormEvent) => void;
	registerDisabled: boolean;
}

const AdminStep: React.FC<AdminStepProps> = ({
	adminName,
	setAdminName,
	adminUsername,
	setAdminUsername,
	usernameStatus,
	usernameMessage,
	usernameSuggestions,
	adminEmail,
	setAdminEmail,
	emailStatus,
	emailMessage,
	adminPassword,
	setAdminPassword,
	showPassword,
	setShowPassword,
	passwordStrength,
	loading,
	onBack,
	onSubmit,
	registerDisabled,
}) => {
	const reqs = [
		{ key: 'length', label: 'Min. 8 characters' },
		{ key: 'uppercase', label: '1 uppercase letter' },
		{ key: 'number', label: '1 number' },
		{ key: 'special', label: '1 special character' }
	] as const;

	const usernameReqs = [
		{ key: 'length', label: '3-30 characters' },
		{ key: 'pattern', label: 'Lowercase letters, numbers, underscores only' }
	] as const;

	const usernameRequirements = {
		length: adminUsername.length >= 3 && adminUsername.length <= 30,
		pattern: adminUsername.length > 0 && /^[a-z0-9_]+$/.test(adminUsername)
	};

	const allUsernameReqsMet = usernameRequirements.length && usernameRequirements.pattern;
	const allPasswordReqsMet = passwordStrength.requirements.length &&
		passwordStrength.requirements.uppercase &&
		passwordStrength.requirements.number &&
		passwordStrength.requirements.special;

	return (
		<Box component="form" onSubmit={onSubmit}>
			{/* Full Name */}
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
						'& input::placeholder': { color: '#64748b', opacity: 1 },
						'& input:-webkit-autofill': {
							WebkitBoxShadow: '0 0 0 1000px #191c28 inset !important',
							WebkitTextFillColor: '#F4F5F7 !important',
						}
					}}
				/>
			</Box>

			{/* Username */}
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
					}}
					error={usernameStatus === 'error'}
					helperText={usernameMessage}
					FormHelperTextProps={{
						sx: {
							color: usernameStatus === 'available' ? '#10b981' : usernameStatus === 'error' ? '#ef4444' : '#64748b',
							fontSize: '0.675rem',
							mt: 0.5
						}
					}}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<BadgeIcon sx={{ color: '#64748b', fontSize: 18, mr: 0.5 }} />
							</InputAdornment>
						),
						endAdornment: usernameStatus === 'validating' ? (
							<InputAdornment position="end">
								<CircularProgress size={16} color="inherit" sx={{ color: '#64748b' }} />
							</InputAdornment>
						) : null
					}}
					sx={{
						'& .MuiOutlinedInput-root': {
							bgcolor: '#191c28',
							borderRadius: 1.5,
							color: '#F4F5F7',
							border: usernameStatus === 'available' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
							'& fieldset': { border: 'none' },
							'&:hover': { border: usernameStatus === 'available' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.15)' },
							'&.Mui-focused': {
								border: usernameStatus === 'available' ? '1px solid #10b981' : usernameStatus === 'error' ? '1px solid #ef4444' : '1px solid #8B7CF6',
								boxShadow: usernameStatus === 'available' ? '0 0 0 3px rgba(16, 185, 129, 0.15)' : usernameStatus === 'error' ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : '0 0 0 3px rgba(139, 124, 246, 0.15)'
							}
						},
						'& input::placeholder': { color: '#64748b', opacity: 1 },
						'& input:-webkit-autofill': {
							WebkitBoxShadow: '0 0 0 1000px #191c28 inset !important',
							WebkitTextFillColor: '#F4F5F7 !important',
						}
					}}
				/>
				{adminUsername.length > 0 && !allUsernameReqsMet && (
					<Box sx={{
						display: 'flex',
						flexDirection: 'column',
						gap: 1,
						mt: 1.5,
						mb: 1.5,
						p: 1.25,
						bgcolor: 'rgba(30, 41, 59, 0.4)',
						borderRadius: 2,
						border: '1px solid rgba(255, 255, 255, 0.05)',
						backdropFilter: 'blur(10px)',
					}}>
						<Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, mb: 0.25, fontSize: '0.7rem' }}>
							Username Requirements:
						</Typography>
						<Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0.75 }}>
							{usernameReqs.map((r) => {
								const met = usernameRequirements[r.key];
								return (
									<Box key={r.key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
										<Box sx={{
											width: 14,
											height: 14,
											borderRadius: '50%',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											bgcolor: met ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
											color: met ? '#10b981' : '#ef4444',
											fontSize: '9px',
											fontWeight: 'bold',
											border: met ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
											transition: 'all 0.3s'
										}}>
											{met ? "✓" : "×"}
										</Box>
										<Typography variant="caption" sx={{ color: met ? '#F4F5F7' : '#94A3B8', fontSize: '0.725rem', transition: 'color 0.3s' }}>
											{r.label}
										</Typography>
									</Box>
								);
							})}
						</Box>
					</Box>
				)}
				{usernameSuggestions.length > 0 && (
					<Box sx={{
						mt: 1.5,
						p: 1.25,
						bgcolor: 'rgba(139, 124, 246, 0.02)',
						borderRadius: 2,
						border: '1px solid rgba(139, 124, 246, 0.15)',
						boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
					}}>
						<Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 1.25, fontSize: '0.725rem', fontWeight: 600 }}>
							{usernameStatus === 'available'
								? "Username is available! You can also use one of these suggestions:"
								: "Taken. Try one of these suggestions:"}
						</Typography>
						<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
							{usernameSuggestions.map((sug) => (
								<Chip
									key={sug}
									label={sug}
									size="small"
									onClick={() => setAdminUsername(sug)}
									sx={{
										background: 'linear-gradient(135deg, rgba(139, 124, 246, 0.1) 0%, rgba(78, 168, 255, 0.1) 100%)',
										color: '#a5b4fc',
										border: '1px solid rgba(139, 124, 246, 0.2)',
										fontWeight: 600,
										fontSize: '0.725rem',
										cursor: 'pointer',
										transition: 'all 0.2s ease-in-out',
										'&:hover': {
											background: 'linear-gradient(135deg, rgba(139, 124, 246, 0.2) 0%, rgba(78, 168, 255, 0.2) 100%)',
											transform: 'translateY(-1px)',
											boxShadow: '0 2px 8px rgba(139, 124, 246, 0.2)',
											borderColor: '#8B7CF6',
										},
										'&:active': {
											transform: 'translateY(0)',
										}
									}}
								/>
							))}
						</Box>
					</Box>
				)}
			</Box>

			{/* Email */}
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
					error={emailStatus === 'error'}
					helperText={emailMessage}
					FormHelperTextProps={{
						sx: {
							color: emailStatus === 'available' ? '#10b981' : emailStatus === 'error' ? '#ef4444' : '#64748b',
							fontSize: '0.675rem',
							mt: 0.5
						}
					}}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<MailIcon sx={{ color: '#64748b', fontSize: 18, mr: 0.5 }} />
							</InputAdornment>
						),
						endAdornment: emailStatus === 'validating' ? (
							<InputAdornment position="end">
								<CircularProgress size={16} color="inherit" sx={{ color: '#64748b' }} />
							</InputAdornment>
						) : null
					}}
					sx={{
						'& .MuiOutlinedInput-root': {
							bgcolor: '#191c28',
							borderRadius: 1.5,
							color: '#F4F5F7',
							border: emailStatus === 'available' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
							'& fieldset': { border: 'none' },
							'&:hover': { border: emailStatus === 'available' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.15)' },
							'&.Mui-focused': {
								border: emailStatus === 'available' ? '1px solid #10b981' : emailStatus === 'error' ? '1px solid #ef4444' : '1px solid #8B7CF6',
								boxShadow: emailStatus === 'available' ? '0 0 0 3px rgba(16, 185, 129, 0.15)' : emailStatus === 'error' ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : '0 0 0 3px rgba(139, 124, 246, 0.15)'
							}
						},
						'& input::placeholder': { color: '#64748b', opacity: 1 },
						'& input:-webkit-autofill': {
							WebkitBoxShadow: '0 0 0 1000px #191c28 inset !important',
							WebkitTextFillColor: '#F4F5F7 !important',
						}
					}}
				/>
			</Box>

			{/* Password */}
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
					error={adminPassword.length > 0 && passwordStrength.score < 4}
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
							border: adminPassword.length > 0 && passwordStrength.score === 4 ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
							'& fieldset': { border: 'none' },
							'&:hover': { border: adminPassword.length > 0 && passwordStrength.score === 4 ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.15)' },
							'&.Mui-focused': {
								border: adminPassword.length > 0 && passwordStrength.score === 4 ? '1px solid #10b981' : '1px solid #8B7CF6',
								boxShadow: adminPassword.length > 0 && passwordStrength.score === 4 ? '0 0 0 3px rgba(16, 185, 129, 0.15)' : '0 0 0 3px rgba(139, 124, 246, 0.15)'
							}
						},
						'& input::placeholder': { color: '#64748b', opacity: 1 },
						'& input:-webkit-autofill': {
							WebkitBoxShadow: '0 0 0 1000px #191c28 inset !important',
							WebkitTextFillColor: '#F4F5F7 !important',
						}
					}}
				/>

				{/* Password Strength Indicator */}
				{adminPassword.length > 0 && (
					<Box sx={{ mt: 1.5 }}>
						<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, alignItems: 'center' }}>
							<Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.7rem' }}>
								Password Strength:
							</Typography>
							<Typography variant="caption" sx={{ color: passwordStrength.color, fontWeight: 700, fontSize: '0.7rem' }}>
								{passwordStrength.label}
							</Typography>
						</Box>
						<Box sx={{ height: 4, width: '100%', bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1, overflow: 'hidden', mb: 1.25 }}>
							<Box sx={{
								height: '100%',
								width: `${(passwordStrength.score / 4) * 100}%`,
								bgcolor: passwordStrength.color,
								transition: 'width 0.3s ease, background-color 0.3s ease'
							}} />
						</Box>

						{/* Requirements Checklist */}
						{!allPasswordReqsMet && (
							<Box sx={{
								display: 'grid',
								gridTemplateColumns: '1fr 1fr',
								gap: 0.75,
								p: 1.25,
								bgcolor: 'rgba(30, 41, 59, 0.4)',
								borderRadius: 2,
								border: '1px solid rgba(255, 255, 255, 0.05)',
								backdropFilter: 'blur(10px)',
							}}>
								{reqs.map((r) => {
									const met = passwordStrength.requirements[r.key];
									return (
										<Box key={r.key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
											<Box sx={{
												width: 14,
												height: 14,
												borderRadius: '50%',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												bgcolor: met ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
												color: met ? '#10b981' : '#ef4444',
												fontSize: '9px',
												fontWeight: 'bold',
												border: met ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
												transition: 'all 0.3s'
											}}>
												{met ? "✓" : "×"}
											</Box>
											<Typography variant="caption" sx={{ color: met ? '#F4F5F7' : '#94A3B8', fontSize: '0.675rem', transition: 'color 0.3s' }}>
												{r.label}
											</Typography>
										</Box>
									);
								})}
							</Box>
						)}
					</Box>
				)}

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
					disabled={loading || registerDisabled}
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
