import React, { useEffect, useState } from 'react';
import { Box, Link, Popover, useTheme, Typography, Stack, Tooltip, Skeleton } from '@mui/material';
import { People, SupervisorAccount, CheckCircle, Block, InfoOutlined } from '@mui/icons-material';
import api from '../../../services/api';
import StatCard from '../../common/stats/StatCard';

interface UserStats {
	total: number;
	by_role: Record<string, number>;
	active: number;
	inactive: number;
	roles_count: number;
}

const UserStatCards: React.FC = () => {
	const theme = useTheme();
	const [stats, setStats] = useState<UserStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [roleAnchor, setRoleAnchor] = React.useState<HTMLElement | null>(null);

	useEffect(() => {
		fetchStats();
	}, []);

	const fetchStats = async () => {
		try {
			const response = await api.get<UserStats>('/users/stats');
			setStats(response.data);
		} catch (error) {
			console.error('Failed to fetch user stats:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleRoleOpen = (event: React.MouseEvent<HTMLElement>) => {
		setRoleAnchor(event.currentTarget);
	};

	const handleRoleClose = () => {
		setRoleAnchor(null);
	};

	const skeleton = (
		<Skeleton variant="text" sx={{ fontSize: '2rem', width: '40%' }} />
	);

	const formatRoleName = (role: string) => {
		return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
	};

	return (
		<Box 
			sx={{ 
				display: 'grid', 
				gridTemplateColumns: {
					xs: '1fr',
					sm: '1fr 1fr',
					lg: '1fr 1fr 1fr 1fr'
				},
				gap: 3, 
				mb: 3 
			}}
		>
			<StatCard
				title="Total Users"
				count={loading ? skeleton : stats?.total}
				icon={People}
				color={theme.palette.primary.main}
				subtitle="Total registered in the system"
			/>

			<StatCard
				title="Active Users"
				count={loading ? skeleton : stats?.active}
				icon={CheckCircle}
				color={theme.palette.success.main}
				subtitle="Currently active accounts"
			/>

			<StatCard
				title="Inactive Users"
				count={loading ? skeleton : stats?.inactive}
				icon={Block}
				color={theme.palette.error.main}
				subtitle="Disabled or pending access"
			/>

			<StatCard
				title="System Roles"
				count={loading ? skeleton : stats?.roles_count}
				icon={SupervisorAccount}
				color={theme.palette.secondary.main}
			>
				{loading ? (
					<Skeleton variant="text" sx={{ width: '60%', mt: 0.5 }} />
				) : (
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
						<Link
							component="button"
							variant="caption"
							onClick={handleRoleOpen}
							sx={{
								fontWeight: 700,
								color: theme.palette.secondary.main,
								textDecoration: 'none',
								textTransform: 'uppercase',
								fontSize: '0.65rem',
								'&:hover': { textDecoration: 'underline' }
							}}
						>
							View Distribution
						</Link>
						<Tooltip title="Breakdown of users by their assigned roles">
							<InfoOutlined sx={{ fontSize: '0.9rem', color: 'text.secondary', cursor: 'help' }} />
						</Tooltip>
					</Box>
				)}

				<Popover
					open={Boolean(roleAnchor)}
					anchorEl={roleAnchor}
					onClose={handleRoleClose}
					anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
					transformOrigin={{ vertical: 'top', horizontal: 'left' }}
					PaperProps={{
						sx: {
							border: '1px solid #e5e7eb',
							boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
							borderRadius: '12px',
							p: 2,
							minWidth: 240
						}
					}}
				>
					<Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: '#1e293b' }}>
						Role Distribution
					</Typography>
					<Stack spacing={1}>
						{stats && Object.entries(stats.by_role)
							.sort((a, b) => b[1] - a[1])
							.map(([role, count]) => (
								<Box key={role} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
									<Typography variant="body2" color="textSecondary">
										{formatRoleName(role)}
									</Typography>
									<Box sx={{ 
										px: 1, 
										py: 0.25, 
										bgcolor: 'action.hover', 
										borderRadius: '4px',
										minWidth: 24,
										textAlign: 'center'
									}}>
										<Typography variant="caption" fontWeight="700">
											{count}
										</Typography>
									</Box>
								</Box>
							))}
					</Stack>
				</Popover>
			</StatCard>
		</Box>
	);
};

export default UserStatCards;
