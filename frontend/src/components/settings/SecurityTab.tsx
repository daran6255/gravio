import React, { useState } from 'react';
import {
	Box,
	Typography,
	Stack,
	Switch,
	Chip,
	alpha,
} from '@mui/material';
import {
	Monitor as DeviceDesktopIcon,
	PhoneIphone as DevicePhoneIcon,
	VerifiedUser as VerifiedIcon,
	GppGood as ActiveAccountIcon,
	Update as LastUpdatedIcon,
	Password as TwoFactorIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material';
import { useAppSelector } from '../../store/hooks';
import useDateTime from '../../hooks/useDateTime';

interface ActiveSession {
	id: string;
	device: string;
	browser: string;
	ip: string;
	location: string;
	isCurrent: boolean;
	lastActive?: string;
}

const mockSessions: ActiveSession[] = [
	{
		id: '1',
		device: 'Desktop',
		browser: 'Chrome on macOS Monterey',
		ip: '192.168.1.45',
		location: 'Palo Alto, USA',
		isCurrent: true,
	},
	{
		id: '2',
		device: 'Mobile',
		browser: 'Safari on iPhone 15 Pro',
		ip: '',
		location: 'New York, USA',
		isCurrent: false,
		lastActive: 'Last active: 2 hours ago',
	},
];

const SecurityTab: React.FC = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const user = useAppSelector((state) => state.auth.user);
	const { formatDate } = useDateTime();

	const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

	const cardBg = isDark ? '#141822' : '#ffffff';
	const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
	const labelColor = isDark ? '#94A3B8' : '#64748b';

	const statusItems = [
		{
			icon: <VerifiedIcon sx={{ fontSize: 18 }} />,
			label: 'Email Verification',
			value: user?.is_verified ? 'Verified' : 'Not verified',
			tone: user?.is_verified ? '#10b981' : '#f59e0b',
		},
		{
			icon: <ActiveAccountIcon sx={{ fontSize: 18 }} />,
			label: 'Account Status',
			value: user?.is_active ? 'Active' : 'Deactivated',
			tone: user?.is_active ? '#10b981' : '#ef4444',
		},
		{
			icon: <LastUpdatedIcon sx={{ fontSize: 18 }} />,
			label: 'Profile Last Updated',
			value: user?.updated_at ? formatDate(user.updated_at) : '—',
			tone: '#8B7CF6',
		},
		{
			icon: <TwoFactorIcon sx={{ fontSize: 18 }} />,
			label: 'Two-Factor Auth',
			value: twoFactorEnabled ? 'Enabled' : 'Disabled',
			tone: twoFactorEnabled ? '#10b981' : '#f59e0b',
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
				Security & Access
			</Typography>
			<Typography variant="body2" sx={{ color: labelColor, mb: 4 }}>
				Manage your credentials, multi-factor authentication, and active sessions.
			</Typography>

			{/* Account Status — real, verifiable account facts instead of leaving
			    the tab looking sparse above the password/session cards */}
			<Box
				sx={{
					bgcolor: cardBg,
					border: `1px solid ${cardBorder}`,
					borderRadius: 4,
					boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.25)' : '0 8px 32px rgba(15,23,42,0.06)',
					p: 3,
					mb: 3,
				}}
			>
				<Typography
					variant="body2"
					sx={{ fontWeight: 700, color: isDark ? '#F4F5F7' : '#1e293b', mb: 2 }}
				>
					Account Status
				</Typography>
				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
					{statusItems.map((item) => (
						<Stack key={item.label} direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
							<Box
								sx={{
									width: 36,
									height: 36,
									borderRadius: 2,
									bgcolor: alpha(item.tone, isDark ? 0.15 : 0.1),
									color: item.tone,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									flexShrink: 0,
								}}
							>
								{item.icon}
							</Box>
							<Box sx={{ minWidth: 0 }}>
								<Typography variant="caption" sx={{ color: labelColor, display: 'block' }}>
									{item.label}
								</Typography>
								<Typography variant="body2" sx={{ fontWeight: 700, color: item.tone }} noWrap>
									{item.value}
								</Typography>
							</Box>
						</Stack>
					))}
				</Stack>
			</Box>

			{/* Password & 2FA + Active Sessions */}
			<Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mb: 5 }}>
				{/* Password & 2FA Card */}
				<Box
					sx={{
						flex: 1,
						bgcolor: cardBg,
						border: `1px solid ${cardBorder}`,
						borderRadius: 4,
						boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.25)' : '0 8px 32px rgba(15,23,42,0.06)',
						p: 3,
					}}
				>
					{/* Password Management */}
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							mb: 3,
						}}
					>
						<Box>
							<Typography
								variant="body2"
								sx={{ fontWeight: 700, color: isDark ? '#F4F5F7' : '#1e293b', mb: 0.25 }}
							>
								Password Management
							</Typography>
							<Typography variant="caption" sx={{ color: labelColor }}>
								Last changed 42 days ago.
							</Typography>
						</Box>
						<Typography
							variant="body2"
							sx={{
								color: '#8B7CF6',
								fontWeight: 600,
								cursor: 'pointer',
								'&:hover': { textDecoration: 'underline' },
							}}
						>
							Update
						</Typography>
					</Box>

					{/* Two-Factor Authentication */}
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							pt: 2,
							borderTop: `1px solid ${cardBorder}`,
						}}
					>
						<Box>
							<Typography
								variant="body2"
								sx={{ fontWeight: 700, color: isDark ? '#F4F5F7' : '#1e293b', mb: 0.25 }}
							>
								Two-Factor Authentication
							</Typography>
							<Typography variant="caption" sx={{ color: labelColor }}>
								Secure your account with TOTP.
							</Typography>
						</Box>
						<Stack direction="row" spacing={1} alignItems="center">
							{twoFactorEnabled && (
								<Chip
									label="ACTIVE"
									size="small"
									sx={{
										bgcolor: alpha('#10b981', 0.15),
										color: '#10b981',
										fontWeight: 800,
										fontSize: '0.65rem',
										height: 22,
										letterSpacing: '0.05em',
									}}
								/>
							)}
							<Switch
								checked={twoFactorEnabled}
								onChange={(e) => setTwoFactorEnabled(e.target.checked)}
								sx={{
									'& .MuiSwitch-switchBase.Mui-checked': {
										color: '#8B7CF6',
									},
									'& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
										bgcolor: '#8B7CF6',
									},
								}}
							/>
						</Stack>
					</Box>
				</Box>

				{/* Active Sessions Card */}
				<Box
					sx={{
						flex: 1,
						bgcolor: cardBg,
						border: `1px solid ${cardBorder}`,
						borderRadius: 4,
						boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.25)' : '0 8px 32px rgba(15,23,42,0.06)',
						p: 3,
					}}
				>
					<Typography
						variant="body2"
						sx={{ fontWeight: 700, color: isDark ? '#F4F5F7' : '#1e293b', mb: 2.5 }}
					>
						Active Sessions
					</Typography>

					<Stack spacing={2}>
						{mockSessions.map((session) => (
							<Box
								key={session.id}
								sx={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									gap: 2,
								}}
							>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
									<Box
										sx={{
											width: 36,
											height: 36,
											borderRadius: 2,
											bgcolor: isDark ? alpha('#8B7CF6', 0.1) : alpha('#8B7CF6', 0.08),
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											color: '#8B7CF6',
										}}
									>
										{session.device === 'Desktop' ? (
											<DeviceDesktopIcon sx={{ fontSize: '1.2rem' }} />
										) : (
											<DevicePhoneIcon sx={{ fontSize: '1.2rem' }} />
										)}
									</Box>
									<Box>
										<Typography
											variant="body2"
											sx={{
												fontWeight: 600,
												color: isDark ? '#F4F5F7' : '#1e293b',
												fontSize: '0.8rem',
											}}
										>
											{session.browser}
										</Typography>
										<Typography variant="caption" sx={{ color: labelColor, fontSize: '0.7rem' }}>
											{session.ip && `${session.ip} • `}
											{session.location}
											{session.lastActive && (
												<>
													<br />
													{session.lastActive}
												</>
											)}
										</Typography>
									</Box>
								</Box>
								<Typography
									variant="caption"
									sx={{
										fontWeight: 800,
										fontSize: '0.65rem',
										letterSpacing: '0.05em',
										color: session.isCurrent ? '#10b981' : '#ef4444',
										cursor: session.isCurrent ? 'default' : 'pointer',
										'&:hover': !session.isCurrent ? { textDecoration: 'underline' } : {},
									}}
								>
									{session.isCurrent ? 'CURRENT' : 'REVOKE'}
								</Typography>
							</Box>
						))}
					</Stack>
				</Box>
			</Stack>
		</Box>
	);
};

export default SecurityTab;
