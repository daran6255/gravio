import React, { useEffect, useState } from 'react';
import { IconButton, Badge, Menu, MenuItem, Box, Typography, Stack, Divider, Button, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Notifications as NotificationsIcon, CircleNotifications } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
	fetchNotifications,
	fetchUnreadCount,
	markNotificationRead,
	markAllNotificationsRead,
} from '../../store/slices/notificationSlice';
import type { Notification } from '../../models/notification';

const POLL_INTERVAL_MS = 60_000;

const NotificationBell: React.FC = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const theme = useTheme();
	const { notifications, notificationsLoading, unreadCount } = useAppSelector((state) => state.notifications);
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

	useEffect(() => {
		dispatch(fetchUnreadCount());
		const interval = setInterval(() => {
			dispatch(fetchUnreadCount());
		}, POLL_INTERVAL_MS);
		return () => clearInterval(interval);
	}, [dispatch]);

	const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
		dispatch(fetchNotifications({ pageSize: 10 }));
	};

	const handleClose = () => setAnchorEl(null);

	const handleNotificationClick = async (notification: Notification) => {
		if (!notification.is_read) {
			await dispatch(markNotificationRead(notification.public_id));
		}
		handleClose();
		if (notification.entity_type === 'lead' && notification.entity_id) {
			navigate('/crm/leads');
		}
	};

	const handleMarkAllRead = async () => {
		await dispatch(markAllNotificationsRead());
	};

	return (
		<>
			<IconButton
				color="inherit"
				onClick={handleOpen}
				sx={{ color: 'inherit' }}
				aria-label="notifications"
			>
				<Badge badgeContent={unreadCount} color="primary" max={99}>
					<NotificationsIcon />
				</Badge>
			</IconButton>

			<Menu
				anchorEl={anchorEl}
				open={Boolean(anchorEl)}
				onClose={handleClose}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				transformOrigin={{ vertical: 'top', horizontal: 'right' }}
				PaperProps={{ sx: { width: 360, maxHeight: 480, borderRadius: theme.layout.radius.card, mt: 1 } }}
			>
				<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.25 }}>
					<Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Notifications</Typography>
					{unreadCount > 0 && (
						<Button size="small" onClick={handleMarkAllRead}>
							Mark all read
						</Button>
					)}
				</Stack>
				<Divider />

				{notificationsLoading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
						<CircularProgress size={24} />
					</Box>
				) : notifications.length === 0 ? (
					<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 1 }}>
						<CircleNotifications sx={{ fontSize: 28, color: 'text.disabled' }} />
						<Typography variant="body2" color="text.secondary">No notifications yet</Typography>
					</Box>
				) : (
					notifications.map((n) => (
						<MenuItem
							key={n.public_id}
							onClick={() => handleNotificationClick(n)}
							sx={{
								whiteSpace: 'normal',
								alignItems: 'flex-start',
								py: 1.25,
								bgcolor: n.is_read ? 'transparent' : 'action.hover',
							}}
						>
							<Box>
								<Typography variant="body2" sx={{ fontWeight: n.is_read ? 500 : 700 }}>
									{n.title}
								</Typography>
								<Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
									{n.message}
								</Typography>
								<Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.25 }}>
									{new Date(n.created_at).toLocaleString()}
								</Typography>
							</Box>
						</MenuItem>
					))
				)}
			</Menu>
		</>
	);
};

export default NotificationBell;
