import React from 'react';
import { AppBar, Toolbar, IconButton, Box, Button, Divider, Badge } from '@mui/material';
import {
	Menu as MenuIcon,
	LightMode as LightModeIcon,
	DarkMode as DarkModeIcon,
	Notifications as NotificationsIcon,
	HeadsetMicOutlined as SupportIcon,
} from '@mui/icons-material';
import { useAppDispatch } from '../../store/hooks';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { useColorMode } from '../../theme/ThemeContext';
import GlobalSearch from '../common/GlobalSearch';

const DRAWER_WIDTH = 260;

const Navbar: React.FC = () => {
	const dispatch = useAppDispatch();
	const { mode, toggleColorMode } = useColorMode();

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

					{/* Notification Icon */}
					<IconButton
						color="inherit"
						sx={{ color: mode === 'light' ? '#64748b' : '#94A3B8' }}
						aria-label="notifications"
					>
						<Badge badgeContent={3} color="primary" variant="dot">
							<NotificationsIcon />
						</Badge>
					</IconButton>

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
