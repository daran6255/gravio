import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
	Box,
	Drawer,
	Stack,
	Typography,
	IconButton,
	Button,
	Skeleton,
	Paper,
	useTheme,
	alpha,
} from '@mui/material';
import {
	AutoAwesome,
	RefreshOutlined,
	CheckCircleOutlineRounded,
	WarningAmberRounded,
	ErrorOutlineRounded,
	ScheduleOutlined,
	TipsAndUpdatesOutlined,
	AccountTreeOutlined,
	DoneAllOutlined,
	ForumOutlined,
	PriorityHighOutlined,
} from '@mui/icons-material';
import projectService from '../../../../../services/projectService';
import type { ProjectTask, ProjectTaskUpdate, TaskInsight, TaskEstimate } from '../../../../../models/projects/projectTask';
import useToast from '../../../../../hooks/useToast';
import { IrisPanelHeader } from '../../../../common/iris/IrisPanelHeader';
import { IrisChatBody, type IrisQuickAction } from '../../../../common/iris/IrisChatBody';
import { useIrisChatPanel } from '../../../../common/iris/useIrisChatPanel';

interface IrisTaskPanelProps {
	open: boolean;
	onClose: () => void;
	task: ProjectTask;
	projectPublicId: string;
	onUpdateField: (fields: ProjectTaskUpdate) => Promise<void>;
}

const HEALTH_META: Record<string, { color: string; label: string; Icon: typeof CheckCircleOutlineRounded }> = {
	on_track: { color: '#2e7d32', label: 'On track', Icon: CheckCircleOutlineRounded },
	at_risk: { color: '#ed6c02', label: 'At risk', Icon: WarningAmberRounded },
	blocked: { color: '#d32f2f', label: 'Blocked', Icon: ErrorOutlineRounded },
};

const QUICK_ACTIONS: IrisQuickAction[] = [
	{ label: 'Break into subtasks', icon: <AccountTreeOutlined sx={{ fontSize: 15 }} />, message: 'Break this task down into a few clear, actionable subtasks.' },
	{ label: 'Mark subtasks done', icon: <DoneAllOutlined sx={{ fontSize: 15 }} />, message: 'Mark all subtasks on this task as completed.' },
	{ label: 'Summarize comments', icon: <ForumOutlined sx={{ fontSize: 15 }} />, message: 'Summarize the comment thread on this task.' },
	{ label: 'Bump to high priority', icon: <PriorityHighOutlined sx={{ fontSize: 15 }} />, message: 'Set the priority on this task to high.' },
];

export const IrisTaskPanel: React.FC<IrisTaskPanelProps> = ({ open, onClose, task, projectPublicId: _projectPublicId, onUpdateField }) => {
	const theme = useTheme();
	const toast = useToast();
	const brand = '#8B7CF6';

	const [insights, setInsights] = useState<TaskInsight | null>(null);
	const [insightsLoading, setInsightsLoading] = useState(false);
	const [estimate, setEstimate] = useState<TaskEstimate | null>(null);
	const [estimateLoading, setEstimateLoading] = useState(false);

	// Insights/estimate are cached per task (keyed by public_id) so opening and closing the
	// panel repeatedly shows the same numbers instead of asking the LLM fresh every time --
	// its output isn't perfectly deterministic, so re-fetching on every open produced a
	// different estimate each time. A cache entry is only replaced by an explicit refresh
	// (below) or after IRIS actually changes something about this task via the chat thread.
	const insightsCache = useRef<Record<string, TaskInsight>>({});
	const estimateCache = useRef<Record<string, TaskEstimate>>({});

	const loadInsights = useCallback(async (taskPublicId: string, force = false) => {
		if (!force && insightsCache.current[taskPublicId]) {
			setInsights(insightsCache.current[taskPublicId]);
			return;
		}
		setInsightsLoading(true);
		try {
			const result = await projectService.getTaskInsights(taskPublicId);
			insightsCache.current[taskPublicId] = result;
			setInsights(result);
		} catch {
			setInsights(null);
			toast.error("Couldn't read this task right now.");
		} finally {
			setInsightsLoading(false);
		}
	}, [toast]);

	const loadEstimate = useCallback(async (taskPublicId: string, force = false) => {
		if (!force && estimateCache.current[taskPublicId]) {
			setEstimate(estimateCache.current[taskPublicId]);
			return;
		}
		setEstimateLoading(true);
		try {
			const result = await projectService.estimateTaskHours(taskPublicId);
			estimateCache.current[taskPublicId] = result;
			setEstimate(result);
		} catch {
			setEstimate(null);
			toast.error("Couldn't estimate this task right now.");
		} finally {
			setEstimateLoading(false);
		}
	}, [toast]);

	useEffect(() => {
		if (!open) return;
		// Manual control -- insights/estimate each cost an LLM call, so don't fire them
		// automatically on every open. Seed from this session's cache if the user already
		// fetched them once; otherwise leave both null so the section shows its "Get ..."
		// button instead of spending credits the user didn't ask to spend.
		setInsights(insightsCache.current[task.public_id] ?? null);
		setEstimate(estimateCache.current[task.public_id] ?? null);
		// Only re-run when the panel opens for a (possibly different) task -- not on every
		// keystroke/prop change while it's already open.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, task.public_id]);

	const handleApplyEstimate = async () => {
		if (estimate?.estimated_hours == null) return;
		await onUpdateField({ estimated_hours: estimate.estimated_hours });
		toast.success(`Estimate set to ${estimate.estimated_hours}h`);
	};

	// IRIS may have just changed the fields insights/estimate are based on -- the cached reads
	// are stale now, force a fresh one instead of waiting for the next open. Fires after any
	// chat turn completes and after any approve/reject decision resolves; harmless to refresh
	// even when nothing actually changed.
	const handleActionCompleted = useCallback(() => {
		loadInsights(task.public_id, true);
		loadEstimate(task.public_id, true);
	}, [task.public_id, loadInsights, loadEstimate]);

	// A real, persisted, multi-turn thread scoped to this task (context_module="project_task",
	// context_entity_id=task.public_id) -- the same engine ChatDrawer and the other per-module
	// IRIS panels use, not a second implementation.
	const panel = useIrisChatPanel(open, 'project_task', task.public_id, handleActionCompleted);
	const { showSessions, setShowSessions, expanded, setExpanded, handleNewChat } = panel;

	const health = insights ? HEALTH_META[insights.health] : null;
	const HealthIcon = health?.Icon || CheckCircleOutlineRounded;

	const sectionCardSx = {
		p: 1.75,
		borderRadius: '12px',
		border: '1px solid',
		borderColor: 'divider',
		bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.012)',
	} as const;

	return (
		<Drawer
			anchor="right"
			open={open}
			onClose={onClose}
			PaperProps={{
				sx: {
					width: { xs: '100%', sm: 440 },
					maxWidth: '100%',
					// The app's global MuiDrawer override hardcodes a dark paper background/text
					// color regardless of light/dark mode (theme.ts) -- every other drawer in
					// this module (e.g. ProjectTaskDetailDrawer) overrides it back to the actual
					// theme colors the same way.
					bgcolor: theme.palette.background.paper,
					color: theme.palette.text.primary,
					boxShadow: 'none',
				},
			}}
		>
			<Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
				<IrisPanelHeader
					subtitle={task.title}
					onClose={onClose}
					showSessions={showSessions}
					onBack={() => setShowSessions(false)}
					onNewChat={handleNewChat}
					onShowHistory={() => setShowSessions(true)}
					expanded={expanded}
					onExpandToggle={() => setExpanded((v) => !v)}
				/>

				{!showSessions && (
					<Box sx={{ p: 2.25, pb: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
						{/* Insights */}
						<Paper elevation={0} sx={{ ...sectionCardSx, borderColor: health ? alpha(health.color, 0.3) : 'divider' }}>
							<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
								<Stack direction="row" alignItems="center" spacing={0.75}>
									<HealthIcon sx={{ fontSize: 17, color: health?.color || 'text.secondary' }} />
									<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
										{health?.label || 'Insights'}
									</Typography>
								</Stack>
								{insights && (
									<IconButton size="small" title="Get a fresh read" onClick={() => loadInsights(task.public_id, true)} disabled={insightsLoading}>
										<RefreshOutlined sx={{ fontSize: 14 }} />
									</IconButton>
								)}
							</Stack>
							{insightsLoading ? (
								<Stack spacing={0.75}>
									<Skeleton variant="text" width="85%" height={16} />
									<Skeleton variant="text" width="65%" height={16} />
								</Stack>
							) : insights ? (
								(insights.risk_reasons.length > 0 || insights.suggestions.length > 0) ? (
									<Stack spacing={0.75}>
										{insights.risk_reasons.map((reason, i) => (
											<Stack key={`r-${i}`} direction="row" spacing={0.75} alignItems="flex-start">
												<Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: health?.color, mt: 0.9, flexShrink: 0 }} />
												<Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{reason}</Typography>
											</Stack>
										))}
										{insights.suggestions.map((s, i) => (
											<Stack key={`s-${i}`} direction="row" spacing={0.75} alignItems="flex-start">
												<TipsAndUpdatesOutlined sx={{ fontSize: 14, color: brand, mt: 0.3, flexShrink: 0 }} />
												<Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.primary' }}>{s}</Typography>
											</Stack>
										))}
									</Stack>
								) : (
									<Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
										Nothing stands out — this task looks healthy.
									</Typography>
								)
							) : (
								<Stack spacing={1} alignItems="flex-start">
									<Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
										Get IRIS's read on this task's health and risk factors.
									</Typography>
									<Button
										size="small"
										variant="outlined"
										startIcon={<AutoAwesome sx={{ fontSize: 14 }} />}
										onClick={() => loadInsights(task.public_id)}
										sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', borderColor: alpha(brand, 0.4), color: brand, '&:hover': { borderColor: brand, bgcolor: alpha(brand, 0.08) } }}
									>
										Get insights
									</Button>
								</Stack>
							)}
						</Paper>

						{/* Estimate */}
						<Paper elevation={0} sx={sectionCardSx}>
							<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
								<Stack direction="row" alignItems="center" spacing={0.75}>
									<ScheduleOutlined sx={{ fontSize: 17, color: brand }} />
									<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Estimate</Typography>
								</Stack>
								{estimate && (
									<IconButton size="small" title="Get a fresh estimate" onClick={() => loadEstimate(task.public_id, true)} disabled={estimateLoading}>
										<RefreshOutlined sx={{ fontSize: 14 }} />
									</IconButton>
								)}
							</Stack>
							{estimateLoading ? (
								<Stack spacing={0.75}>
									<Skeleton variant="text" width="50%" height={28} />
									<Skeleton variant="text" width="80%" height={16} />
								</Stack>
							) : estimate ? (
								estimate.estimated_hours != null ? (
									<Stack spacing={1}>
										<Stack direction="row" alignItems="baseline" spacing={1}>
											<Typography sx={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1, color: brand }}>
												{estimate.estimated_hours}h
											</Typography>
											{task.estimated_hours != null && (
												<Typography variant="caption" color="text.secondary">
													currently {task.estimated_hours}h
												</Typography>
											)}
										</Stack>
										{estimate.rationale && (
											<Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{estimate.rationale}</Typography>
										)}
										<Button
											size="small"
											variant="outlined"
											onClick={handleApplyEstimate}
											sx={{ alignSelf: 'flex-start', textTransform: 'none', fontWeight: 700, borderRadius: '8px', borderColor: alpha(brand, 0.4), color: brand, '&:hover': { borderColor: brand, bgcolor: alpha(brand, 0.08) } }}
										>
											Apply {estimate.estimated_hours}h
										</Button>
									</Stack>
								) : (
									<Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
										Not enough data to suggest an estimate yet.
									</Typography>
								)
							) : (
								<Stack spacing={1} alignItems="flex-start">
									<Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
										Get an IRIS-suggested hour estimate for this task.
									</Typography>
									<Button
										size="small"
										variant="outlined"
										startIcon={<ScheduleOutlined sx={{ fontSize: 14 }} />}
										onClick={() => loadEstimate(task.public_id)}
										sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', borderColor: alpha(brand, 0.4), color: brand, '&:hover': { borderColor: brand, bgcolor: alpha(brand, 0.08) } }}
									>
										Get estimate
									</Button>
								</Stack>
							)}
						</Paper>
					</Box>
				)}

				<IrisChatBody
					panel={panel}
					quickActions={QUICK_ACTIONS}
					emptySubtitle="Ask me to break this task down, summarize comments, or update its fields."
				/>
			</Box>
		</Drawer>
	);
};

export default IrisTaskPanel;
