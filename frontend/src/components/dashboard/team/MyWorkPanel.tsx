import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, useTheme, Skeleton, alpha } from '@mui/material';
import { ChecklistOutlined, WarningAmberOutlined, EventOutlined, TaskAlt } from '@mui/icons-material';
import crmService from '../../../services/crmService';
import projectService from '../../../services/projectService';
import type { CRMStats } from '../../../models/crm/crmStats';
import type { ProjectStats } from '../../../models/projects/project';

export const MyWorkPanel: React.FC = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const [crm, setCrm] = useState<CRMStats | null>(null);
	const [projects, setProjects] = useState<ProjectStats | null>(null);
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		let cancelled = false;
		Promise.all([
			crmService.getStats().catch(() => null),
			projectService.getProjectStats().catch(() => null),
		]).then(([c, p]) => {
			if (cancelled) return;
			setCrm(c);
			setProjects(p);
			setLoaded(true);
		});
		return () => { cancelled = true; };
	}, []);

	const deadlines = projects?.upcoming_deadlines?.slice(0, 3) ?? [];
	const nothingToShow = loaded && !crm && !projects;

	return (
		<Card
			sx={{
				borderRadius: '16px',
				height: '100%',
				background: isDark
					? 'linear-gradient(135deg, rgba(20, 24, 34, 0.75) 0%, rgba(11, 13, 18, 0.9) 100%)'
					: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(248, 250, 252, 0.95) 100%)',
				backdropFilter: 'blur(20px)',
				border: `1px solid ${theme.palette.divider}`,
				boxShadow: isDark ? '0 8px 32px 0 rgba(0, 0, 0, 0.2)' : '0 8px 32px 0 rgba(139, 124, 246, 0.04)',
			}}
		>
			<CardContent sx={{ p: 2.5 }}>
				<Box display="flex" alignItems="center" gap={1.25} sx={{ mb: 2 }}>
					<ChecklistOutlined color="primary" sx={{ fontSize: 20 }} />
					<Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.78rem', color: 'text.primary' }}>
						My Work Today
					</Typography>
				</Box>

				{!loaded ? (
					<Skeleton variant="rounded" height={140} sx={{ borderRadius: '12px' }} />
				) : nothingToShow ? (
					<Typography variant="body2" color="text.secondary">No CRM or Projects data available yet.</Typography>
				) : (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
						<Box sx={{ display: 'flex', gap: 1.5 }}>
							{crm && (
								<Box sx={{ flex: 1, p: 1.5, borderRadius: '12px', bgcolor: alpha(theme.palette.info.main, 0.06), border: `1px solid ${alpha(theme.palette.info.main, 0.15)}` }}>
									<Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>{crm.my_tasks?.length ?? 0}</Typography>
									<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>My CRM tasks</Typography>
								</Box>
							)}
							{projects && (
								<Box sx={{ flex: 1, p: 1.5, borderRadius: '12px', bgcolor: alpha(theme.palette.error.main, 0.06), border: `1px solid ${alpha(theme.palette.error.main, 0.15)}` }}>
									<Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>{projects.overdue_count}</Typography>
									<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Overdue tasks</Typography>
								</Box>
							)}
						</Box>

						{deadlines.length > 0 ? (
							<Box>
								<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1, display: 'block' }}>
									Upcoming Deadlines
								</Typography>
								<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
									{deadlines.map((d) => (
										<Box key={d.public_id} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: 1.25, borderRadius: '8px', bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
											<EventOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
											<Typography variant="body2" sx={{ flex: 1, fontWeight: 600, color: 'text.primary' }} noWrap>{d.name}</Typography>
											<Typography variant="caption" color="text.secondary">{new Date(d.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Typography>
										</Box>
									))}
								</Box>
							</Box>
						) : (projects || crm) ? (
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
								<TaskAlt sx={{ fontSize: 18, color: 'success.main' }} />
								<Typography variant="body2" color="text.secondary">Nothing overdue — you're on top of it.</Typography>
							</Box>
						) : null}

						{projects && projects.overdue_count > 0 && (
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								<WarningAmberOutlined sx={{ fontSize: 16, color: 'warning.main' }} />
								<Typography variant="caption" color="text.secondary">
									{projects.overdue_count} task{projects.overdue_count === 1 ? '' : 's'} past due across your projects.
								</Typography>
							</Box>
						)}
					</Box>
				)}
			</CardContent>
		</Card>
	);
};

export default MyWorkPanel;
