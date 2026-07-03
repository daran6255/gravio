import React, { useState } from 'react';
import {
	Box,
	Typography,
	Checkbox,
	alpha,
} from '@mui/material';
import { useTheme } from '@mui/material';

interface NotificationCategory {
	id: string;
	label: string;
	description: string;
	email: boolean;
	push: boolean;
	inApp: boolean;
}

const defaultCategories: NotificationCategory[] = [
	{
		id: 'account_alerts',
		label: 'Account Alerts',
		description: 'Security changes and login attempts.',
		email: true,
		push: true,
		inApp: true,
	},
	{
		id: 'leads_activity',
		label: 'Leads Activity',
		description: 'New sales leads and pipeline movements.',
		email: true,
		push: false,
		inApp: true,
	},
	{
		id: 'system_updates',
		label: 'System Updates',
		description: 'Maintenance logs and platform feature releases.',
		email: false,
		push: false,
		inApp: true,
	},
];

const NotificationsTab: React.FC = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const [categories, setCategories] = useState<NotificationCategory[]>(defaultCategories);

	const cardBg = isDark ? '#141822' : '#ffffff';
	const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
	const labelColor = isDark ? '#94A3B8' : '#64748b';
	const headerBg = isDark ? alpha('#8B7CF6', 0.06) : alpha('#8B7CF6', 0.04);

	const emailCount = categories.filter((c) => c.email).length;
	const pushCount = categories.filter((c) => c.push).length;
	const inAppCount = categories.filter((c) => c.inApp).length;

	const toggleNotification = (id: string, channel: 'email' | 'push' | 'inApp') => {
		setCategories((prev) =>
			prev.map((cat) =>
				cat.id === id ? { ...cat, [channel]: !cat[channel] } : cat
			)
		);
	};

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
				Notification Matrix
			</Typography>
			<Typography variant="body2" sx={{ color: labelColor, mb: 4 }}>
				Granular control over how and when you are notified of system events.
			</Typography>

			{/* Notification Table */}
			<Box
				sx={{
					bgcolor: cardBg,
					border: `1px solid ${cardBorder}`,
					borderRadius: 3,
					overflow: 'hidden',
					mb: 2,
				}}
			>
				{/* Table Header */}
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: '1fr 100px 100px 100px',
						px: 3,
						py: 1.5,
						bgcolor: headerBg,
						borderBottom: `1px solid ${cardBorder}`,
					}}
				>
					<Typography
						variant="caption"
						sx={{
							fontWeight: 800,
							color: isDark ? '#8B7CF6' : '#7C3AED',
							textTransform: 'uppercase',
							letterSpacing: '0.08em',
							fontSize: '0.7rem',
						}}
					>
						Event Category
					</Typography>
					<Typography
						variant="caption"
						sx={{
							fontWeight: 800,
							color: isDark ? '#8B7CF6' : '#7C3AED',
							textTransform: 'uppercase',
							letterSpacing: '0.08em',
							fontSize: '0.7rem',
							textAlign: 'center',
						}}
					>
						Email
					</Typography>
					<Typography
						variant="caption"
						sx={{
							fontWeight: 800,
							color: isDark ? '#8B7CF6' : '#7C3AED',
							textTransform: 'uppercase',
							letterSpacing: '0.08em',
							fontSize: '0.7rem',
							textAlign: 'center',
						}}
					>
						Push
					</Typography>
					<Typography
						variant="caption"
						sx={{
							fontWeight: 800,
							color: isDark ? '#8B7CF6' : '#7C3AED',
							textTransform: 'uppercase',
							letterSpacing: '0.08em',
							fontSize: '0.7rem',
							textAlign: 'center',
						}}
					>
						In-App
					</Typography>
				</Box>

				{/* Table Rows */}
				{categories.map((cat, index) => (
					<Box
						key={cat.id}
						sx={{
							display: 'grid',
							gridTemplateColumns: '1fr 100px 100px 100px',
							px: 3,
							py: 2,
							alignItems: 'center',
							borderBottom: index < categories.length - 1 ? `1px solid ${cardBorder}` : 'none',
							transition: 'background-color 0.15s ease',
							'&:hover': {
								bgcolor: isDark ? alpha('#ffffff', 0.02) : alpha('#000000', 0.01),
							},
						}}
					>
						<Box>
							<Typography
								variant="body2"
								sx={{
									fontWeight: 700,
									color: isDark ? '#F4F5F7' : '#1e293b',
									mb: 0.25,
								}}
							>
								{cat.label}
							</Typography>
							<Typography variant="caption" sx={{ color: labelColor }}>
								{cat.description}
							</Typography>
						</Box>
						<Box sx={{ display: 'flex', justifyContent: 'center' }}>
							<Checkbox
								checked={cat.email}
								onChange={() => toggleNotification(cat.id, 'email')}
								size="small"
								sx={{
									color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
									'&.Mui-checked': {
										color: '#8B7CF6',
									},
								}}
							/>
						</Box>
						<Box sx={{ display: 'flex', justifyContent: 'center' }}>
							<Checkbox
								checked={cat.push}
								onChange={() => toggleNotification(cat.id, 'push')}
								size="small"
								sx={{
									color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
									'&.Mui-checked': {
										color: '#8B7CF6',
									},
								}}
							/>
						</Box>
						<Box sx={{ display: 'flex', justifyContent: 'center' }}>
							<Checkbox
								checked={cat.inApp}
								onChange={() => toggleNotification(cat.id, 'inApp')}
								size="small"
								sx={{
									color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
									'&.Mui-checked': {
										color: '#8B7CF6',
									},
								}}
							/>
						</Box>
					</Box>
				))}
			</Box>

			{/* Summary — reflects the toggles above live, so the space under the
			    table isn't just left empty */}
			<Typography variant="caption" sx={{ color: labelColor, display: 'block', mb: 5 }}>
				{emailCount} of {categories.length} categories send email · {pushCount} of {categories.length} send push · {inAppCount} of {categories.length} send in-app notifications.
			</Typography>
		</Box>
	);
};

export default NotificationsTab;
