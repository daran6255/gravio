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
	alpha
} from '@mui/material';
import {
	ExpandLess,
	ExpandMore,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { useTheme, useMediaQuery } from '@mui/material';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { topNavigation, bottomNavigation } from '../../config/navigation';
import type { NavigationItem } from '../../config/navigation';

const DRAWER_WIDTH = 260;
const COLLAPSED_WIDTH = 64; // Standardized slightly wider for icon centering
const NAVBAR_HEIGHT = 48; // Matches 'dense' Toolbar height

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

	// Auto-expand the group of the active path on mount or navigation
	React.useEffect(() => {
		if (open) {
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
	}, [location.pathname, open]);

	const isActive = (path?: string) => {
		if (!path) return false;
		if (path.includes('?')) {
			return location.pathname + location.search === path;
		}

		if (path === '/projects') {
			if (location.pathname === path) return true;
			if (location.pathname.startsWith(path + '/')) {
				const subPath = location.pathname.substring(path.length);
				if (subPath.startsWith('/activities') ||
					subPath.startsWith('/dsr') ||
					subPath.startsWith('/timesheet')) {
					return false;
				}
				return true;
			}
			return false;
		}

		if (path === '/candidates') {
			if (location.pathname === path) return true;
			if (location.pathname.startsWith(path + '/')) {
				const subPath = location.pathname.substring(path.length);
				if (subPath.startsWith('/screening') ||
					subPath.startsWith('/counseling') ||
					subPath.startsWith('/documents')) {
					return false;
				}
				return true;
			}
			return false;
		}

		return location.pathname === path || (path !== '/' && location.pathname.startsWith(path + '/'));
	};

	const handleNavigate = (path: string) => {
		navigate(path);
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
					px: open ? 2 : 0,
					py: 0,
					mx: open ? 1 : 0.5, // Floating block effect
					width: 'auto',
					borderRadius: 1, // Enterprise 8px (approx)
					justifyContent: open ? 'initial' : 'center',
					transition: theme.transitions.create(['background-color', 'color', 'margin']),
					
					'&.Mui-selected': {
						bgcolor: 'primary.main',
						'&:hover': {
							bgcolor: 'primary.dark',
						},
						'& .MuiListItemText-primary': {
							color: 'common.white',
							fontWeight: 800,
						},
						'& .MuiListItemIcon-root': {
							color: 'common.white',
						},
					},
					'&:hover': {
						bgcolor: alpha(theme.palette.action.hover, 0.12),
					},
				}}
			>
				{Icon && (
					<ListItemIcon
						sx={{
							minWidth: 0,
							mr: open ? 1.5 : 0,
							justifyContent: 'center',
							color: active ? 'common.white' : alpha(theme.palette.common.white, 0.5),
							transition: theme.transitions.create(['color', 'margin']),
						}}
					>
						<Icon sx={{ fontSize: '1.25rem' }} />
					</ListItemIcon>
				)}
				<ListItemText
					primary={item.label}
					sx={{
						opacity: open ? 1 : 0,
						display: open ? 'block' : 'none',
						m: 0,
						'& .MuiListItemText-primary': {
							...theme.typography[active ? 'sidebarActive' : 'sidebarItem'],
							color: active ? 'common.white' : alpha(theme.palette.common.white, 0.7),
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
				{open ? content : (
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
					if (!open) {
						dispatch(toggleSidebar());
					} else {
						group.label && toggleGroup(group.label);
					}
				}}
				sx={{
					minHeight: 44,
					px: open ? 2 : 0,
					py: 0,
					mx: open ? 1 : 0.5,
					width: 'auto',
					borderRadius: 1,
					justifyContent: open ? 'initial' : 'center',
					// Group active background (very subtle if highlighted)
					bgcolor: activeChild && !isExpanded ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
					
					'&:hover': {
						bgcolor: alpha(theme.palette.common.white, 0.08),
					},
				}}
			>
				{Icon && (
					<ListItemIcon
						sx={{
							minWidth: 0,
							mr: open ? 1.5 : 0,
							justifyContent: 'center',
							color: activeChild ? 'common.white' : alpha(theme.palette.common.white, 0.5),
						}}
					>
						<Icon sx={{ fontSize: '1.25rem' }} />
					</ListItemIcon>
				)}
				<Box
					sx={{
						display: open ? 'flex' : 'none',
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
								color: activeChild ? 'common.white' : alpha(theme.palette.common.white, 0.7),
							}
						}}
					/>
					{isExpanded ?
						<ExpandLess sx={{ fontSize: 16, opacity: 0.8, color: activeChild ? 'primary.main' : 'common.white' }} /> :
						<ExpandMore sx={{ fontSize: 16, opacity: 0.8, color: activeChild ? 'primary.main' : 'common.white' }} />
					}
				</Box>
			</ListItemButton>
		);

		return (
			<>
				<ListItem disablePadding sx={{ display: 'block' }}>
					{open ? content : (
						<Tooltip title={group.label} placement="right" arrow>
							<Box>{content}</Box>
						</Tooltip>
					)}
				</ListItem>
				<Collapse in={isExpanded && open} timeout="auto" unmountOnExit>
					<List component="div" disablePadding>
						{group.children?.map((child, index) => (
							<NavItem key={index} item={child} />
						))}
					</List>
				</Collapse>
			</>
		);
	};

	return (
		<Drawer
			variant={isMobile ? 'temporary' : 'permanent'}
			anchor="left"
			open={open}
			onClose={() => dispatch(toggleSidebar())}
			ModalProps={{ keepMounted: true }}
			sx={{
				width: open ? DRAWER_WIDTH : (isMobile ? 0 : COLLAPSED_WIDTH),
				flexShrink: 0,
				whiteSpace: 'nowrap',
				transition: theme.transitions.create('width', {
					easing: theme.transitions.easing.sharp,
					duration: theme.transitions.duration.standard,
				}),
				'& .MuiDrawer-paper': {
					width: open ? DRAWER_WIDTH : (isMobile ? 0 : COLLAPSED_WIDTH),
					overflowX: 'hidden',
					transition: theme.transitions.create('width', {
						easing: theme.transitions.easing.sharp,
						duration: theme.transitions.duration.standard,
					}),
					boxSizing: 'border-box',
					top: NAVBAR_HEIGHT,
					height: `calc(100% - ${NAVBAR_HEIGHT}px)`,
					backgroundColor: 'secondary.main',
					borderRight: `1px solid ${theme.palette.divider}`,
					boxShadow: 'none',
				},
			}}
		>
			<Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', color: 'secondary.contrastText' }}>
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
							background: alpha(theme.palette.common.white, 0.1),
							borderRadius: 10,
							'&:hover': { background: alpha(theme.palette.common.white, 0.2) }
						},
					}}
				>
					<List disablePadding>
						{topNavigation.map((item, index) => (
							item.children ? (
								<NavGroup key={index} group={item} />
							) : (
								<NavItem key={index} item={item} />
							)
						))}
					</List>
				</Box>

				<Box sx={{
					flexShrink: 0,
					py: 0.5,
					borderTop: `1px solid ${theme.palette.divider}`,
					bgcolor: 'secondary.main'
				}}>
					<List disablePadding>
						{bottomNavigation.map((item, index) => (
							item.children ? (
								<NavGroup key={index} group={item} />
							) : (
								<NavItem key={index} item={item} />
							)
						))}
					</List>
				</Box>
			</Box>
		</Drawer>
	);
};

export default Sidebar;
