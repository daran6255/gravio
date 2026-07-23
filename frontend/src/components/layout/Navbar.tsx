import React from 'react';
import { AppBar, Toolbar, IconButton, Box, Button, Chip, Divider, Tooltip } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
	Menu as MenuIcon,
	LightMode as LightModeIcon,
	DarkMode as DarkModeIcon,
	HeadsetMicOutlined as SupportIcon,
	HourglassEmpty as HourglassIcon,
	AutoAwesome as PremiumIcon,
	Warning as WarningIcon,
	BoltOutlined as CreditsIcon,
	AutoAwesome as IrisChatIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useNavigate } from 'react-router-dom';
import { toggleSidebar, toggleChatDrawer } from '../../store/slices/uiSlice';
import { useColorMode } from '../../theme/ThemeContext';
import GlobalSearch from '../common/GlobalSearch';
import NotificationBell from './NotificationBell';
import { getCurrencySymbol } from '../../utils/currency';
import { useAICreditBalance } from '../../hooks/useAICreditBalance';

const Navbar: React.FC = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const theme = useTheme();
	const { mode, toggleColorMode } = useColorMode();
	const user = useAppSelector((state) => state.auth.user);
	const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen);
	const currentDrawerWidth = sidebarOpen ? theme.layout.drawerWidth : theme.layout.drawerWidthCollapsed;

	// AI credit balance -- shared with Sidebar's mobile-only badge (useAICreditBalance);
	// only orgs have a wallet (GET /ai/credits 404s for a superuser with no organization).
	const aiCredits = useAICreditBalance();

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
						sx={(theme) => ({
							display: 'flex',
							alignItems: 'center',
							textTransform: 'none',
							...theme.typography.navBadge,
							borderRadius: theme.layout.radius.pill,
							height: theme.layout.badgeHeight,
							px: { xs: 1, sm: 2 },
							py: 0,
							minWidth: 0,
							flexShrink: 0,
							whiteSpace: 'nowrap',
							mr: 1.5,
							transition: 'all 0.2s ease-in-out',
							background: theme.gradients.brandDiagonal,
							border: 'none',
							color: theme.palette.primary.contrastText,
							boxShadow: `0 2px 10px ${alpha(theme.palette.primary.main, 0.3)}`,
							'&:hover': {
								transform: 'translateY(-1px)',
								boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.5)}`,
								opacity: 0.95,
							},
						})}
					>
						<PremiumIcon sx={{ fontSize: '1rem', mr: { xs: 0, sm: 0.5 }, color: (theme) => theme.palette.primary.contrastText }} />
						<Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
							Super Admin
						</Box>
					</Button>
				</Tooltip>
			);
		}

		if (!org) return null;
		// The Navbar only ever surfaces the free-trial countdown — the current
		// plan (active/paid) and an expired subscription are shown as the
		// "current plan" badge at the bottom of the Sidebar instead.
		const status = org.subscription_status || 'trial';
		if (status !== 'trial') return null;
		const daysLeft = getTrialDaysLeft(org.trial_expires_at);

		let badgeText = '';
		let tooltipText = '';
		let icon = null;
		let badgeStyles: React.CSSProperties = {};
		let dotColor = '';

		const tintBg = (color: string) => alpha(color, mode === 'light' ? 0.1 : 0.15);
		const tintBorder = (color: string) => `1px solid ${alpha(color, 0.3)}`;

		if (daysLeft < 0) {
			badgeText = 'Trial Expired';
			tooltipText = 'Your free trial has expired. Click to upgrade and resume access.';
			icon = <WarningIcon sx={{ fontSize: '1rem', mr: 0.5, color: theme.palette.error.main }} />;
			badgeStyles = {
				background: tintBg(theme.palette.error.main),
				border: tintBorder(theme.palette.error.main),
				color: theme.palette.error.main,
			};
		} else if (daysLeft === 0) {
			badgeText = 'Expires Today';
			tooltipText = 'Your free trial expires today! Click here to upgrade.';
			icon = <WarningIcon sx={{ fontSize: '1rem', mr: 0.5, color: theme.palette.warning.main }} />;
			badgeStyles = {
				background: tintBg(theme.palette.warning.main),
				border: tintBorder(theme.palette.warning.main),
				color: theme.palette.warning.main,
			};
			dotColor = theme.palette.warning.main;
		} else {
			badgeText = `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;
			tooltipText = `Free Trial: ${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining (Expires ${new Date(org.trial_expires_at!).toLocaleDateString()}). Click to upgrade.`;
			icon = <HourglassIcon sx={{ fontSize: '1rem', mr: 0.5, color: theme.palette.warning.main }} />;
			badgeStyles = {
				background: tintBg(theme.palette.warning.main),
				border: tintBorder(theme.palette.warning.main),
				color: theme.palette.warning.main,
			};
			dotColor = theme.palette.warning.main;
		}

		return (
			<Tooltip title={tooltipText} arrow>
				<Button
					onClick={() => navigate('/billing')}
					sx={{
						display: 'flex',
						alignItems: 'center',
						textTransform: 'none',
						...theme.typography.navBadge,
						borderRadius: theme.layout.radius.pill,
						height: theme.layout.badgeHeight,
						px: { xs: 0.75, sm: 2 },
						py: 0,
						minWidth: 0,
						flexShrink: 0,
						whiteSpace: 'nowrap',
						mr: { xs: 0.5, sm: 1.5 },
						transition: 'all 0.2s ease-in-out',
						...badgeStyles,
						'&:hover': {
							transform: 'translateY(-1px)',
							boxShadow: mode === 'light'
								? `0 4px 10px ${alpha(theme.palette.common.black, 0.05)}`
								: `0 4px 10px ${alpha(theme.palette.common.white, 0.03)}`,
							background: badgeStyles.background,
							opacity: 0.9,
						},
					}}
				>
					{icon}

					<Box
						component="span"
						sx={{
							display: 'inline-flex',
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
											boxShadow: `0 0 0 0 ${alpha(dotColor, 0.7)}`,
										},
										'70%': {
											transform: 'scale(1)',
											boxShadow: `0 0 0 5px ${alpha(dotColor, 0)}`,
										},
										'100%': {
											transform: 'scale(0.95)',
											boxShadow: `0 0 0 0 ${alpha(dotColor, 0)}`,
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
					md: `calc(100% - ${currentDrawerWidth}px)`
				},
				ml: {
					xs: 0,
					md: `${currentDrawerWidth}px`
				},
				left: 0,
				right: 0,
				transition: (theme) => theme.transitions.create(['width', 'margin'], {
					easing: theme.transitions.easing.sharp,
					duration: theme.transitions.duration.standard,
				}),
				backgroundColor: theme.layout.navbar.background,
				color: theme.palette.text.primary,
				borderBottom: `1px solid ${theme.palette.divider}`,
				boxShadow: 'none',
				zIndex: (theme) => theme.zIndex.drawer - 1,
			}}
		>
			<Toolbar sx={{ height: theme.layout.navbarHeight, px: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
				{/* Left Side: Toggle button & Search */}
				<Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
					<IconButton
						color="inherit"
						aria-label="Toggle sidebar navigation"
						edge="start"
						onClick={() => dispatch(toggleSidebar())}
						sx={{
							mr: 2,
							color: theme.palette.text.secondary,
							display: 'inline-flex'
						}}
					>
						<MenuIcon aria-hidden="true" />
					</IconButton>
					<GlobalSearch />
				</Box>

				{/* Right Side: Theme Toggle, Notifications, Help, Divider, Action Button */}
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
					{/* Subscription Plan / Trial Badge — desktop only (moved to Sidebar on mobile) */}
					<Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center' }}>
						{renderSubscriptionBadge()}
					</Box>

					{/* AI Credits remaining this month */}
					{aiCredits && (() => {
						const brand = '#8B7CF6';
						const isOut = aiCredits.balance <= 0;
						const isLow = !isOut && aiCredits.percent_used >= 90;
						const accent = isOut ? theme.palette.error.main : isLow ? theme.palette.warning.main : brand;
						const resetsOn = new Date(aiCredits.period_start);
						resetsOn.setMonth(resetsOn.getMonth() + 1);
						return (
							<Tooltip
								title={`${aiCredits.balance.toLocaleString()} of ${aiCredits.granted.toLocaleString()} AI credits left this month (${aiCredits.percent_used}% used) — resets ${resetsOn.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
								arrow
							>
								<Chip
									icon={<CreditsIcon sx={{ fontSize: '1rem', color: `${accent} !important` }} />}
									label={`${aiCredits.balance.toLocaleString()} credits`}
									size="small"
									onClick={() => navigate('/ai-usage')}
									sx={{
										...theme.typography.chipLabel,
										height: theme.layout.badgeHeight,
										mr: 1.5,
										flexShrink: 0,
										cursor: 'pointer',
										borderRadius: theme.layout.radius.pill,
										bgcolor: alpha(accent, mode === 'light' ? 0.1 : 0.15),
										color: accent,
										border: `1px solid ${alpha(accent, 0.3)}`,
										display: { xs: 'none', sm: 'inline-flex' },
									}}
								/>
							</Tooltip>
						);
					})()}

					{/* Preferred Display Currency */}
					{user?.currency && (
						<Tooltip title={`Display currency: ${user.currency}. Click to change.`} arrow>
							<Chip
								label={`${getCurrencySymbol(user.currency)} ${user.currency}`}
								size="small"
								onClick={() => navigate('/account-settings')}
								sx={{
									...theme.typography.chipLabel,
									height: theme.layout.badgeHeight,
									mr: 1.5,
									flexShrink: 0,
									cursor: 'pointer',
									borderRadius: theme.layout.radius.pill,
									bgcolor: alpha(theme.palette.primary.main, mode === 'light' ? 0.1 : 0.15),
									color: mode === 'light' ? theme.palette.primary.dark : theme.palette.primary.light,
									border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
									display: { xs: 'none', sm: 'inline-flex' },
								}}
							/>
						</Tooltip>
					)}

					{/* Theme Mode Toggle */}
					<IconButton
						onClick={toggleColorMode}
						color="inherit"
						sx={{ color: theme.palette.text.secondary }}
						aria-label={`switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
						title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
					>
						{mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
					</IconButton>

					{/* Ask IRIS -- opens the AI chat drawer */}
					{user?.organization && (
						<Tooltip title="Ask IRIS" arrow>
							<IconButton
								onClick={() => dispatch(toggleChatDrawer())}
								color="inherit"
								sx={{ color: '#8B7CF6' }}
								aria-label="Open IRIS chat"
							>
								<IrisChatIcon />
							</IconButton>
						</Tooltip>
					)}

					{/* Notification Bell */}
					<Box sx={{ color: theme.palette.text.secondary }}>
						<NotificationBell />
					</Box>

					{/* Vertical Line Divider */}
					<Divider
						orientation="vertical"
						flexItem
						sx={{
							mx: { xs: 1, sm: 2 },
							my: 1.5,
							borderColor: theme.palette.divider,
							display: { xs: 'none', sm: 'block' }
						}}
					/>

					{/* Help & Support Button — desktop only (moved to Sidebar on mobile) */}
					<Button
						variant="contained"
						aria-label="Help and support"
						sx={(theme) => ({
							display: { xs: 'none', sm: 'inline-flex' },
							borderRadius: theme.layout.radius.pill,
							textTransform: 'none',
							...theme.typography.navBadge,
							px: 2.5,
							py: 0.85,
							minWidth: 0,
							color: theme.palette.primary.contrastText,
							background: theme.gradients.brandDiagonal,
							boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.4)}`,
							border: 'none',
							transition: 'all 0.2s ease',
							'&:hover': {
								background: theme.gradients.brandDiagonalHover,
								boxShadow: `0 6px 20px 0 ${alpha(theme.palette.primary.main, 0.6)}`,
								transform: 'translateY(-1px)',
							}
						})}
					>
						<SupportIcon sx={{ mr: 0.75, fontSize: '1.1rem' }} />
						Help & Support
					</Button>
				</Box>
			</Toolbar>
		</AppBar>
	);
};

export default Navbar;
