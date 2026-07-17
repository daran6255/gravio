import React, { useRef } from 'react';
import {
	Box,
	Typography,
	Button,
	TextField,
	InputAdornment,
	IconButton,
	CircularProgress,
	ButtonBase,
	Popper,
	Paper,
	Autocomplete,
} from '@mui/material';
import {
	Visibility,
	VisibilityOff,
	PersonOutline as PersonIcon,
	BadgeOutlined as BadgeIcon,
	MailOutline as MailIcon,
	LockOutlined as LockIcon,
	AccountCircle as SuggestionIcon,
	RoomOutlined as RoomIcon,
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
	hideBack?: boolean;
	/** Individual/freelancer accounts skip OrganizationStep, so they collect location here instead. */
	showLocation?: boolean;
	location?: string;
	setLocation?: (val: string) => void;
	locationOptions?: string[];
	locationLoading?: boolean;
	locationInputValue?: string;
	setLocationInputValue?: (val: string) => void;
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
	hideBack = false,
	showLocation = false,
	location = '',
	setLocation,
	locationOptions = [],
	locationLoading = false,
	locationInputValue = '',
	setLocationInputValue,
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

	const usernameFieldRef = useRef<HTMLDivElement>(null);

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
					name="name"
					autoComplete="name"
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

			{/* Location (individual/freelancer accounts only — org accounts collect this on OrganizationStep) */}
			{showLocation && (
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
						Location *
					</Typography>
					<Autocomplete
						id="individualLocation"
						freeSolo
						options={locationOptions}
						loading={locationLoading}
						value={location}
						onChange={(_, newValue) => setLocation?.(newValue || '')}
						inputValue={locationInputValue}
						onInputChange={(_, newInputValue) => setLocationInputValue?.(newInputValue)}
						filterOptions={(options) => options}
						slotProps={{
							paper: {
								sx: {
									bgcolor: '#11141e',
									color: '#F4F5F7',
									border: '1px solid rgba(255, 255, 255, 0.08)',
									'& .MuiAutocomplete-option': {
										'&:hover': {
											bgcolor: 'rgba(255, 255, 255, 0.05)',
										},
										'&[aria-selected="true"]': {
											bgcolor: 'rgba(139, 124, 246, 0.2)',
											'&:hover': {
												bgcolor: 'rgba(139, 124, 246, 0.3)',
											}
										}
									}
								}
							}
						}}
						renderInput={(params) => (
							<TextField
								{...params}
								required
								placeholder="Search location (e.g. Bangalore, Karnataka)"
								size="small"
								InputProps={{
									...params.InputProps,
									startAdornment: (
										<InputAdornment position="start">
											<RoomIcon sx={{ color: '#64748b', fontSize: 18, mr: 0.5 }} />
										</InputAdornment>
									),
									endAdornment: (
										<>
											{locationLoading ? <CircularProgress color="inherit" size={16} /> : null}
											{params.InputProps.endAdornment}
										</>
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
						)}
					/>
				</Box>
			)}

			{/* Username */}
			<Box sx={{ mb: 1.25, position: 'relative' }}>
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
					ref={usernameFieldRef}
					required
					fullWidth
					id="adminUsername"
					name="username"
					autoComplete="username"
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
				<Popper
					open={usernameSuggestions.length > 0 && usernameStatus !== 'available'}
					anchorEl={usernameFieldRef.current}
					placement="right-start"
					modifiers={[
						{ name: 'offset', options: { offset: [0, 10] } },
						{ name: 'preventOverflow', options: { padding: 12, altAxis: true } },
						{ name: 'flip', options: { fallbackPlacements: ['bottom-start', 'left-start', 'top-start'] } },
					]}
					sx={{ zIndex: 20 }}
				>
					<Paper elevation={0} sx={{ position: 'relative', width: 240, bgcolor: 'transparent', boxShadow: 'none' }}>
						{/* Pointer connecting the bubble back to the field */}
						<Box
							sx={{
								position: 'absolute',
								left: -5,
								top: 14,
								width: 12,
								height: 12,
								bgcolor: '#191c28',
								transform: 'rotate(45deg)',
								zIndex: 0,
							}}
						/>
						<Box
							sx={{
								position: 'relative',
								zIndex: 1,
								bgcolor: '#191c28',
								borderRadius: 1.5,
								border: '1px solid rgba(255, 255, 255, 0.1)',
								boxShadow: '0 12px 28px rgba(0, 0, 0, 0.45)',
								overflow: 'hidden',
							}}
						>
							<Typography
								variant="caption"
								sx={{
									display: 'block',
									color: '#64748b',
									fontSize: '0.675rem',
									fontWeight: 600,
									px: 1.5,
									pt: 1.25,
									pb: 0.75,
								}}
							>
								Username taken — try a suggestion
							</Typography>
							{usernameSuggestions.map((sug, idx) => (
								<ButtonBase
									key={sug}
									onClick={() => setAdminUsername(sug)}
									sx={{
										width: '100%',
										display: 'flex',
										alignItems: 'center',
										gap: 1.25,
										px: 1.5,
										py: 1,
										justifyContent: 'flex-start',
										borderTop: idx === 0 ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
										'&:hover': {
											bgcolor: 'rgba(139, 124, 246, 0.1)',
										},
									}}
								>
									<SuggestionIcon sx={{ color: '#64748b', fontSize: 20, flexShrink: 0 }} />
									<Typography
										sx={{
											flex: 1,
											textAlign: 'left',
											color: '#F4F5F7',
											fontWeight: 600,
											fontSize: '0.825rem',
										}}
									>
										{sug}
									</Typography>
									<Typography sx={{ color: '#64748b', fontSize: '0.7rem' }}>
										Available
									</Typography>
								</ButtonBase>
							))}
						</Box>
					</Paper>
				</Popper>
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
					name="email"
					type="email"
					autoComplete="email"
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
					name="new-password"
					type={showPassword ? 'text' : 'password'}
					autoComplete="new-password"
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
				{!hideBack && (
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
				)}
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
