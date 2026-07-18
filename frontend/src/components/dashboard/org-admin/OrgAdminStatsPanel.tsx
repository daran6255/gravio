import React, { useEffect, useState } from 'react';
import { Grid, Skeleton } from '@mui/material';
import { People, CheckCircle, TrendingUp, MonetizationOn } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchTeamUsers } from '../../../store/slices/userSlice';
import { fetchLeads, fetchDeals } from '../../../store/slices/crmSlice';
import StatCard from '../../common/stats/StatCard';

interface StatItem {
	label: string;
	value: string | number;
	subtitle: string;
	icon: React.ReactElement;
	color: string;
}

export const OrgAdminStatsPanel: React.FC = () => {
	const dispatch = useAppDispatch();
	const displayCurrency = useAppSelector((state) => state.auth.user?.currency) || 'USD';
	const [stats, setStats] = useState<StatItem[] | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;

		const loadData = async () => {
			try {
				const [usersRes, leadsRes, dealsRes] = await Promise.all([
					dispatch(fetchTeamUsers({ page: 1, pageSize: 200 })).unwrap().catch(() => ({ items: [], total: 0 })),
					dispatch(fetchLeads({ pageSize: 500 })).unwrap().catch(() => ({ items: [], total: 0 })),
					dispatch(fetchDeals({})).unwrap().catch(() => ({ items: [], total: 0 })),
				]);

				if (cancelled) return;

				const totalUsers = usersRes.items.length;
				const activeUsers = usersRes.items.filter(m => m.is_active).length;

				// Count of leads converted to deals
				const leadsConverted = leadsRes.items.filter(l => l.status === 'converted').length;

				// Total amount value of deals converted to projects (deal has a project_id)
				const convertedDeals = dealsRes.items.filter(d => d.project_id);
				const totalConvertedValue = convertedDeals.reduce((sum, d) => sum + (d.display_value ?? d.value ?? 0), 0);

				const formatter = new Intl.NumberFormat('en-US', {
					style: 'currency',
					currency: displayCurrency,
					maximumFractionDigits: 0,
				});

				setStats([
					{
						label: 'Total Users',
						value: totalUsers,
						subtitle: 'Registered in workspace',
						icon: <People sx={{ fontSize: 24 }} />,
						color: '#6366f1',
					},
					{
						label: 'Active Users',
						value: activeUsers,
						subtitle: `${Math.round((activeUsers / Math.max(1, totalUsers)) * 100)}% active rate`,
						icon: <CheckCircle sx={{ fontSize: 24 }} />,
						color: '#10b981',
					},
					{
						label: 'Leads Converted',
						value: leadsConverted,
						subtitle: 'Opportunities created',
						icon: <TrendingUp sx={{ fontSize: 24 }} />,
						color: '#06b6d4',
					},
					{
						label: 'Projects Value',
						value: formatter.format(totalConvertedValue),
						subtitle: 'From converted deals',
						icon: <MonetizationOn sx={{ fontSize: 24 }} />,
						color: '#f59e0b',
					},
				]);
			} catch (err) {
				console.error(err);
			} finally {
				if (!cancelled) setLoading(false);
			}
		};

		loadData();
		return () => { cancelled = true; };
	}, [dispatch, displayCurrency]);

	if (loading) {
		return (
			<Grid container spacing={2}>
				{[1, 2, 3, 4].map((n) => (
					<Grid key={n} size={{ xs: 12, sm: 6, md: 3 }}>
						<Skeleton variant="rounded" height={100} sx={{ borderRadius: '16px' }} />
					</Grid>
				))}
			</Grid>
		);
	}

	return (
		<Grid container spacing={2}>
			{(stats || []).map((stat) => (
				<Grid key={stat.label} size={{ xs: 12, sm: 6, md: 3 }}>
					<StatCard
						title={stat.label}
						value={stat.value}
						subtitle={stat.subtitle}
						icon={stat.icon}
						color={stat.color}
					/>
				</Grid>
			))}
		</Grid>
	);
};

export default OrgAdminStatsPanel;
