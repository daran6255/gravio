import React, { useState, useEffect, useCallback } from 'react';
import {
	Box,
	Typography,
	TextField,
	Avatar,
	Stack,
	Chip,
	Divider,
	alpha,
} from '@mui/material';
import {
	VerifiedUser as VerifiedIcon,
	Business as OrgIcon,
	Badge as RoleIcon,
	CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material';
import { useAppSelector } from '../../store/hooks';
import { useSettingsContext } from '../../context/SettingsContext';
import useDateTime from '../../hooks/useDateTime';

const ProfileTab: React.FC = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const user = useAppSelector((state) => state.auth.user);
	const { markDirty, markClean, registerSaveHandler, registerDiscardHandler } = useSettingsContext();
	const { formatDate } = useDateTime();

	const originalFullName = user?.full_name || '';
	const originalJobTitle = ''; // Not in current model — placeholder
	const originalEmail = user?.email || '';

	const [fullName, setFullName] = useState(originalFullName);
	const [jobTitle, setJobTitle] = useState(originalJobTitle);

	// Track dirty fields
	useEffect(() => {
		if (fullName !== originalFullName) {
			markDirty('profile.fullName');
		} else {
			markClean('profile.fullName');
		}
	}, [fullName, originalFullName, markDirty, markClean]);

	useEffect(() => {
		if (jobTitle !== originalJobTitle) {
			markDirty('profile.jobTitle');
		} else {
			markClean('profile.jobTitle');
		}
	}, [jobTitle, originalJobTitle, markDirty, markClean]);

	// Register save & discard handlers
	const handleSave = useCallback(async () => {
		// In the future, call updateProfile with full_name, job_title, etc.
		// For now, this is UI-only for profile fields beyond timezone/currency.
	}, []);

	const handleDiscard = useCallback(() => {
		setFullName(originalFullName);
		setJobTitle(originalJobTitle);
	}, [originalFullName, originalJobTitle]);

	useEffect(() => {
		registerSaveHandler('profile', handleSave);
		registerDiscardHandler('profile', handleDiscard);
	}, [registerSaveHandler, registerDiscardHandler, handleSave, handleDiscard]);

	const userInitials = user
		? (user.full_name || user.username)
				.split(' ')
				.map((n: string) => n[0])
				.join('')
				.toUpperCase()
				.slice(0, 2)
		: 'U';

	const cardBg = isDark ? '#141822' : '#ffffff';
	const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
	const labelColor = isDark ? '#8B7CF6' : '#7C3AED';

	const fieldSx = (readOnly?: boolean) => ({
		'& .MuiOutlinedInput-root': {
			bgcolor: readOnly ? (isDark ? '#1a1e28' : '#f1f5f9') : (isDark ? '#1a1e28' : '#f8fafc'),
			borderRadius: 2,
			'& fieldset': {
				borderColor: readOnly ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)') : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
			},
		},
		'& .MuiInputBase-input': {
			color: readOnly ? (isDark ? '#94A3B8' : '#64748b') : (isDark ? '#F4F5F7' : '#1e293b'),
			fontWeight: readOnly ? 500 : 600,
		},
	});

	const fieldLabelSx = { color: labelColor, fontWeight: 700, display: 'block' as const, mb: 0.75, fontSize: '0.75rem' };

	const overviewItems = [
		{
			icon: <RoleIcon sx={{ fontSize: 18 }} />,
			label: 'Role',
			value: user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '—',
		},
		{
			icon: <OrgIcon sx={{ fontSize: 18 }} />,
			label: 'Organization',
			value: user?.organization?.name || 'None',
		},
		{
			icon: <CalendarIcon sx={{ fontSize: 18 }} />,
			label: 'Member Since',
			value: user?.created_at ? formatDate(user.created_at) : '—',
		},
	];

	return (
		<Box>
			{/* Section Header */}
			<Typography
				variant="subtitle1"
				sx={{
					fontWeight: 800,
					fontSize: '0.9rem',
					textTransform: 'uppercase',
					letterSpacing: '0.08em',
					color: isDark ? '#F4F5F7' : '#1e293b',
					mb: 0.5,
				}}
			>
				Profile Settings
			</Typography>
			<Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748b', mb: 4 }}>
				Update your personal information and public profile identity.
			</Typography>

			{/* Unified Profile Card — identity header, editable fields, and account
			    facts all in one place instead of scattered across separate boxes */}
			<Box
				sx={{
					bgcolor: cardBg,
					border: `1px solid ${cardBorder}`,
					borderRadius: 3,
					overflow: 'hidden',
					mb: 5,
				}}
			>
				{/* Identity header band */}
				<Box
					sx={{
						p: { xs: 3, sm: 4 },
						background: isDark
							? 'linear-gradient(135deg, rgba(139,124,246,0.12) 0%, rgba(78,168,255,0.05) 100%)'
							: 'linear-gradient(135deg, rgba(139,124,246,0.08) 0%, rgba(78,168,255,0.03) 100%)',
						borderBottom: `1px solid ${cardBorder}`,
					}}
				>
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
						<Avatar
							sx={{
								width: 84,
								height: 84,
								bgcolor: alpha('#8B7CF6', 0.2),
								color: '#8B7CF6',
								fontSize: '1.85rem',
								fontWeight: 800,
								border: `3px solid ${alpha('#8B7CF6', 0.3)}`,
								flexShrink: 0,
							}}
						>
							{userInitials}
						</Avatar>
						<Box sx={{ minWidth: 0, flexGrow: 1 }}>
							<Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#F4F5F7' : '#1e293b' }} noWrap>
								{user?.full_name || user?.username}
							</Typography>
							<Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748b' }} noWrap>
								{user?.email}
							</Typography>
							<Stack direction="row" spacing={1} sx={{ mt: 1.25 }}>
								<Chip
									label={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Member'}
									size="small"
									sx={{
										bgcolor: alpha('#8B7CF6', isDark ? 0.18 : 0.12),
										color: '#8B7CF6',
										fontWeight: 700,
										fontSize: '0.7rem',
									}}
								/>
								{user?.is_verified ? (
									<Chip
										icon={<VerifiedIcon sx={{ fontSize: '0.9rem !important' }} />}
										label="Verified"
										size="small"
										sx={{
											bgcolor: alpha('#10b981', 0.15),
											color: '#10b981',
											fontWeight: 700,
											fontSize: '0.7rem',
										}}
									/>
								) : (
									<Chip
										label="Unverified"
										size="small"
										sx={{
											bgcolor: alpha('#f59e0b', 0.15),
											color: '#f59e0b',
											fontWeight: 700,
											fontSize: '0.7rem',
										}}
									/>
								)}
							</Stack>
						</Box>
					</Stack>
				</Box>

				{/* Editable fields + account facts */}
				<Box sx={{ p: { xs: 3, sm: 4 } }}>
					<Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#F4F5F7' : '#1e293b', mb: 2.5 }}>
						Edit Profile
					</Typography>

					<Box
						sx={{
							display: 'grid',
							gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
							gap: 3,
							mb: 4,
						}}
					>
						<Box>
							<Typography variant="caption" sx={fieldLabelSx}>Full Name</Typography>
							<TextField
								fullWidth
								size="small"
								value={fullName}
								onChange={(e) => setFullName(e.target.value)}
								sx={fieldSx()}
							/>
						</Box>
						<Box>
							<Typography variant="caption" sx={fieldLabelSx}>Corporate Email (Read-only)</Typography>
							<TextField fullWidth size="small" value={originalEmail} disabled sx={fieldSx(true)} />
						</Box>
						<Box>
							<Typography variant="caption" sx={fieldLabelSx}>Job Title</Typography>
							<TextField
								fullWidth
								size="small"
								value={jobTitle}
								onChange={(e) => setJobTitle(e.target.value)}
								placeholder="Enter your job title"
								sx={fieldSx()}
							/>
						</Box>
						<Box>
							<Typography variant="caption" sx={fieldLabelSx}>Username (Read-only)</Typography>
							<TextField fullWidth size="small" value={user?.username ? `@${user.username}` : ''} disabled sx={fieldSx(true)} />
						</Box>
					</Box>

					<Divider sx={{ borderColor: cardBorder, mb: 3 }} />

					<Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#F4F5F7' : '#1e293b', mb: 2 }}>
						Account Overview
					</Typography>
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
						{overviewItems.map((item) => (
							<Stack key={item.label} direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
								<Box
									sx={{
										width: 36,
										height: 36,
										borderRadius: 2,
										bgcolor: alpha('#8B7CF6', isDark ? 0.12 : 0.08),
										color: '#8B7CF6',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										flexShrink: 0,
									}}
								>
									{item.icon}
								</Box>
								<Box sx={{ minWidth: 0 }}>
									<Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748b', display: 'block' }}>
										{item.label}
									</Typography>
									<Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#F4F5F7' : '#1e293b' }} noWrap>
										{item.value}
									</Typography>
								</Box>
							</Stack>
						))}
					</Stack>
				</Box>
			</Box>
		</Box>
	);
};

export default ProfileTab;
