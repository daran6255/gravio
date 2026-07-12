import React, { useState } from 'react';
import {
	Drawer,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Box,
	Tooltip,
	Avatar,
	Divider,
	Typography,
	Button
} from '@mui/material';
import {
	Person as ProfileIcon,
	ExitToApp as LogoutIcon,
	ChevronLeftOutlined,
	ChevronRightOutlined,
	HourglassEmpty as HourglassIcon,
	AutoAwesome as PremiumIcon,
	Warning as WarningIcon,
	HeadsetMicOutlined as SupportIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { useTheme, useMediaQuery } from '@mui/material';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { topNavigation, settingsNavigation } from '../../config/navigation';
import type { NavigationItem } from '../../config/navigation';
import { useColorMode } from '../../theme/ThemeContext';
import { logoutUser } from '../../store/slices/authSlice';
import ActionMenu from '../common/action-menu/ActionMenu';

const DRAWER_WIDTH = 260;
const COLLAPSED_WIDTH = 64; // Standardized slightly wider for icon centering

/**
 * Enterprise Sidebar - Modern Console Navigation
 * strictly aligned with theme tokens and topography variants.
 */
const Sidebar: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));
	const open = useAppSelector((state) => state.ui.sidebarOpen);
	const user = useAppSelector((state) => state.auth.user);

	const { mode } = useColorMode();

	const isDarkSidebar = mode === 'light'; // Light Mode -> Dark Sidebar; Dark Mode -> Light Sidebar

	const sidebarBg = isDarkSidebar ? '#0B0D12' : '#ffffff';
	const sidebarText = isDarkSidebar ? '#F4F5F7' : '#1e293b';
	const sidebarTextMuted = isDarkSidebar ? '#94A3B8' : '#64748b';
	const sidebarDivider = isDarkSidebar ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
	const sidebarHoverBg = isDarkSidebar ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';
	const drawerExpanded = open;

	const handleLogout = () => {
		dispatch(logoutUser());
		navigate('/auth/login');
	};

	const getTrialDaysLeft = (expiryDateStr?: string) => {
		if (!expiryDateStr) return 0;
		const expiry = new Date(expiryDateStr);
		const today = new Date();
		expiry.setHours(0, 0, 0, 0);
		today.setHours(0, 0, 0, 0);
		return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
	};

	const renderMobileSubscriptionBadge = () => {
		if (!user || !isMobile) return null;
		const org = user.organization;
		if (!org && user.is_superuser) {
			return (
				<Box sx={{
					display: 'flex', alignItems: 'center', gap: 1,
					px: 1.5, py: 1,
					borderRadius: '10px',
					background: isDarkSidebar ? 'rgba(139,124,246,0.15)' : 'rgba(139,124,246,0.1)',
					border: '1px solid rgba(139,124,246,0.3)',
				}}>
					<PremiumIcon sx={{ fontSize: '1rem', color: '#8B7CF6' }} />
					<Typography variant="caption" sx={{ fontWeight: 700, color: '#A78BFA' }}>Super Admin</Typography>
				</Box>
			);
		}
		if (!org) return null;
		const status = org.subscription_status || 'trial';
		const daysLeft = getTrialDaysLeft(org.trial_expires_at);

		let icon = null;
		let label = '';
		let sublabel = '';
		let badgeBg = '';
		let badgeBorder = '';
		let badgeColor = '';

		if (status === 'trial') {
			if (daysLeft < 0) {
				icon = <WarningIcon sx={{ fontSize: '1.1rem', color: '#EF4444' }} />;
				label = 'Trial Expired';
				sublabel = 'Upgrade to restore access';
				badgeBg = isDarkSidebar ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)';
				badgeBorder = 'rgba(239,68,68,0.3)';
				badgeColor = '#EF4444';
			} else if (daysLeft === 0) {
				icon = <WarningIcon sx={{ fontSize: '1.1rem', color: '#F59E0B' }} />;
				label = 'Expires Today';
				sublabel = 'Upgrade now to keep access';
				badgeBg = isDarkSidebar ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.08)';
				badgeBorder = 'rgba(245,158,11,0.3)';
				badgeColor = '#F59E0B';
			} else {
				icon = <HourglassIcon sx={{ fontSize: '1.1rem', color: '#F59E0B' }} />;
				label = `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;
				sublabel = `Free trial · Expires ${new Date(org.trial_expires_at!).toLocaleDateString()}`;
				badgeBg = isDarkSidebar ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.08)';
				badgeBorder = 'rgba(245,158,11,0.3)';
				badgeColor = '#F59E0B';
			}
		} else if (status === 'active' || status === 'paid') {
			const planName = org.plan_name || org.plan?.name || 'Pro';
			icon = <PremiumIcon sx={{ fontSize: '1.1rem', color: '#8B7CF6' }} />;
			label = planName;
			sublabel = 'Active plan';
			badgeBg = isDarkSidebar ? 'rgba(139,124,246,0.15)' : 'rgba(139,124,246,0.1)';
			badgeBorder = 'rgba(139,124,246,0.3)';
			badgeColor = isDarkSidebar ? '#A78BFA' : '#7C3AED';
		} else if (status === 'expired') {
			icon = <WarningIcon sx={{ fontSize: '1.1rem', color: '#EF4444' }} />;
			label = 'Subscription Expired';
			sublabel = 'Renew to restore access';
			badgeBg = isDarkSidebar ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)';
			badgeBorder = 'rgba(239,68,68,0.3)';
			badgeColor = '#EF4444';
		} else {
			return null;
		}

		return (
			<Box
				onClick={() => navigate('/billing')}
				sx={{
					display: 'flex', alignItems: 'center', gap: 1.5,
					px: 1.5, py: 1.25,
					borderRadius: '10px',
					background: badgeBg,
					border: `1px solid ${badgeBorder}`,
					cursor: 'pointer',
					transition: 'opacity 0.2s',
					'&:hover': { opacity: 0.85 },
				}}
			>
				{icon}
				<Box sx={{ minWidth: 0 }}>
					<Typography variant="caption" sx={{ fontWeight: 700, color: badgeColor, display: 'block', lineHeight: 1.2 }}>
						{label}
					</Typography>
					<Typography variant="caption" sx={{ color: sidebarTextMuted, fontSize: '0.68rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
						{sublabel}
					</Typography>
				</Box>
			</Box>
		);
	};

	const userInitials = user
		? (user.full_name || user.username)
			.split(' ')
			.map((n: string) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2)
		: 'U';

	const isSettingsRoute =
		location.pathname === '/settings' ||
		location.pathname.startsWith('/settings/') ||
		/^\/org\/[^/]+\/settings(\/|$)/.test(location.pathname);

	const [activeSection, setActiveSection] = useState('settings-profile');

	React.useEffect(() => {
		if (!isSettingsRoute) return;

		const sectionIds = ['settings-profile', 'settings-preferences', 'settings-security', 'settings-notifications'];

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						setActiveSection(entry.target.id);
					}
				}
			},
			{
				rootMargin: '-20% 0px -60% 0px',
				threshold: 0.1,
			}
		);

		sectionIds.forEach((id) => {
			const el = document.getElementById(id);
			if (el) observer.observe(el);
		});

		// The observer's rootMargin only counts a section "active" once it
		// enters the top ~20-40% band of the viewport. A short last section
		// can never reach that band once the scroll container is already at
		// its max scroll (there's nothing left below it to scroll further) —
		// so treat "scrolled to the bottom" as the last section being active,
		// instead of padding the page out artificially to force it into the band.
		const scrollContainer = document.getElementById('settings-scroll-container');
		const handleScroll = () => {
			if (!scrollContainer) return;
			const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
			if (scrollTop + clientHeight >= scrollHeight - 4) {
				setActiveSection(sectionIds[sectionIds.length - 1]);
			}
		};
		scrollContainer?.addEventListener('scroll', handleScroll, { passive: true });
		handleScroll();

		return () => {
			observer.disconnect();
			scrollContainer?.removeEventListener('scroll', handleScroll);
		};
	}, [isSettingsRoute, location.pathname]);



	const isActive = (path?: string, sectionId?: string) => {
		if (isSettingsRoute && sectionId) {
			return activeSection === sectionId;
		}
		if (!path) return false;
		let checkPath = path;
		if (user?.organization?.public_id && path.startsWith('/') && !path.startsWith('/org/') && path !== '/organizations') {
			checkPath = `/org/${user.organization.public_id}${path}`;
		}
		if (checkPath.includes('?')) {
			return location.pathname + location.search === checkPath;
		}

		return location.pathname === checkPath || (checkPath !== '/' && location.pathname.startsWith(checkPath + '/'));
	};

	const handleNavigate = (path: string) => {
		let finalPath = path;
		if (user?.organization?.public_id && path.startsWith('/') && !path.startsWith('/org/') && path !== '/organizations') {
			finalPath = `/org/${user.organization.public_id}${path}`;
		}
		navigate(finalPath);
		if (isMobile) {
			dispatch(toggleSidebar());
		}
	};

	const hasPermission = (item: NavigationItem): boolean => {
		if (item.hidden) return false;
		if (item.requiresSuperuser) return !!user?.is_superuser;
		
		// If superuser has NO organization, they only get access to the dashboard
		// and cannot access any organization-specific modules (CRM, Projects, Team, etc.)
		if (user?.is_superuser && !user?.organization) {
			if (item.path === '/dashboard') return true;
			if (item.children) {
				return item.children.some(child => hasPermission(child));
			}
			return false;
		}

		// Hide the regular non-superuser 'Team' link if user is superuser (they use 'Organizations' point to /users)
		if (item.path === '/users' && !item.requiresSuperuser && user?.is_superuser) return false;

		// Hide 'Billing' for superuser
		if (item.path === '/billing' && user?.is_superuser) return false;

		if (user?.role === 'admin') return true;
		const hasDirectPermission = !item.roles || (user?.role && item.roles.includes(user.role));

		if (item.children) {
			const hasVisibleChildren = item.children.some(child => hasPermission(child));
			if (item.roles) {
				return !!hasDirectPermission && hasVisibleChildren;
			}
			return hasVisibleChildren;
		}

		return !!hasDirectPermission;
	};

	const NavItem = ({ item }: { item: NavigationItem & { sectionId?: string } }) => {
		if (!hasPermission(item) && !item.sectionId) return null;

		const active = isActive(item.path, item.sectionId);
		const Icon = item.icon;

		const content = (
			<ListItemButton
				onClick={() => {
					if (item.sectionId) {
						const element = document.getElementById(item.sectionId);
						if (element) {
							element.scrollIntoView({ behavior: 'smooth', block: 'start' });
						}
					} else if (item.path) {
						handleNavigate(item.path);
					}
				}}
				selected={active}
				sx={{
					minHeight: 36,
					px: drawerExpanded ? 1.5 : 0,
					py: 0,
					mx: drawerExpanded ? 0.75 : 0.5, // Floating block effect
					width: 'auto',
					borderRadius: 1.25, // Enterprise rounded corner
					justifyContent: drawerExpanded ? 'initial' : 'center',
					transition: theme.transitions.create(['background-color', 'color', 'margin']),
					
					'&.Mui-selected': {
						bgcolor: 'primary.main',
						'&:hover': {
							bgcolor: 'primary.dark',
							'& .MuiListItemText-primary': {
								color: '#ffffff',
							},
							'& .MuiListItemIcon-root': {
								color: '#ffffff',
							},
						},
						'& .MuiListItemText-primary': {
							color: '#ffffff',
							fontWeight: 800,
						},
						'& .MuiListItemIcon-root': {
							color: '#ffffff',
						},
					},
					'&:hover': {
						bgcolor: sidebarHoverBg,
						'& .MuiListItemText-primary': {
							color: isDarkSidebar ? '#ffffff' : '#0B0D12',
						},
						'& .MuiListItemIcon-root': {
							color: isDarkSidebar ? '#ffffff' : '#0B0D12',
						},
					},
				}}
			>
				{Icon && (
					<ListItemIcon
						sx={{
							minWidth: 0,
							mr: drawerExpanded ? 1.25 : 0,
							justifyContent: 'center',
							color: active ? '#ffffff' : sidebarTextMuted,
							transition: theme.transitions.create(['color', 'margin']),
						}}
					>
						<Icon sx={{ fontSize: '1.2rem' }} />
					</ListItemIcon>
				)}
				<ListItemText
					primary={item.label}
					sx={{
						opacity: drawerExpanded ? 1 : 0,
						display: drawerExpanded ? 'block' : 'none',
						m: 0,
						'& .MuiListItemText-primary': {
							...theme.typography[active ? 'sidebarActive' : 'sidebarItem'],
							color: active ? '#ffffff' : sidebarTextMuted,
							whiteSpace: 'nowrap',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
						}
					}}
				/>
			</ListItemButton>
		);

		return (
			<ListItem disablePadding sx={{ display: 'block', mb: 0.25 }}>
				{drawerExpanded ? content : (
					<Tooltip title={item.label} placement="right" arrow>
						<Box>{content}</Box>
					</Tooltip>
				)}
			</ListItem>
		);
	};

	const NavSection = ({ section }: { section: NavigationItem }) => {
		if (!hasPermission(section) || !section.label) return null;

		const visibleChildren = section.children?.filter(child => hasPermission(child)) || [];
		if (visibleChildren.length === 0) return null;

		return (
			<Box sx={{ mb: drawerExpanded ? 1.5 : 1 }}>
				{drawerExpanded ? (
					<Typography
						variant="caption"
						sx={{
							display: 'block',
							px: 2.25,
							pt: 1.5,
							pb: 0.5,
							fontSize: '0.6875rem',
							fontWeight: 700,
							letterSpacing: '0.12em',
							color: sidebarTextMuted,
							textTransform: 'uppercase',
							opacity: 0.85,
						}}
					>
						{section.label}
					</Typography>
				) : (
					<Divider
						sx={{
							my: 1.25,
							mx: 1.5,
							borderColor: sidebarDivider,
							opacity: 0.5,
						}}
					/>
				)}
				<List component="div" disablePadding>
					{visibleChildren.map((child, index) => (
						<NavItem key={index} item={child} />
					))}
				</List>
			</Box>
		);
	};



	return (
		<Drawer
			variant={isMobile ? 'temporary' : 'permanent'}
			anchor="left"
			open={isMobile ? open : true}
			onClose={() => dispatch(toggleSidebar())}
			ModalProps={{ keepMounted: true }}
			sx={{
				width: drawerExpanded ? DRAWER_WIDTH : (isMobile ? 0 : COLLAPSED_WIDTH),
				flexShrink: 0,
				whiteSpace: 'nowrap',
				transition: theme.transitions.create('width', {
					easing: theme.transitions.easing.sharp,
					duration: theme.transitions.duration.standard,
				}),
				'& .MuiDrawer-paper': {
					width: drawerExpanded ? DRAWER_WIDTH : (isMobile ? 0 : COLLAPSED_WIDTH),
					maxWidth: '85vw', // Never cover the full screen on small phones
					overflowX: 'hidden',
					transition: theme.transitions.create('width', {
						easing: theme.transitions.easing.sharp,
						duration: theme.transitions.duration.standard,
					}),
					boxSizing: 'border-box',
					top: 0, // Starts at the very top of page
					height: '100vh',
					backgroundColor: sidebarBg,
					borderRight: `1px solid ${sidebarDivider}`,
					boxShadow: 'none',
				},
			}}
		>
			<Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', color: sidebarText, bgcolor: sidebarBg }}>
				{/* Brand Logo Header */}
				<Box
					sx={{
						height: 64,
						display: 'flex',
						alignItems: 'center',
						justifyContent: drawerExpanded ? 'flex-start' : 'center',
						px: drawerExpanded ? 3 : 0, // Premium padding
						borderBottom: `1px solid ${sidebarDivider}`,
					}}
				>
					{drawerExpanded ? (
						<Box
							component="img"
							src={isDarkSidebar ? '/assets/img/logo/gravit-dark.svg' : '/assets/img/logo/gravit-light.svg'}
							alt="Gravit logo"
							sx={{
								height: 62, // Enlarged logo
								cursor: 'pointer'
							}}
							onClick={() => navigate('/')}
						/>
					) : (
						<Box
							onClick={() => navigate('/')}
							sx={{
								width: 36,
								height: 36,
								borderRadius: '8px',
								background: 'linear-gradient(135deg, #8B7CF6 0%, #6052d9 100%)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								cursor: 'pointer',
								boxShadow: '0 2px 8px rgba(139, 124, 246, 0.3)',
							}}
						>
							<svg width="22" height="22" viewBox="-75 -80 150 155" xmlns="http://www.w3.org/2000/svg">
								<g>
									<path d="M 36 -54 A 65 65 0 1 0 65 12 L 18 12" fill="none" stroke="#ffffff" strokeWidth="13" strokeLinecap="round"/>
									<circle cx="58" cy="-66" r="10" fill="#ffffff"/>
								</g>
							</svg>
						</Box>
					)}
				</Box>

				{/* Navigation Links List */}
				<Box
					sx={{
						flexGrow: 1,
						overflowY: 'auto',
						overflowX: 'hidden',
						py: 1,
					}}
				>
					<List disablePadding>
						{/* Real Navigation Items */}
						{(isSettingsRoute ? settingsNavigation : topNavigation).map((item, index) => (
							<React.Fragment key={index}>
								{item.isSection ? (
									<NavSection section={item} />
								) : (
									<NavItem item={item} />
								)}
								{item.divider && (
									<Divider 
										sx={{ 
											my: 1.5, 
											mx: drawerExpanded ? 2 : 1, 
											borderColor: sidebarDivider 
										}} 
									/>
								)}
							</React.Fragment>
						))}
					</List>
				</Box>

				{/* Collapse / Expand Toggle Button for Desktop */}
				{!isMobile && (
					<Box sx={{ flexShrink: 0, borderTop: `1px solid ${sidebarDivider}`, p: 0.5 }}>
						<ListItemButton
							onClick={() => dispatch(toggleSidebar())}
							sx={{
								minHeight: 36,
								px: drawerExpanded ? 1.5 : 0,
								py: 0.5,
								mx: drawerExpanded ? 0.75 : 0.5,
								borderRadius: 1.25,
								justifyContent: drawerExpanded ? 'initial' : 'center',
								transition: theme.transitions.create(['background-color', 'color', 'margin']),
								'&:hover': {
									bgcolor: sidebarHoverBg,
								},
							}}
						>
							<ListItemIcon sx={{ minWidth: 0, mr: drawerExpanded ? 1.25 : 0, color: sidebarTextMuted, justifyContent: 'center' }}>
								{drawerExpanded ? <ChevronLeftOutlined sx={{ fontSize: '1.2rem' }} /> : <ChevronRightOutlined sx={{ fontSize: '1.2rem' }} />}
							</ListItemIcon>
							<ListItemText
								primary="Collapse sidebar"
								sx={{
									opacity: drawerExpanded ? 1 : 0,
									display: drawerExpanded ? 'block' : 'none',
									m: 0,
									'& .MuiListItemText-primary': {
										...theme.typography.sidebarItem,
										color: sidebarTextMuted,
										whiteSpace: 'nowrap',
									}
								}}
							/>
						</ListItemButton>
					</Box>
				)}

				{/* Mobile-only: Trial/Plan Badge + Help & Support */}
			{isMobile && !isSettingsRoute && user && (
				<Box sx={{
					flexShrink: 0,
					borderTop: `1px solid ${sidebarDivider}`,
					p: 1.5,
					display: 'flex',
					flexDirection: 'column',
					gap: 1,
				}}>
					{renderMobileSubscriptionBadge()}
					<Button
						fullWidth
						variant="contained"
						startIcon={<SupportIcon sx={{ fontSize: '1rem' }} />}
						onClick={() => { navigate('/support'); dispatch(toggleSidebar()); }}
						sx={(muiTheme) => ({
							textTransform: 'none',
							fontWeight: 700,
							fontSize: '0.825rem',
							borderRadius: '10px',
							py: 1,
							justifyContent: 'flex-start',
							background: muiTheme.gradients?.brandDiagonal ?? 'linear-gradient(135deg, #8B7CF6 0%, #6052d9 100%)',
							boxShadow: '0 2px 10px rgba(139, 124, 246, 0.3)',
							color: '#ffffff',
							'&:hover': {
								background: muiTheme.gradients?.brandDiagonalHover ?? 'linear-gradient(135deg, #9C8FFF 0%, #7062E9 100%)',
								boxShadow: '0 4px 14px rgba(139, 124, 246, 0.5)',
							},
						})}
					>
						Help & Support
					</Button>
				</Box>
			)}

			{/* User Profile Block or Settings Bottom Controls */}
			{isSettingsRoute ? (
					<Box sx={{
						flexShrink: 0,
						borderTop: `1px solid ${sidebarDivider}`,
						bgcolor: 'transparent',
						p: 1
					}}>
						{user && !user.is_superuser && (
							<Box sx={{ px: 1, mb: 1.5 }}>
								<Button
									fullWidth
									variant="contained"
									onClick={() => {
										const orgMatch = location.pathname.match(/^\/org\/([^/]+)/);
										if (orgMatch) {
											navigate(`/org/${orgMatch[1]}/billing`);
										} else {
											navigate('/billing');
										}
									}}
									sx={{
										textTransform: 'none',
										fontWeight: 700,
										fontSize: '0.8rem',
										borderRadius: '8px',
										py: 1,
										background: 'linear-gradient(135deg, #8B7CF6 0%, #6052d9 100%)',
										boxShadow: '0 2px 8px rgba(139, 124, 246, 0.3)',
										'&:hover': {
											background: 'linear-gradient(135deg, #9C8FFF 0%, #7062E9 100%)',
										},
									}}
								>
									Upgrade Plan
								</Button>
							</Box>
						)}
						<List disablePadding>
							<ListItem disablePadding sx={{ mb: 0.5 }}>
								<ListItemButton
									onClick={handleLogout}
									sx={{
										minHeight: 40,
										px: drawerExpanded ? 2 : 0,
										py: 0.5,
										mx: drawerExpanded ? 1 : 0.5,
										borderRadius: 1.5,
										justifyContent: drawerExpanded ? 'initial' : 'center',
										'&:hover': { bgcolor: sidebarHoverBg },
									}}
								>
									<ListItemIcon sx={{ minWidth: 0, mr: drawerExpanded ? 1.5 : 0, color: sidebarTextMuted, justifyContent: 'center' }}>
										<LogoutIcon sx={{ fontSize: '1.15rem' }} />
									</ListItemIcon>
									<ListItemText
										primary="Log Out"
										sx={{
											opacity: drawerExpanded ? 1 : 0,
											display: drawerExpanded ? 'block' : 'none',
											m: 0,
											'& .MuiListItemText-primary': {
												fontSize: '0.85rem',
												fontWeight: 500,
												color: sidebarTextMuted,
											},
										}}
									/>
								</ListItemButton>
							</ListItem>
						</List>
					</Box>
				) : (
					user && (
						<Box sx={{
							flexShrink: 0,
							borderTop: `1px solid ${sidebarDivider}`,
							bgcolor: 'transparent',
							p: 1
						}}>
							<ActionMenu
								minWidth={240}
								header={
									<Box sx={{ px: 0.5, py: 0.25 }}>
										<Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
											{user.full_name || user.username}
										</Typography>
										<Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
											{user.email}
										</Typography>
									</Box>
								}
								trigger={
									<Box
										sx={{
											display: 'flex',
											alignItems: 'center',
											gap: drawerExpanded ? 1.5 : 0,
											justifyContent: drawerExpanded ? 'flex-start' : 'center',
											p: 1,
											borderRadius: 1.5,
											cursor: 'pointer',
											width: '100%',
											transition: theme.transitions.create(['background-color', 'padding']),
											'&:hover': {
												bgcolor: sidebarHoverBg
											}
										}}
									>
										<Avatar
											sx={{
												width: 36,
												height: 36,
												bgcolor: 'primary.main',
												color: '#ffffff',
												fontSize: '0.875rem',
												fontWeight: 700
											}}
										>
											{userInitials}
										</Avatar>
										{drawerExpanded && (
											<Box sx={{ minWidth: 0, overflow: 'hidden' }}>
												<Typography variant="body2" sx={{ fontWeight: 600, color: sidebarText, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
													{user.full_name || user.username}
												</Typography>
												<Typography variant="caption" sx={{ color: sidebarTextMuted, display: 'block', textTransform: 'capitalize' }}>
													{user.role} Role
												</Typography>
											</Box>
										)}
									</Box>
								}
								actions={[
									{
										label: 'Settings',
										icon: <ProfileIcon sx={{ fontSize: '1rem' }} />,
										onClick: () => handleNavigate('/settings'),
									},
									{
										label: 'Sign Out',
										icon: <LogoutIcon sx={{ fontSize: '1rem' }} />,
										color: theme.palette.error.main,
										onClick: handleLogout
									}
								]}
							/>
						</Box>
					)
				)}
			</Box>
		</Drawer>
	);
};

export default Sidebar;
