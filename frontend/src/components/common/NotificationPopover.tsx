import React from 'react';
import {
	Box,
	Popover,
	Typography,
	List,
	ListItem,
	ListItemText,
	ListItemIcon,
	Divider,
	Button,
	IconButton,
	alpha,
	ListItemButton,
	useTheme
} from '@mui/material';
import {
	PersonAdd as PersonIcon,
	Notifications as NotificationsIcon,
	ClearAll as ClearIcon,
	Circle as DotIcon,
	CheckCircle as ApprovedIcon,
	Error as RejectedIcon,
	VpnKey as PermissionIcon
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { markAllNotificationsRead, clearAllNotifications, markNotificationRead } from '../../store/slices/notificationSlice';
import { useNavigate } from 'react-router-dom';

interface NotificationPopoverProps {
	anchorEl: HTMLElement | null;
	onClose: () => void;
}

const NotificationPopover: React.FC<NotificationPopoverProps> = ({ anchorEl, onClose }) => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const { notifications, unreadCount } = useAppSelector((state) => state.notifications);
	const open = Boolean(anchorEl);

	const handleMarkAllRead = () => {
		dispatch(markAllNotificationsRead());
	};

	const handleClearAll = () => {
		dispatch(clearAllNotifications());
		onClose();
	};

	const handleNotificationClick = (id: string, link?: string) => {
		dispatch(markNotificationRead(id));
		if (link) {
			navigate(link);
		}
		onClose();
	};

	const getIcon = (type: string) => {
		switch (type) {
			case 'dsr_approved':
				return <ApprovedIcon sx={{ color: theme.palette.success.main }} fontSize="small" />;
			case 'dsr_rejected':
			case 'permission_rejected':
				return <RejectedIcon sx={{ color: theme.palette.error.main }} fontSize="small" />;
			case 'permission_granted':
				return <PermissionIcon sx={{ color: theme.palette.warning.main }} fontSize="small" />;
			case 'registration':
				return <PersonIcon color="primary" fontSize="small" />;
			default:
				return <NotificationsIcon color="action" fontSize="small" />;
		}
	};

	return (
		<Popover
			open={open}
			anchorEl={anchorEl}
			onClose={onClose}
			anchorOrigin={{
				vertical: 'bottom',
				horizontal: 'right',
			}}
			transformOrigin={{
				vertical: 'top',
				horizontal: 'right',
			}}
			PaperProps={{
				sx: {
					width: 360,
					maxHeight: 500,
					mt: 1.5,
					borderRadius: 1,
					overflow: 'hidden',
					display: 'flex',
					flexDirection: 'column',
					boxShadow: theme.shadows[4]
				}
			}}
		>
			<Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.palette.background.default, borderBottom: `1px solid ${theme.palette.divider}` }}>
				<Box>
					<Typography variant="subtitle1" sx={{ fontWeight: 700, color: theme.palette.secondary.light }}>
						Notifications
					</Typography>
					{unreadCount > 0 && (
						<Typography variant="caption" sx={{ color: theme.palette.accent.main, fontWeight: 600 }}>
							{unreadCount} unread
						</Typography>
					)}
				</Box>
				<Box>
					<Button size="small" onClick={handleMarkAllRead} sx={{ textTransform: 'none', fontWeight: 600, mr: 1 }} disabled={unreadCount === 0}>
						Mark all as read
					</Button>
					<IconButton size="small" onClick={handleClearAll} title="Clear visibility">
						<ClearIcon fontSize="small" />
					</IconButton>
				</Box>
			</Box>

			<Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
				{notifications.length === 0 ? (
					<Box sx={{ p: 4, textAlign: 'center' }}>
						<NotificationsIcon sx={{ fontSize: 48, color: theme.palette.divider, mb: 1 }} />
						<Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
							You don't have any notifications right now.
						</Typography>
					</Box>
				) : (
					<List sx={{ py: 0 }}>
						{notifications.map((n, index) => (
							<React.Fragment key={n.id}>
								<ListItem
									disablePadding
									sx={{
										backgroundColor: n.read ? 'transparent' : alpha(theme.palette.accent.main, 0.04),
										'&:hover': {
											backgroundColor: alpha(theme.palette.common.black, 0.04)
										},
										transition: 'background-color 0.2s'
									}}
								>
									<ListItemButton
										onClick={() => handleNotificationClick(n.id, n.link)}
										sx={{
											py: 1.5,
											px: 2,
											alignItems: 'flex-start'
										}}
									>
										<ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
											{getIcon(n.type)}
										</ListItemIcon>
										<ListItemText
											primary={
												<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
													<Typography variant="body2" sx={{ fontWeight: n.read ? 500 : 700, color: theme.palette.secondary.light, pr: 1 }}>
														{n.title}
													</Typography>
													{!n.read && <DotIcon sx={{ fontSize: 10, color: theme.palette.accent.main }} />}
												</Box>
											}
											secondary={
												<>
													<Typography variant="caption" sx={{ display: 'block', color: theme.palette.text.secondary, mt: 0.5, lineHeight: 1.4 }}>
														{n.message}
													</Typography>
													<Typography variant="caption" sx={{ display: 'block', color: alpha(theme.palette.text.secondary, 0.6), mt: 0.5 }}>
														{n.timestamp}
													</Typography>
												</>
											}
										/>
									</ListItemButton>
								</ListItem>
								{index < notifications.length - 1 && <Divider />}
							</React.Fragment>
						))}
					</List>
				)}
			</Box>

			<Divider />
			<Box sx={{ p: 1, textAlign: 'center', backgroundColor: theme.palette.background.default }}>
				<Button fullWidth onClick={() => { navigate('/activity-logs'); onClose(); }} sx={{ textTransform: 'none', color: theme.palette.primary.main, fontWeight: 600 }}>
					View all activity logs
				</Button>
			</Box>
		</Popover>
	);
};

export default NotificationPopover;
