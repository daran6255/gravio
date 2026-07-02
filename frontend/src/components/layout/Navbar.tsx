import React from 'react';
import { AppBar, Toolbar, IconButton, Box, Button, Chip, Divider, Tooltip } from '@mui/material';
import {
	Menu as MenuIcon,
	LightMode as LightModeIcon,
	DarkMode as DarkModeIcon,
	HeadsetMicOutlined as SupportIcon,
	HourglassEmpty as HourglassIcon,
	AutoAwesome as PremiumIcon,
	Warning as WarningIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useNavigate } from 'react-router-dom';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { useColorMode } from '../../theme/ThemeContext';
import GlobalSearch from '../common/GlobalSearch';
import NotificationBell from './NotificationBell';
import { getCurrencySymbol } from '../../utils/currency';

const DRAWER_WIDTH = 260;

const Navbar: React.FC = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const { mode, toggleColorMode } = useColorMode();
	const user = useAppSelector((state) => state.auth.user);

	// Calculate trial days left
	const getTrialDaysLeft = (expiryDateStr?: string) => {
		if (!expiryDateStr) return 0;
		const expiry = new Date(expiryDateStr);
		const today = new Date();
		expiry.setHours(0, 0, 0, 0);
		today.setHours(0, 0, 0, 0);
		const diffTime = expiry.getTime() - today.getTime();
		return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	};

	// Determine plan text, styles, and icons
	const renderSubscriptionBadge = () => {
		if (!user) return null;

		const org = user.organization;

		// If superuser and has no organization, show a premium System Admin badge
		if (user.is_superuser && !org) {
			return (
				<Tooltip title="You are logged in as a System Super Administrator. Click to view settings." arrow>
					<Button
						onClick={() => navigate('/settings')}
						sx={{
							display: 'flex',
							alignItems: 'center',
							textTransform: 'none',
							fontSize: '0.8125rem',
							fontWeight: 700,
							borderRadius: '20px',
							px: { xs: 1, sm: 2 },
							py: 0.5,
							minWidth: 0,
							mr: 1.5,
							transition: 'all 0.2s ease-in-out',
							background: 'linear-gradient(135deg, #8B7CF6 0%, #6052d9 100%)',
							border: 'none',
							color: '#ffffff',
							boxShadow: '0 2px 10px rgba(139, 124, 246, 0.3)',
							'&:hover': {
								transform: 'translateY(-1px)',
								boxShadow: '0 4px 14px rgba(139, 124, 246, 0.5)',
								opacity: 0.95,
							},
						}}
					>
						<PremiumIcon sx={{ fontSize: '1rem', mr: { xs: 0, sm: 0.5 }, color: '#ffffff' }} />
						<Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
							Super Admin
						</Box>
					</Button>
				</Tooltip>
			);
		}

		if (!org) return null;
		const status = org.subscription_status || 'trial';
		const daysLeft = getTrialDaysLeft(org.trial_expires_at);

		let badgeText = '';
		let tooltipText = '';
		let icon = null;
		let badgeStyles: React.CSSProperties = {};
		let dotColor = '';

		if (status === 'trial') {
			if (daysLeft < 0) {
				badgeText = 'Trial Expired';
				tooltipText = 'Your free trial has expired. Click to upgrade and resume access.';
				icon = <WarningIcon sx={{ fontSize: '1rem', mr: { xs: 0, sm: 0.5 }, color: '#EF4444' }} />;
				badgeStyles = {
					background: mode === 'light' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.15)',
					border: '1px solid rgba(239, 68, 68, 0.3)',
					color: '#EF4444',
				};
			} else if (daysLeft === 0) {
				badgeText = 'Expires Today';
				tooltipText = 'Your free trial expires today! Click here to upgrade.';
				icon = <WarningIcon sx={{ fontSize: '1rem', mr: { xs: 0, sm: 0.5 }, color: '#F59E0B' }} />;
				badgeStyles = {
					background: mode === 'light' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.15)',
					border: '1px solid rgba(245, 158, 11, 0.3)',
					color: '#F59E0B',
				};
				dotColor = '#F59E0B';
			} else {
				badgeText = `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;
				tooltipText = `Free Trial: ${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining (Expires ${new Date(org.trial_expires_at!).toLocaleDateString()}). Click to upgrade.`;
				icon = <HourglassIcon sx={{ fontSize: '1rem', mr: { xs: 0, sm: 0.5 }, color: '#F59E0B' }} />;
				badgeStyles = {
					background: mode === 'light' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.15)',
					border: '1px solid rgba(245, 158, 11, 0.3)',
					color: '#F59E0B',
				};
				dotColor = '#F59E0B';
			}
		} else if (status === 'active' || status === 'paid') {
			const planName = org.plan_name || (org.plan?.name) || 'Pro';
			badgeText = planName;
			tooltipText = `Active ${planName} Plan. Click to view billing options.`;
			icon = <PremiumIcon sx={{ fontSize: '1rem', mr: { xs: 0, sm: 0.5 }, color: '#8B7CF6' }} />;
			badgeStyles = {
				background: mode === 'light' ? 'rgba(139, 124, 246, 0.1)' : 'rgba(139, 124, 246, 0.15)',
				border: '1px solid rgba(139, 124, 246, 0.3)',
				color: mode === 'light' ? '#7C3AED' : '#A78BFA',
			};
		} else if (status === 'expired') {
			badgeText = 'Expired';
			tooltipText = 'Your subscription has expired. Click here to renew.';
			icon = <WarningIcon sx={{ fontSize: '1rem', mr: { xs: 0, sm: 0.5 }, color: '#EF4444' }} />;
			badgeStyles = {
				background: mode === 'light' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.15)',
				border: '1px solid rgba(239, 68, 68, 0.3)',
				color: '#EF4444',
			};
		} else {
			return null;
		}

		return (
			<Tooltip title={tooltipText} arrow>
				<Button
					onClick={() => navigate('/billing')}
					sx={{
						display: 'flex',
						alignItems: 'center',
						textTransform: 'none',
						fontSize: '0.8125rem',
						fontWeight: 700,
						borderRadius: '10px',
						px: { xs: 1, sm: 2 },
						py: 0.5,
						minWidth: 0,
						mr: 1.5,
						transition: 'all 0.2s ease-in-out',
						...badgeStyles,
						'&:hover': {
							transform: 'translateY(-1px)',
							boxShadow: mode === 'light' 
								? '0 4px 10px rgba(0,0,0,0.05)' 
								: '0 4px 10px rgba(255,255,255,0.03)',
							background: badgeStyles.background,
							opacity: 0.9,
						},
					}}
				>
					{icon}
					
					<Box
						component="span"
						sx={{
							display: { xs: 'none', sm: 'inline-flex' },
							alignItems: 'center',
							gap: 0.75
						}}
					>
						{badgeText}
						{dotColor && (
							<Box
								sx={{
									width: 6,
									height: 6,
									borderRadius: '50%',
									backgroundColor: dotColor,
									boxShadow: `0 0 6px ${dotColor}`,
									animation: 'pulseBadgeDot 2s infinite',
									'@keyframes pulseBadgeDot': {
										'0%': {
											transform: 'scale(0.95)',
											boxShadow: `0 0 0 0 rgba(245, 158, 11, 0.7)`,
										},
										'70%': {
											transform: 'scale(1)',
											boxShadow: `0 0 0 5px rgba(245, 158, 11, 0)`,
										},
										'100%': {
											transform: 'scale(0.95)',
											boxShadow: `0 0 0 0 rgba(245, 158, 11, 0)`,
										},
									},
								}}
							/>
						)}
					</Box>
				</Button>
			</Tooltip>
		);
	};

	return (
		<AppBar
			position="fixed"
			component="nav"
			aria-label="Main Navigation"
			sx={{
				width: {
					xs: '100%',
					md: `calc(100% - ${DRAWER_WIDTH}px)`
				},
				ml: {
					xs: 0,
					md: `${DRAWER_WIDTH}px`
				},
				left: 0,
				right: 0,
				transition: (theme) => theme.transitions.create(['width', 'margin'], {
					easing: theme.transitions.easing.sharp,
					duration: theme.transitions.duration.standard,
				}),
				backgroundColor: mode === 'light' ? '#ffffff' : '#0B0D12',
				color: mode === 'light' ? '#1e293b' : '#F4F5F7',
				borderBottom: `1px solid ${mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'}`,
				boxShadow: 'none',
				zIndex: (theme) => theme.zIndex.drawer - 1,
			}}
		>
			<Toolbar sx={{ height: 64, px: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
				{/* Left Side: Toggle button & Search */}
				<Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
					<IconButton
						color="inherit"
						aria-label="Toggle sidebar navigation"
						edge="start"
						onClick={() => dispatch(toggleSidebar())}
						sx={{
							mr: 2,
							color: mode === 'light' ? '#64748b' : '#94A3B8',
							display: { xs: 'inline-flex', md: 'none' }
						}}
					>
						<MenuIcon aria-hidden="true" />
					</IconButton>
					<GlobalSearch />
				</Box>

				{/* Right Side: Theme Toggle, Notifications, Help, Divider, Action Button */}
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
					{/* Subscription Plan / Trial Badge */}
					{renderSubscriptionBadge()}

					{/* Preferred Display Currency */}
					{user?.currency && (
						<Tooltip title={`Display currency: ${user.currency}. Click to change.`} arrow>
							<Chip
								label={`${getCurrencySymbol(user.currency)} ${user.currency}`}
								size="small"
								onClick={() => navigate('/account-settings')}
								sx={{
									fontWeight: 700,
									fontSize: '0.75rem',
									mr: 1.5,
									cursor: 'pointer',
									borderRadius: '10px',
									bgcolor: mode === 'light' ? 'rgba(139, 124, 246, 0.1)' : 'rgba(139, 124, 246, 0.15)',
									color: mode === 'light' ? '#7C3AED' : '#A78BFA',
									border: '1px solid rgba(139, 124, 246, 0.3)',
									display: { xs: 'none', sm: 'inline-flex' },
								}}
							/>
						</Tooltip>
					)}

					{/* Theme Mode Toggle */}
					<IconButton
						onClick={toggleColorMode}
						color="inherit"
						sx={{ color: mode === 'light' ? '#64748b' : '#94A3B8' }}
						aria-label={`switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
						title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
					>
						{mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
					</IconButton>

					{/* Notification Bell */}
					<Box sx={{ color: mode === 'light' ? '#64748b' : '#94A3B8' }}>
						<NotificationBell />
					</Box>

					{/* Vertical Line Divider */}
					<Divider
						orientation="vertical"
						flexItem
						sx={{
							mx: { xs: 1, sm: 2 },
							my: 1.5,
							borderColor: mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
							display: { xs: 'none', sm: 'block' }
						}}
					/>

					{/* Help & Support Button */}
					<Button
						variant="contained"
						aria-label="Help and support"
						sx={{
							borderRadius: '10px',
							fontWeight: 700,
							textTransform: 'none',
							fontSize: '0.8125rem',
							px: { xs: 1.5, sm: 2.5 },
							py: 0.85,
							minWidth: 0,
							color: '#ffffff',
							background: 'linear-gradient(135deg, #8B7CF6 0%, #6052d9 100%)',
							boxShadow: '0 4px 14px 0 rgba(139, 124, 246, 0.4)',
							border: 'none',
							transition: 'all 0.2s ease',
							'&:hover': {
								background: 'linear-gradient(135deg, #9C8FFF 0%, #7062E9 100%)',
								boxShadow: '0 6px 20px 0 rgba(139, 124, 246, 0.6)',
								transform: 'translateY(-1px)',
							}
						}}
					>
						<SupportIcon sx={{ mr: { xs: 0, sm: 0.75 }, fontSize: '1.1rem' }} />
						<Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
							Help & Support
						</Box>
					</Button>
				</Box>
			</Toolbar>
		</AppBar>
	);
};

export default Navbar;
