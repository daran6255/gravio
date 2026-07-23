import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Stack, IconButton, Avatar, LinearProgress, Chip, Divider, Tooltip, Collapse, useTheme, alpha } from '@mui/material';
import {
	ArrowBackOutlined,
	PersonOutline,
	BusinessOutlined,
	AccountBalanceWalletOutlined,
	CalendarMonthOutlined,
	TaskAltOutlined,
	TransformOutlined,
	EditOutlined,
	WarningAmberOutlined,
	GroupsOutlined,
	ExpandMoreOutlined,
	SettingsOutlined,
	InfoOutlined,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import StatusBadge, { getStatusTone } from '../../../common/badge/StatusBadge';
import { AddButton } from '../../../common/button';
import useDateTime from '../../../../hooks/useDateTime';
import { formatMoney } from '../../../../utils/currency';
import projectService from '../../../../services/projectService';
import type { Project, ProjectBudgetActuals } from '../../../../models/projects/project';
import type { ProjectTask } from '../../../../models/projects/projectTask';
import type { CRMOwnerOption } from '../../../../models/crm/owner';

interface ProjectDetailHeaderProps {
	project: Project;
	tasks: ProjectTask[];
	owners: CRMOwnerOption[];
	onBack: () => void;
	onEdit: () => void;
	onAddTask: () => void;
	onManageStages: () => void;
}

const AVATAR_PALETTE = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const avatarColorFor = (id: number) => AVATAR_PALETTE[id % AVATAR_PALETTE.length];

/** Strips HTML tags and decodes entities (e.g. `&nbsp;`) for a plain-text preview. */
const htmlToPlainText = (html: string): string => {
	const temp = document.createElement('div');
	temp.innerHTML = html;
	return (temp.textContent || temp.innerText || '').trim();
};

/** A single fact in the header's metadata strip — icon, label, value. */
const FactItem: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; color: string }> = ({
	icon,
	label,
	value,
	color,
}) => (
	<Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
		<Box
			sx={{
				width: 30,
				height: 30,
				borderRadius: '9px',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				flexShrink: 0,
				bgcolor: alpha(color, 0.1),
				color,
			}}
		>
			{icon}
		</Box>
		<Box sx={{ minWidth: 0 }}>
			<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem', display: 'block' }}>
				{label}
			</Typography>
			<Box sx={{ fontWeight: 700, fontSize: '0.85rem', color: 'text.primary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
				{value}
			</Box>
		</Box>
	</Stack>
);

export const ProjectDetailHeader: React.FC<ProjectDetailHeaderProps> = ({ project, tasks, owners, onBack, onEdit, onAddTask, onManageStages }) => {
	const theme = useTheme();
	const { formatDate } = useDateTime();
	const [expanded, setExpanded] = useState(false);
	const [budgetActuals, setBudgetActuals] = useState<ProjectBudgetActuals | null>(null);

	// Lazily fetched -- only needed once the details section (where it's shown) is
	// actually opened, and re-fetched each time it's re-opened so logged hours stay current.
	useEffect(() => {
		if (!expanded) return;
		let cancelled = false;
		projectService.getProjectBudgetActuals(project.public_id).then((result) => {
			if (!cancelled) setBudgetActuals(result);
		}).catch(() => {
			if (!cancelled) setBudgetActuals(null);
		});
		return () => { cancelled = true; };
	}, [expanded, project.public_id]);

	// Everyone with at least one task assigned to them in this project — deduped,
	// resolved against the owner options list already loaded for the assignee pickers.
	const contributors = useMemo(() => {
		const ownerMap = new Map(owners.map((o) => [o.id, o]));
		const ids = new Set<number>();
		for (const t of tasks) {
			if (t.assignee_id) ids.add(t.assignee_id);
		}
		return Array.from(ids)
			.map((id) => ownerMap.get(id))
			.filter((o): o is CRMOwnerOption => !!o);
	}, [tasks, owners]);
	const contributorNames = contributors.map((c) => c.full_name || c.email).join(', ');
	const statusTone = getStatusTone(project.status, 'project');
	const accentColor = {
		success: theme.palette.success.main,
		info: theme.palette.primary.main,
		warning: theme.palette.warning.main,
		error: theme.palette.error.main,
		default: theme.palette.text.disabled,
	}[statusTone];

	const taskCount = project.task_count ?? 0;
	const completedCount = project.completed_task_count ?? 0;
	const taskPct = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

	const isOverdue = !!project.end_date
		&& dayjs(project.end_date).isBefore(dayjs(), 'day')
		&& !['completed', 'approved', 'invoiced', 'canceled'].includes(project.status);
	const daysRemaining = project.end_date ? dayjs(project.end_date).diff(dayjs(), 'day') : null;

	const timelineValue = project.start_date || project.end_date
		? `${formatDate(project.start_date)} → ${formatDate(project.end_date)}`
		: 'No dates set';

	return (
		<Box
			sx={{
				position: 'relative',
				overflow: 'hidden',
				borderRadius: '12px',
				border: '1px solid',
				borderColor: 'divider',
				bgcolor: 'background.paper',
				mb: 2,
			}}
		>
			{/* Status accent bar — quick at-a-glance health signal */}
			<Box sx={{ height: 4, width: '100%', bgcolor: accentColor }} />

			<Box sx={{ p: { xs: 1.5, sm: 2 } }}>
				{/* Title row */}
				<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'flex-start' }} spacing={1.5}>
					<Stack direction="row" spacing={1} alignItems="flex-start" sx={{ minWidth: 0, flex: 1 }}>
						<IconButton
							onClick={onBack}
							size="small"
							sx={{ mt: 0.25, color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.08) } }}
							aria-label="Back to projects"
						>
							<ArrowBackOutlined fontSize="small" />
						</IconButton>
						<Box sx={{ minWidth: 0, flex: 1 }}>
							<Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" sx={{ rowGap: 1 }}>
								<Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
									{project.name}
								</Typography>
								<Tooltip title="Edit project">
									<IconButton
										onClick={onEdit}
										size="small"
										aria-label="Edit project"
										sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.08) } }}
									>
										<EditOutlined fontSize="small" />
									</IconButton>
								</Tooltip>
								<StatusBadge label={project.status.replace('_', ' ')} status={project.status} type="project" />
								{isOverdue && (
									<Stack direction="row" spacing={0.5} alignItems="center">
										<WarningAmberOutlined sx={{ fontSize: '1rem', color: 'error.main' }} />
										<Typography variant="caption" sx={{ fontWeight: 700, color: 'error.main' }}>
											{Math.abs(daysRemaining ?? 0)}d overdue
										</Typography>
									</Stack>
								)}
								{project.deal_title && (
									<Tooltip title={`Converted from CRM deal "${project.deal_title}"`}>
										<Chip
											size="small"
											icon={<TransformOutlined sx={{ fontSize: '14px !important' }} />}
											label="From deal"
											variant="outlined"
											sx={{ fontWeight: 600, fontSize: '0.7rem' }}
										/>
									</Tooltip>
								)}
							</Stack>

							{project.description && (
								<Typography
									variant="body2"
									color="text.secondary"
									sx={{
										mt: 0.75,
										display: '-webkit-box',
										WebkitLineClamp: 2,
										WebkitBoxOrient: 'vertical',
										overflow: 'hidden',
										maxWidth: 720,
									}}
								>
									{htmlToPlainText(project.description)}
								</Typography>
							)}
						</Box>
					</Stack>

					<Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
						<AddButton size="small" onClick={onAddTask} sx={{ px: 2.25, py: 0.75 }}>
							Add Task
						</AddButton>
						<Tooltip title="Manage task stages">
							<IconButton
								onClick={onManageStages}
								size="small"
								aria-label="Manage task stages"
								sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.08) } }}
							>
								<SettingsOutlined fontSize="small" />
							</IconButton>
						</Tooltip>
						<Tooltip title={expanded ? 'Hide details' : 'Show details'}>
							<IconButton
								onClick={() => setExpanded((v) => !v)}
								size="small"
								aria-label={expanded ? 'Hide project details' : 'Show project details'}
								aria-expanded={expanded}
								sx={{
									color: 'text.secondary',
									transition: theme.transitions.create('transform'),
									transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
									'&:hover': { color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.08) },
								}}
							>
								<ExpandMoreOutlined fontSize="small" />
							</IconButton>
						</Tooltip>
					</Stack>
				</Stack>

				<Collapse in={expanded} timeout="auto" unmountOnExit>
					<Divider sx={{ my: 1.5 }} />

					{/* Facts */}
					<Box
						sx={{
							display: 'grid',
							gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' },
							gap: { xs: 1.5, sm: 2 },
						}}
					>
						<FactItem
							icon={<PersonOutline fontSize="small" />}
							label="Owner"
							color={theme.palette.primary.main}
							value={
								project.owner_name ? (
									<Stack direction="row" spacing={0.75} alignItems="center">
										<Avatar sx={{ width: 18, height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: project.owner_id ? avatarColorFor(project.owner_id) : undefined }}>
											{project.owner_name[0]?.toUpperCase()}
										</Avatar>
										<Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{project.owner_name}</Box>
									</Stack>
								) : 'Unassigned'
							}
						/>

						<FactItem
							icon={<BusinessOutlined fontSize="small" />}
							label="Client"
							color={theme.palette.accent.main}
							value={project.company_name || 'Internal'}
						/>

						<FactItem
							icon={<AccountBalanceWalletOutlined fontSize="small" />}
							label="Budget"
							color={theme.palette.success.main}
							value={
								project.budget == null ? (
									'Not set'
								) : project.display_budget != null && project.display_currency ? (
									<Tooltip title={`Original: ${formatMoney(project.budget, project.currency)}${project.display_rate ? ` (1 ${project.currency} = ${project.display_rate.toFixed(4)} ${project.display_currency})` : ''}`} arrow>
										<span style={{ cursor: 'help' }}>
											{formatMoney(project.display_budget, project.display_currency)}
										</span>
									</Tooltip>
								) : (
									formatMoney(project.budget, project.currency)
								)
							}
						/>

						<FactItem
							icon={<CalendarMonthOutlined fontSize="small" />}
							label="Timeline"
							color={theme.palette.warning.main}
							value={
								<Stack spacing={0}>
									<Box component="span">{timelineValue}</Box>
									{daysRemaining !== null && !isOverdue && (
										<Typography component="span" variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
											{daysRemaining >= 0 ? `${daysRemaining}d left` : ''}
										</Typography>
									)}
								</Stack>
							}
						/>

						<FactItem
							icon={<GroupsOutlined fontSize="small" />}
							label="Contributors"
							color={theme.palette.secondary.light}
							value={
								contributors.length > 0 ? (
									<Tooltip title={contributorNames}>
										<Box component="span">{contributorNames}</Box>
									</Tooltip>
								) : 'Unassigned'
							}
						/>
					</Box>

					{/* Task progress */}
					<Box sx={{ mt: 2 }}>
						<Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 0.75 }}>
							<Stack direction="row" spacing={0.75} alignItems="center">
								<TaskAltOutlined sx={{ fontSize: '1rem', color: 'text.secondary' }} />
								<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
									Task Progress
								</Typography>
							</Stack>
							<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
								{completedCount} of {taskCount} completed &middot; {taskPct}%
							</Typography>
						</Stack>
						<LinearProgress
							variant="determinate"
							value={taskPct}
							sx={{
								height: 6,
								borderRadius: 3,
								bgcolor: alpha(theme.palette.text.secondary, 0.12),
								'& .MuiLinearProgress-bar': {
									borderRadius: 3,
									background: theme.gradients.brand,
								},
							}}
						/>
					</Box>

					{/* Budget vs Actual */}
					{budgetActuals && (
						budgetActuals.budget != null
						|| budgetActuals.estimated_hours_total > 0
						|| budgetActuals.actual_hours_logged_total > 0
					) && (
						<Box sx={{ mt: 2 }}>
							<Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 0.75 }} flexWrap="wrap" rowGap={0.5}>
								<Stack direction="row" spacing={0.75} alignItems="center">
									<AccountBalanceWalletOutlined sx={{ fontSize: '1rem', color: 'text.secondary' }} />
									<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
										Budget vs Actual
									</Typography>
									{budgetActuals.estimated_spend != null && (
										<Tooltip
											title={`Estimated spend = (budget ÷ ${budgetActuals.estimated_hours_total}h estimated) × ${budgetActuals.billable_hours_logged}h billable logged. Modeled from existing estimates and timesheets -- not an invoiced amount.`}
											arrow
										>
											<InfoOutlined sx={{ fontSize: '0.85rem', color: 'text.disabled', cursor: 'help' }} />
										</Tooltip>
									)}
								</Stack>
								<Typography variant="caption" sx={{ fontWeight: 700, color: budgetActuals.is_over_budget ? 'error.main' : 'text.primary' }}>
									{budgetActuals.estimated_spend != null && budgetActuals.budget != null ? (
										`${formatMoney(budgetActuals.estimated_spend, budgetActuals.currency)} of ${formatMoney(budgetActuals.budget, budgetActuals.currency)} · ${budgetActuals.budget_utilization_pct}%`
									) : (
										`${budgetActuals.actual_hours_logged_total}h logged of ${budgetActuals.estimated_hours_total}h estimated${budgetActuals.hours_utilization_pct != null ? ` · ${budgetActuals.hours_utilization_pct}%` : ''}`
									)}
								</Typography>
							</Stack>
							<LinearProgress
								variant="determinate"
								value={Math.min(budgetActuals.budget_utilization_pct ?? budgetActuals.hours_utilization_pct ?? 0, 100)}
								sx={{
									height: 6,
									borderRadius: 3,
									bgcolor: alpha(theme.palette.text.secondary, 0.12),
									'& .MuiLinearProgress-bar': {
										borderRadius: 3,
										bgcolor: budgetActuals.is_over_budget ? theme.palette.error.main : theme.palette.success.main,
									},
								}}
							/>
							<Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
								{budgetActuals.estimated_hours_total}h estimated &middot; {budgetActuals.billable_hours_logged}h billable logged &middot; {budgetActuals.non_billable_hours_logged}h non-billable logged
							</Typography>
						</Box>
					)}

					{/* Tags */}
					{!!project.tags?.length && (
						<>
							<Divider sx={{ my: 1.5 }} />
							<Stack direction="row" spacing={1} flexWrap="wrap" sx={{ rowGap: 1 }}>
								{project.tags.map((tag) => (
									<Chip key={tag} size="small" label={tag} variant="outlined" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
								))}
							</Stack>
						</>
					)}

					{/* Lifecycle footer */}
					<Typography variant="caption" sx={{ display: 'block', color: 'text.disabled', mt: 1.5 }}>
						Created {formatDate(project.created_at)} &middot; Last updated {formatDate(project.updated_at)}
					</Typography>
				</Collapse>
			</Box>
		</Box>
	);
};

export default ProjectDetailHeader;
