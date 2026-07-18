import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Card, CardContent, Typography, Box, useTheme, Skeleton, Link, CircularProgress } from '@mui/material';
import { AssignmentOutlined, ChevronRight, WarningAmber, CalendarToday } from '@mui/icons-material';
import projectService from '../../../services/projectService';
import type { ProjectStats } from '../../../models/projects/project';

export const ProjectStatusOverviewPanel: React.FC = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const [stats, setStats] = useState<ProjectStats | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		projectService.getProjectStats()
			.then((data) => { if (!cancelled) setStats(data); })
			.catch(() => { if (!cancelled) setStats(null); })
			.finally(() => { if (!cancelled) setLoading(false); });
		return () => { cancelled = true; };
	}, []);

	const taskPercent = stats && stats.total_tasks > 0
		? Math.round((stats.completed_tasks / stats.total_tasks) * 100)
		: 0;

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
				<Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
					<Box display="flex" alignItems="center" gap={1.25}>
						<AssignmentOutlined color="primary" sx={{ fontSize: 20 }} />
						<Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.78rem', color: 'text.primary' }}>
							Projects Overview
						</Typography>
					</Box>
					<Link component={RouterLink} to="/projects" sx={{ display: 'flex', alignItems: 'center', color: 'primary.main', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
						All Projects <ChevronRight sx={{ fontSize: 16 }} />
					</Link>
				</Box>

				{loading ? (
					<Skeleton variant="rounded" height={160} sx={{ borderRadius: '12px', flexGrow: 1 }} />
				) : !stats ? (
					<Typography variant="body2" color="text.secondary">Couldn't load project statistics.</Typography>
				) : (
					<Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={3} alignItems="center" sx={{ flexGrow: 1 }}>
						{/* Progress and core counts on the left */}
						<Box display="flex" alignItems="center" gap={2} sx={{ flexShrink: 0 }}>
							<Box sx={{ position: 'relative', display: 'inline-flex' }}>
								<CircularProgress
									variant="determinate"
									value={100}
									size={76}
									thickness={4.5}
									sx={{ color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', position: 'absolute' }}
								/>
								<CircularProgress
									variant="determinate"
									value={taskPercent}
									size={76}
									thickness={4.5}
									sx={{ color: theme.palette.success.main, '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }}
								/>
								<Box sx={{
									position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
									alignItems: 'center', justifyContent: 'center',
								}}>
									<Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1 }}>
										{taskPercent}%
									</Typography>
									<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.55rem', fontWeight: 700 }}>
										TASKS
									</Typography>
								</Box>
							</Box>

							<Box>
								<Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.1 }}>
									{stats.total_projects}
								</Typography>
								<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
									Total Projects
								</Typography>
								
								{stats.overdue_count > 0 ? (
									<Box display="flex" alignItems="center" gap={0.5} sx={{ color: theme.palette.error.main }}>
										<WarningAmber sx={{ fontSize: 13 }} />
										<Typography variant="caption" sx={{ fontWeight: 700 }}>
											{stats.overdue_count} Overdue
										</Typography>
									</Box>
								) : (
									<Typography variant="caption" color="success.main" sx={{ fontWeight: 700 }}>
										All on schedule
									</Typography>
								)}
							</Box>
						</Box>

						{/* Divider on sm and larger */}
						<Box sx={{
							alignSelf: 'stretch',
							width: '1px',
							bgcolor: theme.palette.divider,
							display: { xs: 'none', sm: 'block' },
							my: 0.5
						}} />

						{/* Upcoming Deadlines on the right */}
						<Box sx={{ flex: 1, minWidth: 0, alignSelf: 'stretch', display: 'flex', flexDirection: 'column' }}>
							<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
								Upcoming Deadlines
							</Typography>
							
							{stats.upcoming_deadlines.length === 0 ? (
								<Box display="flex" alignItems="center" justifyContent="center" sx={{ flexGrow: 1, py: 2 }}>
									<Typography variant="caption" color="text.secondary">No upcoming deadlines.</Typography>
								</Box>
							) : (
								<Box sx={{
									display: 'flex',
									flexDirection: 'column',
									gap: 1,
									maxHeight: '120px',
									overflowY: 'auto',
									pr: 0.5,
									'&::-webkit-scrollbar': { width: '4px' },
									'&::-webkit-scrollbar-track': { background: 'transparent' },
									'&::-webkit-scrollbar-thumb': {
										background: theme.palette.divider,
										borderRadius: '2px',
									},
								}}>
									{stats.upcoming_deadlines.slice(0, 3).map((item) => (
										<Box
											key={item.public_id}
											component={RouterLink}
											to="/projects"
											sx={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
												p: 1,
												borderRadius: 1.5,
												textDecoration: 'none',
												bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
												border: `1px solid ${theme.palette.divider}`,
												transition: 'all 0.2s ease',
												'&:hover': {
													bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
													borderColor: theme.palette.primary.main,
												}
											}}
										>
											<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', maxWidth: '65%' }} noWrap>
												{item.name}
											</Typography>
											<Box display="flex" alignItems="center" gap={0.5} sx={{ color: theme.palette.warning.main }}>
												<CalendarToday sx={{ fontSize: 11 }} />
												<Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.65rem' }}>
													{new Date(item.end_date).toLocaleDateString()}
												</Typography>
											</Box>
										</Box>
									))}
								</Box>
							)}
						</Box>
					</Box>
				)}
			</CardContent>
		</Card>
	);
};

export default ProjectStatusOverviewPanel;
