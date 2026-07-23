import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container, Box, Typography, CircularProgress, Paper, Stack, LinearProgress, Divider, useTheme, Fade, alpha } from '@mui/material';
import { ErrorOutline as ErrorIcon, CalendarMonthOutlined, BusinessOutlined, TaskAltOutlined } from '@mui/icons-material';
import dayjs from 'dayjs';
import projectService from '../../../services/projectService';
import StatusBadge from '../../../components/common/badge/StatusBadge';
import { useColorMode } from '../../../theme/ThemeContext';
import type { PublicProject } from '../../../models/projects/project';

/** Strips HTML tags for a plain-text preview -- same helper as ProjectDetailHeader. */
const htmlToPlainText = (html: string): string => {
	const temp = document.createElement('div');
	temp.innerHTML = html;
	return (temp.textContent || temp.innerText || '').trim();
};

const ProjectStatusPage: React.FC = () => {
	const theme = useTheme();
	const { mode: colorMode } = useColorMode();
	const [searchParams] = useSearchParams();
	const token = searchParams.get('token');

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [project, setProject] = useState<PublicProject | null>(null);

	useEffect(() => {
		if (!token) {
			setError('This link is missing its token.');
			setLoading(false);
			return;
		}
		projectService.publicGetProject(token)
			.then(setProject)
			.catch((err: any) => {
				setError(err?.response?.data?.error?.message || 'This link is invalid or is no longer being shared.');
			})
			.finally(() => setLoading(false));
	}, [token]);

	const taskPct = project && project.task_count > 0 ? Math.round((project.completed_task_count / project.task_count) * 100) : 0;

	return (
		<Box
			component="main"
			sx={{
				minHeight: '100vh',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				backgroundColor: theme.palette.background.default,
				backgroundImage: `radial-gradient(circle at 50% 50%, ${theme.palette.background.default} 0%, ${theme.palette.secondary.dark}20 100%)`,
				py: 6,
			}}
		>
			<Container maxWidth="sm">
				<Box sx={{ mb: 4, textAlign: 'center' }}>
					<Box
						component="img"
						src={colorMode === 'dark' ? '/assets/img/logo/gravit-dark.svg' : '/assets/img/logo/gravit-light.svg'}
						alt="Gravit Logo"
						sx={{ height: 48, mb: 1.5 }}
					/>
				</Box>

				<Fade in timeout={600}>
					<Paper
						elevation={1}
						sx={{
							p: { xs: 3, sm: 5 },
							borderRadius: 2,
							backgroundColor: theme.palette.background.paper,
							border: `1px solid ${theme.palette.divider}`,
						}}
					>
						{loading && (
							<Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
								<CircularProgress size={32} />
								<Typography color="text.secondary">Loading project status…</Typography>
							</Stack>
						)}

						{!loading && error && (
							<Stack alignItems="center" spacing={2} sx={{ textAlign: 'center', py: 2 }}>
								<ErrorIcon sx={{ fontSize: 64, color: theme.palette.error.main }} />
								<Typography variant="h6" fontWeight={700}>Link Invalid</Typography>
								<Typography variant="body2" color="text.secondary">{error}</Typography>
							</Stack>
						)}

						{!loading && !error && project && (
							<Box>
								<Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" rowGap={1} sx={{ mb: 1 }}>
									<Typography variant="h5" fontWeight={800}>{project.name}</Typography>
									<StatusBadge label={project.status.replace('_', ' ')} status={project.status} type="project" />
								</Stack>

								{project.description && (
									<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
										{htmlToPlainText(project.description)}
									</Typography>
								)}

								<Stack direction="row" spacing={2.5} flexWrap="wrap" rowGap={1} sx={{ mb: 3 }}>
									{project.company_name && (
										<Stack direction="row" spacing={0.75} alignItems="center">
											<BusinessOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
											<Typography variant="body2" color="text.secondary">{project.company_name}</Typography>
										</Stack>
									)}
									{(project.start_date || project.end_date) && (
										<Stack direction="row" spacing={0.75} alignItems="center">
											<CalendarMonthOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
											<Typography variant="body2" color="text.secondary">
												{project.start_date ? dayjs(project.start_date).format('MMM D, YYYY') : '—'}
												{' → '}
												{project.end_date ? dayjs(project.end_date).format('MMM D, YYYY') : '—'}
											</Typography>
										</Stack>
									)}
								</Stack>

								<Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 0.75 }}>
									<Stack direction="row" spacing={0.75} alignItems="center">
										<TaskAltOutlined sx={{ fontSize: '1rem', color: 'text.secondary' }} />
										<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
											Progress
										</Typography>
									</Stack>
									<Typography variant="caption" sx={{ fontWeight: 700 }}>
										{project.completed_task_count} of {project.task_count} completed &middot; {taskPct}%
									</Typography>
								</Stack>
								<LinearProgress
									variant="determinate"
									value={taskPct}
									sx={{
										height: 6,
										borderRadius: 3,
										bgcolor: alpha(theme.palette.text.secondary, 0.12),
										'& .MuiLinearProgress-bar': { borderRadius: 3, background: theme.gradients.brand },
									}}
								/>

								{project.tasks.length > 0 && (
									<>
										<Divider sx={{ my: 2.5 }} />
										<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1, display: 'block' }}>
											Tasks
										</Typography>
										<Stack spacing={0.75}>
											{project.tasks.map((task, idx) => (
												<Stack
													key={idx}
													direction="row"
													alignItems="center"
													justifyContent="space-between"
													spacing={1.5}
													sx={{
														py: 1, px: 1.25, borderRadius: '8px',
														bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
													}}
												>
													<Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
														<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: task.status_color, flexShrink: 0 }} />
														<Typography
															variant="body2"
															sx={{
																fontWeight: 600,
																textDecoration: task.is_done ? 'line-through' : 'none',
																color: task.is_done ? 'text.disabled' : 'text.primary',
																overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
															}}
														>
															{task.title}
														</Typography>
													</Stack>
													<Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
														{task.due_date && (
															<Typography variant="caption" color="text.secondary">
																{dayjs(task.due_date).format('MMM D')}
															</Typography>
														)}
														<Typography variant="caption" sx={{ fontWeight: 700, color: task.status_color }}>
															{task.status_name}
														</Typography>
													</Stack>
												</Stack>
											))}
										</Stack>
									</>
								)}
							</Box>
						)}
					</Paper>
				</Fade>
			</Container>
		</Box>
	);
};

export default ProjectStatusPage;
