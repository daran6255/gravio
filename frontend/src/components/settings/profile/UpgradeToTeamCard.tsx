import React, { useState } from 'react';
import { Box, Typography, Stack, Button, alpha } from '@mui/material';
import { GroupsOutlined as TeamIcon } from '@mui/icons-material';
import ConvertToTeamDialog from './ConvertToTeamDialog';

interface UpgradeToTeamCardProps {
	cardBg: string;
	cardBorder: string;
	isDark: boolean;
	mutedColor: string;
	/** Current (auto-generated) workspace name, offered as a starting point in the dialog. */
	orgName?: string;
}

export const UpgradeToTeamCard: React.FC<UpgradeToTeamCardProps> = ({
	cardBg,
	cardBorder,
	isDark,
	mutedColor,
	orgName,
}) => {
	const [dialogOpen, setDialogOpen] = useState(false);

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
			<Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
				<Box sx={{ bgcolor: alpha('#8B7CF6', isDark ? 0.15 : 0.1), color: '#8B7CF6', p: 0.7, borderRadius: '8px', display: 'flex' }}>
					<TeamIcon sx={{ fontSize: 16 }} />
				</Box>
				<Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#F4F5F7' : '#1e293b' }}>
					Working with a team?
				</Typography>
			</Stack>
			<Typography variant="caption" sx={{ color: mutedColor, display: 'block', mb: 2 }}>
				Convert to a team organization to invite teammates and unlock Team, Timesheets,
				and HR Administration. Your current plan and trial period carry over unchanged.
			</Typography>
			<Button
				fullWidth
				variant="outlined"
				onClick={() => setDialogOpen(true)}
				sx={{
					textTransform: 'none',
					fontWeight: 700,
					borderRadius: 2,
					borderColor: '#8B7CF6',
					color: '#8B7CF6',
					'&:hover': { borderColor: '#7a6ae6', bgcolor: alpha('#8B7CF6', 0.06) },
				}}
			>
				Upgrade to Team
			</Button>

			<ConvertToTeamDialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				defaultName={orgName}
			/>
		</Box>
	);
};

export default UpgradeToTeamCard;
