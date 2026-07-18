import React, { useEffect, useState } from 'react';
import { Grid, Skeleton } from '@mui/material';
import { WorkOutline, CheckCircleOutline, FolderSpecialOutlined, MonetizationOnOutlined } from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { fetchLeads, fetchDeals } from '../../../store/slices/crmSlice';
import { fetchProjects } from '../../../store/slices/projectsSlice';
import StatCard from '../../common/stats/StatCard';

interface StatItem {
	label: string;
	value: string | number;
	subtitle: string;
	icon: React.ReactElement;
	color: string;
}

export const IndividualStatsPanel: React.FC = () => {
	const dispatch = useAppDispatch();
	const user = useAppSelector((state) => state.auth.user);
	const [stats, setStats] = useState<StatItem[] | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;

		const loadData = async () => {
			if (!user) return;
			try {
				const [leadsRes, dealsRes, projectsRes] = await Promise.all([
					dispatch(fetchLeads({ ownerId: user.id, pageSize: 500 })).unwrap().catch(() => ({ items: [], total: 0 })),
					dispatch(fetchDeals({ ownerId: user.id })).unwrap().catch(() => ({ items: [], total: 0 })),
					dispatch(fetchProjects({ ownerId: user.id, page: 1, pageSize: 200 })).unwrap().catch(() => ({ items: [], total: 0 })),
				]);

				if (cancelled) return;

				// Leads/deals/projects are already scoped to this user server-side via ownerId
				const myLeads = leadsRes.items;
				const myDeals = dealsRes.items;
				const myProjects = projectsRes.items;

				// Active Deals: open status
				const activeDeals = myDeals.filter(d => d.status === 'open').length;

				// Converted Leads: status === 'converted'
				const convertedLeads = myLeads.filter(l => l.status === 'converted').length;

				// Active Projects: status === 'active' or 'in_progress'
				const activeProjects = myProjects.filter(p => p.status === 'active' || p.status === 'in_progress').length;

				// Total Projects Value: sum of budget/value
				const totalVal = myProjects.reduce((sum, p) => sum + (p.budget || 0), 0);

				const formatter = new Intl.NumberFormat('en-US', {
					style: 'currency',
					currency: 'USD',
					maximumFractionDigits: 0,
				});

				setStats([
					{
						label: 'Active Deals',
						value: activeDeals,
						subtitle: 'Deals in negotiation',
						icon: <WorkOutline sx={{ fontSize: 24 }} />,
						color: '#6366f1',
					},
					{
						label: 'Converted Leads',
						value: convertedLeads,
						subtitle: 'Transformed to opportunities',
						icon: <CheckCircleOutline sx={{ fontSize: 24 }} />,
						color: '#10b981',
					},
					{
						label: 'Active Projects',
						value: activeProjects,
						subtitle: 'Deliveries under tracking',
						icon: <FolderSpecialOutlined sx={{ fontSize: 24 }} />,
						color: '#06b6d4',
					},
					{
						label: 'My Projects Value',
						value: formatter.format(totalVal),
						subtitle: 'Sum of delivery budgets',
						icon: <MonetizationOnOutlined sx={{ fontSize: 24 }} />,
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
	}, [user, dispatch]);

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

export default IndividualStatsPanel;
