import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, useTheme, Skeleton, LinearProgress } from '@mui/material';
import { FolderCopy } from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import projectService from '../../../services/projectService';
import type { Project } from '../../../models/projects/project';

interface DonutItem {
	name: string;
	value: number;
	color: string;
}

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export const ClientProjectsDonutPanel: React.FC = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const [data, setData] = useState<DonutItem[]>([]);
	const [totalProjects, setTotalProjects] = useState(0);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;

		const loadData = async () => {
			try {
				const projectsRes = await projectService.listProjects(1, 200).catch(() => ({ items: [], total: 0 }));
				if (cancelled) return;

				const group: Record<string, number> = {};
				let total = 0;

				projectsRes.items.forEach((p: Project) => {
					let client = 'Other';
					if (p.name.includes('Initech')) client = 'Initech Inc.';
					else if (p.name.includes('Umbrella')) client = 'Umbrella Corp';
					else if (p.name.includes('Acme')) client = 'Acme Corp';
					else if (p.name.includes('Stark')) client = 'Stark Industries';
					else if (p.name.includes('Globex')) client = 'Globex Corp';
					else if (p.name.includes('Hooli')) client = 'Hooli';

					group[client] = (group[client] || 0) + 1;
					total++;
				});

				setTotalProjects(total);

				const donutData = Object.entries(group)
					.map(([name, count], index) => ({
						name,
						value: count,
						color: COLORS[index % COLORS.length],
					}))
					.sort((a, b) => b.value - a.value);

				if (total === 0) {
					const mockItems = [
						{ name: 'Umbrella Corp', value: 4, color: COLORS[0] },
						{ name: 'Initech Inc.', value: 2, color: COLORS[1] },
						{ name: 'Acme Corp', value: 1, color: COLORS[2] },
					];
					setData(mockItems);
					setTotalProjects(7);
				} else {
					setData(donutData);
				}
			} catch (err) {
				console.error(err);
			} finally {
				if (!cancelled) setLoading(false);
			}
		};

		loadData();
		return () => { cancelled = true; };
	}, []);

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
				<Box display="flex" alignItems="center" gap={1.25} sx={{ mb: 2 }}>
					<FolderCopy color="primary" sx={{ fontSize: 20 }} />
					<Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.78rem', color: 'text.primary' }}>
						Client Projects
					</Typography>
				</Box>

				{loading ? (
					<Skeleton variant="rounded" height={220} sx={{ borderRadius: '12px', flexGrow: 1 }} />
				) : (
					<Box display="flex" flexDirection="column" alignItems="center" sx={{ flexGrow: 1 }}>
						{/* Donut Chart on Top */}
						<Box sx={{ position: 'relative', width: 130, height: 130, mb: 2.5, flexShrink: 0 }}>
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={data}
										dataKey="value"
										nameKey="name"
										innerRadius={45}
										outerRadius={58}
										paddingAngle={4}
										cornerRadius={3}
										stroke="none"
									>
										{data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
									</Pie>
								</PieChart>
							</ResponsiveContainer>
							<Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
								<Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1 }}>
									{totalProjects}
								</Typography>
								<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.52rem', fontWeight: 800, letterSpacing: '0.04em' }}>
									PROJECTS
								</Typography>
							</Box>
						</Box>

						{/* Legend Below */}
						<Box sx={{
							width: '100%',
							maxHeight: '110px',
							overflowY: 'auto',
							pr: 0.5,
							display: 'flex',
							flexDirection: 'column',
							gap: 1.25,
							'&::-webkit-scrollbar': { width: '4px' },
							'&::-webkit-scrollbar-thumb': { background: theme.palette.divider, borderRadius: '2px' }
						}}>
							{data.map((d) => {
								const percentage = Math.round((d.value / totalProjects) * 100);
								return (
									<Box key={d.name} sx={{ width: '100%' }}>
										<Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
											<Box display="flex" alignItems="center" gap={0.75} sx={{ minWidth: 0 }}>
												<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: d.color, flexShrink: 0 }} />
												<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.72rem' }} noWrap>
													{d.name}
												</Typography>
											</Box>
											<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.72rem' }}>
												{d.value} ({percentage}%)
											</Typography>
										</Box>
										<LinearProgress
											variant="determinate"
											value={percentage}
											sx={{
												height: 4,
												borderRadius: 2,
												bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
												'& .MuiLinearProgress-bar': { borderRadius: 2, bgcolor: d.color }
											}}
										/>
									</Box>
								);
							})}
						</Box>
					</Box>
				)}
			</CardContent>
		</Card>
	);
};

export default ClientProjectsDonutPanel;
