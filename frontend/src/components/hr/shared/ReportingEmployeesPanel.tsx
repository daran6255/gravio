import React from 'react';
import {
	Paper, CardContent, Typography, List, ListItem, ListItemAvatar,
	ListItemText, Box, Chip, alpha, useTheme, Stack, Divider
} from '@mui/material';
import { Group as TeamIcon, GroupOff as NoTeamIcon } from '@mui/icons-material';
import EnterpriseAvatar from '../../common/avatar/Avatar';

interface TeamMemberItem {
	id: number;
	full_name: string | null;
	email: string | null;
	role: string | null;
	avatar: string | null;
	employee_code?: string | null;
	designation?: string | null;
}

interface ReportingEmployeesPanelProps {
	members: TeamMemberItem[];
}

export const ReportingEmployeesPanel: React.FC<ReportingEmployeesPanelProps> = ({ members }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	return (
		<Paper
			sx={{
				border: '1px solid',
				borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
				boxShadow: isDark
					? '0 12px 32px rgba(0, 0, 0, 0.35)'
					: '0 12px 32px rgba(15, 23, 42, 0.06)',
				borderRadius: '20px',
				overflow: 'hidden',
				bgcolor: theme.palette.background.paper,
				height: '100%'
			}}
		>
			<CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
				<Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
					<TeamIcon sx={{ color: theme.palette.primary.main, fontSize: 22 }} />
					<Typography variant="subtitle1" fontWeight={800} sx={{ letterSpacing: '-0.01em' }}>
						My Team
					</Typography>
					<Chip
						label={members.length}
						size="small"
						color="primary"
						sx={{
							fontWeight: 700,
							height: 20,
							fontSize: '0.72rem',
							bgcolor: alpha(theme.palette.primary.main, 0.08),
							color: theme.palette.primary.main,
						}}
					/>
				</Stack>

				{members.length === 0 ? (
					<Box
						sx={{
							py: 6,
							px: 2,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							textAlign: 'center',
							bgcolor: alpha(theme.palette.text.primary, 0.01),
							borderRadius: 3,
							border: `1px dashed ${alpha(theme.palette.divider, 0.5)}`,
						}}
					>
						<Box
							sx={{
								p: 1.5,
								borderRadius: '50%',
								bgcolor: alpha(theme.palette.text.secondary, 0.08),
								color: 'text.secondary',
								mb: 1.5,
								display: 'inline-flex',
							}}
						>
							<NoTeamIcon fontSize="medium" />
						</Box>
						<Typography variant="body2" fontWeight={700} color="text.primary">
							No reporting persons
						</Typography>
						<Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, maxWidth: 180 }}>
							There are no employees currently allocated to report to you.
						</Typography>
					</Box>
				) : (
					<List disablePadding>
						{members.map((member, idx) => (
							<React.Fragment key={member.id}>
								{idx > 0 && <Divider sx={{ my: 1.25, borderColor: alpha(theme.palette.divider, 0.4) }} />}
								<ListItem
									disablePadding
									sx={{
										py: 1,
										px: 1.25,
										borderRadius: '12px',
										transition: 'all 0.2s ease',
										'&:hover': {
											bgcolor: alpha(theme.palette.primary.main, 0.04),
											transform: 'translateY(-1px)',
										},
									}}
								>
									<ListItemAvatar sx={{ minWidth: 46 }}>
										<EnterpriseAvatar
											name={member.full_name || member.email || 'User'}
											src={member.avatar || undefined}
											size={34}
										/>
									</ListItemAvatar>
									<ListItemText
										primary={
											<Typography variant="body2" fontWeight={700} noWrap sx={{ color: 'text.primary' }}>
												{member.full_name}
											</Typography>
										}
										secondary={
											<Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ fontSize: '0.72rem', mt: 0.25 }}>
												{member.designation || member.email}
											</Typography>
										}
										sx={{ m: 0 }}
									/>
								</ListItem>
							</React.Fragment>
						))}
					</List>
				)}
			</CardContent>
		</Paper>
	);
};

export default ReportingEmployeesPanel;
