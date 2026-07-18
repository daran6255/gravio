import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, useTheme, Skeleton, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, alpha } from '@mui/material';
import { Leaderboard, BusinessCenter, Assignment } from '@mui/icons-material';
import { useAppSelector } from '../../../store/hooks';
import crmService from '../../../services/crmService';
import projectService from '../../../services/projectService';
import type { Lead } from '../../../models/crm/lead';
import type { Deal } from '../../../models/crm/deal';
import type { Project } from '../../../models/projects/project';

interface TabPanelProps {
	children?: React.ReactNode;
	index: number;
	value: number;
}

const CustomTabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`individual-tabpanel-${index}`}
			aria-labelledby={`individual-tab-${index}`}
			style={{ height: '100%', display: value === index ? 'block' : 'none' }}
			{...other}
		>
			{value === index && (
				<Box sx={{ py: 1.5, height: '100%' }}>
					{children}
				</Box>
			)}
		</div>
	);
};

export const IndividualTabbedGridPanel: React.FC = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const user = useAppSelector((state) => state.auth.user);
	const [activeTab, setActiveTab] = useState(0);
	
	const [leads, setLeads] = useState<Lead[]>([]);
	const [deals, setDeals] = useState<Deal[]>([]);
	const [projects, setProjects] = useState<Project[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;

		const loadData = async () => {
			if (!user) return;
			try {
				const [leadsRes, dealsRes, projectsRes] = await Promise.all([
					crmService.listLeads({ pageSize: 500 }).catch(() => ({ items: [], total: 0 })),
					crmService.listDeals({ pageSize: 500 }).catch(() => ({ items: [], total: 0 })),
					projectService.listProjects(1, 200).catch(() => ({ items: [], total: 0 })),
				]);

				if (cancelled) return;

				// Filter items owned by the current logged-in user
				const myLeads = leadsRes.items.filter(l => l.owner_id === user.id);
				const myDeals = dealsRes.items.filter(d => d.owner_id === user.id);
				const myProjects = projectsRes.items.filter(p => p.owner_id === user.id);

				setLeads(myLeads.filter(l => l.status !== 'converted' && l.status !== 'unqualified').slice(0, 5));
				setDeals(myDeals.filter(d => d.status === 'open' || d.status === 'on_hold').slice(0, 5));
				setProjects(myProjects.filter(p => p.status !== 'completed' && p.status !== 'canceled').slice(0, 5));
			} catch (err) {
				console.error(err);
			} finally {
				if (!cancelled) setLoading(false);
			}
		};

		loadData();
		return () => { cancelled = true; };
	}, [user]);

	const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
		setActiveTab(newValue);
	};

	const formatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0,
	});

	const cardBg = isDark
		? 'linear-gradient(135deg, rgba(20, 24, 34, 0.75) 0%, rgba(11, 13, 18, 0.9) 100%)'
		: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(248, 250, 252, 0.95) 100%)';

	return (
		<Card sx={{
			borderRadius: '16px',
			border: `1px solid ${theme.palette.divider}`,
			boxShadow: isDark ? '0 8px 32px 0 rgba(0, 0, 0, 0.2)' : '0 8px 32px 0 rgba(139, 124, 246, 0.04)',
			height: '100%',
			background: cardBg,
			backdropFilter: 'blur(20px)',
		}}>
			<CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
				<Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
					<Tabs
						value={activeTab}
						onChange={handleTabChange}
						aria-label="individual active items tabs"
						sx={{
							minHeight: 40,
							'& .MuiTab-root': {
								minHeight: 40,
								textTransform: 'none',
								fontWeight: 700,
								fontSize: '0.8rem',
								py: 0.5,
							}
						}}
					>
						<Tab icon={<Leaderboard sx={{ fontSize: 16 }} />} iconPosition="start" label="My Leads" />
						<Tab icon={<BusinessCenter sx={{ fontSize: 16 }} />} iconPosition="start" label="My Deals" />
						<Tab icon={<Assignment sx={{ fontSize: 16 }} />} iconPosition="start" label="My Projects" />
					</Tabs>
				</Box>

				{loading ? (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
						{[1, 2, 3].map((n) => <Skeleton key={n} variant="rounded" height={44} sx={{ borderRadius: 1.5 }} />)}
					</Box>
				) : (
					<Box sx={{ flexGrow: 1, minHeight: 220 }}>
						{/* LEADS TAB */}
						<CustomTabPanel value={activeTab} index={0}>
							{leads.length === 0 ? (
								<Box display="flex" alignItems="center" justifyContent="center" sx={{ height: 160 }}>
									<Typography variant="body2" color="text.secondary">No active leads assigned to you.</Typography>
								</Box>
							) : (
								<TableContainer sx={{ maxHeight: 220, overflowY: 'auto' }}>
									<Table size="small" stickyHeader>
										<TableHead>
											<TableRow sx={{ '& th': { bgcolor: 'transparent', fontWeight: 800, fontSize: '0.68rem', color: 'text.secondary', borderBottom: `1px solid ${theme.palette.divider}` } }}>
												<TableCell>Title</TableCell>
												<TableCell>Priority</TableCell>
												<TableCell>Status</TableCell>
												<TableCell align="right">Est. Value</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{leads.map((l) => (
												<TableRow key={l.public_id} hover sx={{ '& td': { borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`, py: 1 } }}>
													<TableCell sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.78rem' }}>{l.title}</TableCell>
													<TableCell>
 														<Chip
 															label={l.priority}
 															size="small"
 															sx={{
 																height: 18, fontSize: '0.6rem', fontWeight: 800,
 																bgcolor: l.priority === 'urgent' || l.priority === 'high' ? alpha(theme.palette.error.main, 0.1) : alpha(theme.palette.info.main, 0.1),
 																color: l.priority === 'urgent' || l.priority === 'high' ? theme.palette.error.main : theme.palette.info.main,
 															}}
 														/>
													</TableCell>
													<TableCell sx={{ fontSize: '0.74rem', textTransform: 'capitalize', color: 'text.secondary' }}>{l.status}</TableCell>
													<TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>{l.estimated_value ? formatter.format(l.estimated_value) : '-'}</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</TableContainer>
							)}
						</CustomTabPanel>

						{/* DEALS TAB */}
						<CustomTabPanel value={activeTab} index={1}>
							{deals.length === 0 ? (
								<Box display="flex" alignItems="center" justifyContent="center" sx={{ height: 160 }}>
									<Typography variant="body2" color="text.secondary">No active deals assigned to you.</Typography>
								</Box>
							) : (
								<TableContainer sx={{ maxHeight: 220, overflowY: 'auto' }}>
									<Table size="small" stickyHeader>
										<TableHead>
											<TableRow sx={{ '& th': { bgcolor: 'transparent', fontWeight: 800, fontSize: '0.68rem', color: 'text.secondary', borderBottom: `1px solid ${theme.palette.divider}` } }}>
												<TableCell>Deal Title</TableCell>
												<TableCell>Probability</TableCell>
												<TableCell>Status</TableCell>
												<TableCell align="right">Value</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{deals.map((d) => (
												<TableRow key={d.public_id} hover sx={{ '& td': { borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`, py: 1 } }}>
													<TableCell sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.78rem' }}>{d.title}</TableCell>
													<TableCell sx={{ fontSize: '0.74rem', fontWeight: 700, color: theme.palette.success.main }}>{d.probability}%</TableCell>
													<TableCell sx={{ fontSize: '0.74rem', textTransform: 'capitalize', color: 'text.secondary' }}>{d.status}</TableCell>
													<TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>{d.value ? formatter.format(d.value) : '-'}</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</TableContainer>
							)}
						</CustomTabPanel>

						{/* PROJECTS TAB */}
						<CustomTabPanel value={activeTab} index={2}>
							{projects.length === 0 ? (
								<Box display="flex" alignItems="center" justifyContent="center" sx={{ height: 160 }}>
									<Typography variant="body2" color="text.secondary">No active projects assigned to you.</Typography>
								</Box>
							) : (
								<TableContainer sx={{ maxHeight: 220, overflowY: 'auto' }}>
									<Table size="small" stickyHeader>
										<TableHead>
											<TableRow sx={{ '& th': { bgcolor: 'transparent', fontWeight: 800, fontSize: '0.68rem', color: 'text.secondary', borderBottom: `1px solid ${theme.palette.divider}` } }}>
												<TableCell>Project Name</TableCell>
												<TableCell>Status</TableCell>
												<TableCell align="right">Timeline</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{projects.map((p) => {
												const timelineText = p.end_date
													? new Date(p.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })
													: 'No deadline';
												return (
													<TableRow key={p.public_id} hover sx={{ '& td': { borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`, py: 1 } }}>
														<TableCell sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.78rem' }}>{p.name}</TableCell>
														<TableCell>
 															<Chip
 																label={p.status}
 																size="small"
 																sx={{
 																	height: 18, fontSize: '0.6rem', fontWeight: 800,
 																	bgcolor: p.status === 'delayed' || p.status === 'on_hold' ? alpha(theme.palette.warning.main, 0.1) : alpha(theme.palette.success.main, 0.1),
 																	color: p.status === 'delayed' || p.status === 'on_hold' ? theme.palette.warning.main : theme.palette.success.main,
 																}}
 															/>
														</TableCell>
														<TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.74rem' }}>{timelineText}</TableCell>
													</TableRow>
												);
											})}
										</TableBody>
									</Table>
								</TableContainer>
							)}
						</CustomTabPanel>
					</Box>
				)}
			</CardContent>
		</Card>
	);
};

export default IndividualTabbedGridPanel;
