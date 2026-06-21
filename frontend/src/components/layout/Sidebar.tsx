import React, { useState } from 'react';
import {
	Drawer,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Box,
	Collapse,
	Tooltip,
	alpha,
	Avatar,
	Menu,
	MenuItem,
	Divider,
	Typography
} from '@mui/material';
import {
	ExpandLess,
	ExpandMore,
	Dns as InfrastructureIcon,
	Security as SecurityIcon,
	Settings as SettingsIcon,
	Memory as ComputeIcon,
	Storage as StorageIcon,
	Person as ProfileIcon,
	ExitToApp as LogoutIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { useTheme, useMediaQuery } from '@mui/material';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { topNavigation, bottomNavigation } from '../../config/navigation';
import type { NavigationItem } from '../../config/navigation';
import { useColorMode } from '../../theme/ThemeContext';
import { logoutUser } from '../../store/slices/authSlice';

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
	const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

	// Menu Anchor for bottom user profile
	const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
	const { mode } = useColorMode();

	const isDarkSidebar = mode === 'light'; // Light Mode -> Dark Sidebar; Dark Mode -> Light Sidebar

	const sidebarBg = isDarkSidebar ? '#0B0D12' : '#ffffff';
	const sidebarText = isDarkSidebar ? '#F4F5F7' : '#1e293b';
	const sidebarTextMuted = isDarkSidebar ? '#94A3B8' : '#64748b';
	const sidebarDivider = isDarkSidebar ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
	const sidebarHoverBg = isDarkSidebar ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';
	const drawerExpanded = isMobile ? open : true; // Always expanded on desktop

	const handleProfileOpen = (event: React.MouseEvent<HTMLElement>) => {
		setProfileAnchorEl(event.currentTarget);
	};

	const handleProfileClose = () => {
		setProfileAnchorEl(null);
	};

	const handleLogout = () => {
		dispatch(logoutUser());
		handleProfileClose();
		navigate('/login');
	};

	const userInitials = user
		? (user.full_name || user.username)
			.split(' ')
			.map((n: string) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2)
		: 'U';

	// Auto-expand the group of the active path on mount or navigation
	React.useEffect(() => {
		if (drawerExpanded) {
			const findAndExpandActiveGroup = (items: NavigationItem[]) => {
				for (const item of items) {
					if (item.children?.some(child => isActive(child.path))) {
						if (item.label) {
							setExpandedGroups(prev => ({ ...prev, [item.label!]: true }));
						}
						return true;
					}
				}
				return false;
			};
			findAndExpandActiveGroup(topNavigation);
			findAndExpandActiveGroup(bottomNavigation);
		}
	}, [location.pathname, drawerExpanded]);

	const isActive = (path?: string) => {
		if (!path) return false;
		let checkPath = path;
		if (user?.organization?.public_id && path.startsWith('/') && !path.startsWith('/org/')) {
			checkPath = `/org/${user.organization.public_id}${path}`;
		}
		if (checkPath.includes('?')) {
			return location.pathname + location.search === checkPath;
		}

		return location.pathname === checkPath || (checkPath !== '/' && location.pathname.startsWith(checkPath + '/'));
	};

	const handleNavigate = (path: string) => {
		let finalPath = path;
		if (user?.organization?.public_id && path.startsWith('/') && !path.startsWith('/org/')) {
			finalPath = `/org/${user.organization.public_id}${path}`;
		}
		navigate(finalPath);
		if (isMobile) {
			dispatch(toggleSidebar());
		}
	};

	const toggleGroup = (label: string) => {
		setExpandedGroups(prev => {
			const isCurrentlyExpanded = prev[label];
			const newState = Object.keys(prev).reduce((acc, key) => {
				acc[key] = false;
				return acc;
			}, {} as Record<string, boolean>);

			if (!isCurrentlyExpanded) {
				newState[label] = true;
			}
			return newState;
		});
	};

	const hasPermission = (item: NavigationItem): boolean => {
		if (item.requiresSuperuser) return !!user?.is_superuser;
		
		// Hide the regular non-superuser 'Team' link if user is superuser (they use 'Organizations' point to /users)
		if (item.path === '/users' && !item.requiresSuperuser && user?.is_superuser) return false;

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

	const NavItem = ({ item }: { item: NavigationItem }) => {
		if (!hasPermission(item)) return null;

		const active = isActive(item.path);
		const Icon = item.icon;

		const content = (
			<ListItemButton
				onClick={() => item.path && handleNavigate(item.path)}
				selected={active}
				sx={{
					minHeight: 44,
					px: drawerExpanded ? 2 : 0,
					py: 0,
					mx: drawerExpanded ? 1 : 0.5, // Floating block effect
					width: 'auto',
					borderRadius: 1.5, // Enterprise rounded corner
					justifyContent: drawerExpanded ? 'initial' : 'center',
					transition: theme.transitions.create(['background-color', 'color', 'margin']),
					
					'&.Mui-selected': {
						bgcolor: 'primary.main',
						'&:hover': {
							bgcolor: 'primary.dark',
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
							mr: drawerExpanded ? 1.5 : 0,
							justifyContent: 'center',
							color: active ? '#ffffff' : sidebarTextMuted,
							transition: theme.transitions.create(['color', 'margin']),
						}}
					>
						<Icon sx={{ fontSize: '1.25rem' }} />
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
			<ListItem disablePadding sx={{ display: 'block', mb: 0.5 }}>
				{drawerExpanded ? content : (
					<Tooltip title={item.label} placement="right" arrow>
						<Box>{content}</Box>
					</Tooltip>
				)}
			</ListItem>
		);
	};

	const NavGroup = ({ group }: { group: NavigationItem }) => {
		if (!hasPermission(group) || !group.label) return null;

		const isExpanded = expandedGroups[group.label];
		const Icon = group.icon;
		const activeChild = group.children?.some(child => isActive(child.path));

		const content = (
			<ListItemButton
				onClick={() => {
					if (!drawerExpanded) {
						dispatch(toggleSidebar());
					} else {
						group.label && toggleGroup(group.label);
					}
				}}
				sx={{
					minHeight: 44,
					px: drawerExpanded ? 2 : 0,
					py: 0,
					mx: drawerExpanded ? 1 : 0.5,
					width: 'auto',
					borderRadius: 1.5,
					justifyContent: drawerExpanded ? 'initial' : 'center',
					// Group active background
					bgcolor: activeChild && !isExpanded ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
					
					'&:hover': {
						bgcolor: sidebarHoverBg,
					},
				}}
			>
				{Icon && (
					<ListItemIcon
						sx={{
							minWidth: 0,
							mr: drawerExpanded ? 1.5 : 0,
							justifyContent: 'center',
							color: activeChild ? 'primary.main' : sidebarTextMuted,
						}}
					>
						<Icon sx={{ fontSize: '1.25rem' }} />
					</ListItemIcon>
				)}
				<Box
					sx={{
						display: drawerExpanded ? 'flex' : 'none',
						alignItems: 'center',
						justifyContent: 'space-between',
						flexGrow: 1,
						overflow: 'hidden'
					}}
				>
					<ListItemText
						primary={group.label}
						sx={{
							m: 0,
							'& .MuiListItemText-primary': {
								...theme.typography[activeChild ? 'sidebarActive' : 'sidebarItem'],
								color: activeChild ? (isDarkSidebar ? '#ffffff' : 'primary.main') : sidebarTextMuted,
							}
						}}
					/>
					{isExpanded ?
						<ExpandLess sx={{ fontSize: 16, opacity: 0.8, color: activeChild ? 'primary.main' : sidebarTextMuted }} /> :
						<ExpandMore sx={{ fontSize: 16, opacity: 0.8, color: activeChild ? 'primary.main' : sidebarTextMuted }} />
					}
				</Box>
			</ListItemButton>
		);

		return (
			<>
				<ListItem disablePadding sx={{ display: 'block' }}>
					{drawerExpanded ? content : (
						<Tooltip title={group.label} placement="right" arrow>
							<Box>{content}</Box>
						</Tooltip>
					)}
				</ListItem>
				<Collapse in={isExpanded && drawerExpanded} timeout="auto" unmountOnExit>
					<List component="div" disablePadding>
						{group.children?.map((child, index) => (
							<NavItem key={index} item={child} />
						))}
					</List>
				</Collapse>
			</>
		);
	};

	const renderMockItem = (label: string, Icon: React.ComponentType<any>) => {
		return (
			<ListItem disablePadding sx={{ display: 'block', mb: 0.5 }} key={label}>
				<Tooltip title={drawerExpanded ? '' : label} placement="right" arrow>
					<ListItemButton
						disabled
						sx={{
							minHeight: 44,
							px: drawerExpanded ? 2 : 0,
							py: 0,
							mx: drawerExpanded ? 1 : 0.5,
							width: 'auto',
							borderRadius: 1.5,
							justifyContent: drawerExpanded ? 'initial' : 'center',
							opacity: 0.8,
							cursor: 'default',
							'&.Mui-disabled': {
								opacity: 0.8,
								color: sidebarTextMuted,
							},
							'&:hover': {
								bgcolor: sidebarHoverBg,
								'& .MuiListItemText-primary': { color: isDarkSidebar ? '#ffffff' : '#0B0D12' },
								'& .MuiListItemIcon-root': { color: isDarkSidebar ? '#ffffff' : '#0B0D12' },
							}
						}}
					>
						<ListItemIcon sx={{ minWidth: 0, mr: drawerExpanded ? 1.5 : 0, justifyContent: 'center', color: sidebarTextMuted }}>
							<Icon sx={{ fontSize: '1.25rem' }} />
						</ListItemIcon>
						<ListItemText
							primary={label}
							sx={{
								opacity: drawerExpanded ? 1 : 0,
								display: drawerExpanded ? 'block' : 'none',
								m: 0,
								'& .MuiListItemText-primary': {
									...theme.typography.sidebarItem,
									color: sidebarTextMuted,
								}
							}}
						/>
					</ListItemButton>
				</Tooltip>
			</ListItem>
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
						justifyContent: 'flex-start',
						px: 3, // Premium padding
						borderBottom: `1px solid ${sidebarDivider}`,
					}}
				>
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
				</Box>

				{/* Navigation Links List */}
				<Box
					sx={{
						flexGrow: 1,
						overflowY: 'auto',
						overflowX: 'hidden',
						py: 1,
						/* Custom enterprise scrollbar */
						'&::-webkit-scrollbar': { width: 4 },
						'&::-webkit-scrollbar-track': { background: 'transparent' },
						'&::-webkit-scrollbar-thumb': {
							background: sidebarDivider,
							borderRadius: 10,
							'&:hover': { background: sidebarHoverBg }
						},
					}}
				>
					<List disablePadding>
						{/* Real Navigation Items */}
						{topNavigation.map((item, index) => (
							item.children ? (
								<NavGroup key={index} group={item} />
							) : (
								<NavItem key={index} item={item} />
							)
						))}

						{/* Mock Navigation Items (to perfectly match mockup aesthetics) */}
						{renderMockItem('Infrastructure', InfrastructureIcon)}
						{renderMockItem('Security', SecurityIcon)}
						{renderMockItem('Settings', SettingsIcon)}

						{/* Resources Mock Section */}
						{drawerExpanded ? (
							<Typography
								variant="caption"
								sx={{
									display: 'block',
									px: 2.5,
									pt: 2.5,
									pb: 1,
									fontWeight: 700,
									letterSpacing: '0.05em',
									color: sidebarTextMuted,
									textTransform: 'uppercase'
								}}
							>
								Resources
							</Typography>
						) : (
							<Box sx={{ borderBottom: `1px solid ${sidebarDivider}`, my: 2, mx: 2 }} />
						)}

						{renderMockItem('Compute', ComputeIcon)}
						{renderMockItem('Storage', StorageIcon)}
					</List>
				</Box>

				{/* User Profile Block */}
				{user && (
					<Box sx={{
						flexShrink: 0,
						borderTop: `1px solid ${sidebarDivider}`,
						bgcolor: 'transparent',
						p: 1
					}}>
						<Box
							onClick={handleProfileOpen}
							sx={{
								display: 'flex',
								alignItems: 'center',
								gap: drawerExpanded ? 1.5 : 0,
								justifyContent: drawerExpanded ? 'flex-start' : 'center',
								p: 1,
								borderRadius: 1.5,
								cursor: 'pointer',
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

						{/* Profile Dropdown Menu */}
						<Menu
							id="sidebar-profile-menu"
							anchorEl={profileAnchorEl}
							anchorOrigin={{
								vertical: 'top',
								horizontal: 'right',
							}}
							transformOrigin={{
								vertical: 'bottom',
								horizontal: 'left',
							}}
							open={Boolean(profileAnchorEl)}
							onClose={handleProfileClose}
							PaperProps={{
								elevation: 4,
								sx: {
									width: 240,
									mb: 1,
									ml: 1,
									borderRadius: 1.5,
									overflow: 'hidden',
									bgcolor: theme.palette.background.paper,
									border: `1px solid ${theme.palette.divider}`,
									'& .MuiList-root': { py: 0 }
								}
							}}
						>
							<Box sx={{ p: 2, bgcolor: isDarkSidebar ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)' }}>
								<Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.text.primary, lineHeight: 1.2 }}>
									{user.full_name || user.username}
								</Typography>
								<Typography variant="caption" sx={{ color: theme.palette.text.secondary, mt: 0.5, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
									{user.email}
								</Typography>
							</Box>
							<Divider sx={{ my: 0 }} />
							<MenuItem onClick={handleProfileClose} sx={{ py: 1, px: 2 }}>
								<ListItemIcon sx={{ minWidth: 32 }}>
									<ProfileIcon fontSize="small" />
								</ListItemIcon>
								<ListItemText primary="Account Settings" primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }} />
							</MenuItem>
							<Divider sx={{ my: 0 }} />
							<MenuItem onClick={handleLogout} sx={{ py: 1, px: 2, color: theme.palette.error.main }}>
								<ListItemIcon sx={{ minWidth: 32, color: theme.palette.error.main }}>
									<LogoutIcon fontSize="small" />
								</ListItemIcon>
								<ListItemText primary="Sign Out" primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }} />
							</MenuItem>
						</Menu>
					</Box>
				)}
			</Box>
		</Drawer>
	);
};

export default Sidebar;
