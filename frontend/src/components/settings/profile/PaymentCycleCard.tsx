import React from 'react';
import { Box, Typography, Stack, Divider, Chip, CircularProgress, Switch, alpha } from '@mui/material';
import {
	Autorenew as RenewalIcon,
	NotificationsActiveOutlined as ReminderIcon,
} from '@mui/icons-material';

interface PaymentCycleCardProps {
	cardBg: string;
	cardBorder: string;
	isDark: boolean;
	mutedColor: string;
	iconColor: string;
	planLabel: string;
	cycleDate: string | null;
	isTrial: boolean;
	cycleDaysLeft: number | null;
	formatDate: (date: string) => string;
	billingReminder: boolean;
	reminderSaving: boolean;
	handleReminderToggle: (checked: boolean) => void;
}

export const PaymentCycleCard: React.FC<PaymentCycleCardProps> = ({
	cardBg,
	cardBorder,
	isDark,
	mutedColor,
	iconColor,
	planLabel,
	cycleDate,
	isTrial,
	cycleDaysLeft,
	formatDate,
	billingReminder,
	reminderSaving,
	handleReminderToggle,
}) => {
	const SectionHeader = ({ icon, title, color = '#8B7CF6' }: { icon: React.ReactNode; title: string; color?: string }) => (
		<Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2.5 }}>
			<Box sx={{ bgcolor: alpha(color, isDark ? 0.15 : 0.1), color, p: 0.7, borderRadius: '8px', display: 'flex' }}>
				{icon}
			</Box>
			<Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#F4F5F7' : '#1e293b' }}>
				{title}
			</Typography>
		</Stack>
	);

	return (
		<Box
			sx={{
				bgcolor: cardBg,
				border: `1px solid ${cardBorder}`,
				borderRadius: 4,
				boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.25)' : '0 8px 32px rgba(15,23,42,0.06)',
				p: 3,
			}}
		>
			<SectionHeader icon={<RenewalIcon sx={{ fontSize: 16 }} />} title="Next Payment Cycle" color="#4EA8FF" />
			<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
				<Typography variant="caption" sx={{ color: mutedColor }}>Current Plan</Typography>
				<Chip
					label={planLabel}
					size="small"
					sx={{ bgcolor: alpha('#4EA8FF', isDark ? 0.18 : 0.12), color: '#4EA8FF', fontWeight: 700, fontSize: '0.7rem' }}
				/>
			</Stack>
			{cycleDate ? (
				<>
					<Typography variant="caption" sx={{ color: mutedColor, display: 'block' }}>
						{isTrial ? 'Trial ends' : 'Renews on'}
					</Typography>
					<Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#F4F5F7' : '#1e293b' }}>
						{formatDate(cycleDate)}
						{cycleDaysLeft !== null && cycleDaysLeft >= 0 && (
							<Typography component="span" variant="caption" sx={{ color: '#f59e0b', fontWeight: 700, ml: 1 }}>
								({cycleDaysLeft} day{cycleDaysLeft === 1 ? '' : 's'} left)
							</Typography>
						)}
					</Typography>
				</>
			) : (
				<Typography variant="body2" sx={{ color: mutedColor, fontStyle: 'italic' }}>
					No upcoming billing date.
				</Typography>
			)}

			<Divider sx={{ borderColor: cardBorder, my: 2 }} />

			<Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
				<Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
					<ReminderIcon sx={{ fontSize: 18, color: iconColor, flexShrink: 0 }} />
					<Typography variant="caption" sx={{ color: isDark ? '#F4F5F7' : '#1e293b', fontWeight: 600 }}>
						Remind me before renewal
					</Typography>
				</Stack>
				{reminderSaving ? (
					<CircularProgress size={18} sx={{ color: '#8B7CF6' }} />
				) : (
					<Switch
						size="small"
						checked={billingReminder}
						onChange={(e) => handleReminderToggle(e.target.checked)}
						sx={{
							'& .MuiSwitch-switchBase.Mui-checked': { color: '#8B7CF6' },
							'& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#8B7CF6' },
						}}
					/>
				)}
			</Stack>
		</Box>
	);
};

export default PaymentCycleCard;
