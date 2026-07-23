import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
	Drawer,
	Box,
	Stack,
	Typography,
	IconButton,
	Chip,
	TextField,
	Button,
	CircularProgress,
	Skeleton,
	Paper,
	useTheme,
	alpha,
} from '@mui/material';
import {
	CloseOutlined,
	AutoAwesome,
	SendRounded,
	CheckOutlined,
	RefreshOutlined,
	CheckCircleOutlineRounded,
	WarningAmberRounded,
	ErrorOutlineRounded,
	ScheduleOutlined,
	AccountTreeOutlined,
	DoneAllOutlined,
	ForumOutlined,
	PriorityHighOutlined,
	TipsAndUpdatesOutlined,
	HistoryRounded,
	ChatBubbleOutlineRounded,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useAppDispatch, useAppSelector } from '../../../../../store/hooks';
import { runIrisAction } from '../../../../../store/slices/projectsSlice';
import projectService from '../../../../../services/projectService';
import type {
	ProjectTask,
	ProjectTaskUpdate,
	IrisPreviewResponse,
	TaskInsight,
	TaskEstimate,
} from '../../../../../models/projects/projectTask';
import useToast from '../../../../../hooks/useToast';

dayjs.extend(relativeTime);

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

// One-click starting points so a user never has to stare at a blank box wondering what IRIS
// can actually do -- each fills the input with a concrete instruction and previews it right
// away (still nothing runs until Confirm, same as typing it out by hand).
const QUICK_ACTIONS: { label: string; icon: React.ReactNode; message: string }[] = [
	{ label: 'Break into subtasks', icon: <AccountTreeOutlined sx={{ fontSize: 15 }} />, message: 'Break this task down into a few clear, actionable subtasks.' },
	{ label: 'Mark subtasks done', icon: <DoneAllOutlined sx={{ fontSize: 15 }} />, message: 'Mark all subtasks on this task as completed.' },
	{ label: 'Summarize comments', icon: <ForumOutlined sx={{ fontSize: 15 }} />, message: 'Summarize the comment thread on this task.' },
	{ label: 'Bump to high priority', icon: <PriorityHighOutlined sx={{ fontSize: 15 }} />, message: 'Set the priority on this task to high.' },
];

// Turns a planned tool call into one plain-language line for the confirm card -- the raw
// tool_name/parameters shape (e.g. "update_project_task", {status: "In Review"}) means nothing
// to a non-technical user reading a proposal before approving it.
const describeStep = (toolName: string, parameters: Record<string, any>): string => {
	switch (toolName) {
		case 'update_project_task': {
			const { task: _task, ...fields } = parameters || {};
			const parts = Object.entries(fields)
				.filter(([, v]) => v !== undefined && v !== null && v !== '')
				.map(([k, v]) => `${k.replace(/_/g, ' ')} → ${v}`);
			return parts.length ? `Update: ${parts.join(', ')}` : 'Update this task';
		}
		case 'create_subtasks':
			return `Create subtasks: ${(parameters?.subtasks || []).join(', ')}`;
		case 'summarize_task_comments':
			return 'Summarize the comment thread';
		case 'search_project_tasks':
			return `Look up task "${parameters?.query}"`;
		default:
			return toolName.replace(/_/g, ' ');
	}
};

export const IrisTaskPanel: React.FC<IrisTaskPanelProps> = ({ open, onClose, task, projectPublicId, onUpdateField }) => {
	const theme = useTheme();
	const toast = useToast();
	const dispatch = useAppDispatch();
	const brand = '#8B7CF6';

	// Reuses TaskHistoryTimeline's already-fetched history (it dispatches fetchTaskHistory for
	// this same task as soon as the drawer opens) instead of firing a second request for the
	// same data -- IRIS-authored entries are just AuditLog comment rows with no author, same
	// convention used everywhere else in the drawer (CommentsSection, TaskHistoryTimeline).
	const taskHistory = useAppSelector((state) => state.projects.taskHistory);
	const irisActivity = taskHistory
		.filter((h) => h.action === 'comment' && h.changed_by_user_id == null)
		// Display-only cutoff -- entries older than 2 days just drop off this "recent"
		// list; the underlying audit log rows are untouched and still show up in the
		// task's full history (TaskHistoryTimeline).
		.filter((h) => dayjs().diff(dayjs(h.changed_at), 'hour') < 48)
		.slice(0, 5);

	const [insights, setInsights] = useState<TaskInsight | null>(null);
	const [insightsLoading, setInsightsLoading] = useState(false);
	const [estimate, setEstimate] = useState<TaskEstimate | null>(null);
	const [estimateLoading, setEstimateLoading] = useState(false);

	const [message, setMessage] = useState('');
	const [preview, setPreview] = useState<IrisPreviewResponse | null>(null);
	const [previewing, setPreviewing] = useState(false);
	const [confirming, setConfirming] = useState(false);
	const [resultText, setResultText] = useState<string | null>(null);

	// Insights/estimate are cached per task (keyed by public_id) so opening and closing the
	// panel repeatedly shows the same numbers instead of asking the LLM fresh every time --
	// its output isn't perfectly deterministic, so re-fetching on every open produced a
	// different estimate each time. A cache entry is only replaced by an explicit refresh
	// (below) or after IRIS actually changes something about this task via confirm.
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
		setPreview(null);
		setResultText(null);
		setMessage('');
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

	const handleAsk = async (overrideText?: string) => {
		const text = (overrideText ?? message).trim();
		if (!text || previewing) return;
		setMessage(text);
		setPreviewing(true);
		setPreview(null);
		setResultText(null);
		try {
			const result = await projectService.previewIrisAction(task.public_id, text);
			setPreview(result);
		} catch (error: any) {
			toast.error(error?.response?.data?.error?.message || 'IRIS could not plan that action.');
		} finally {
			setPreviewing(false);
		}
	};

	const handleConfirm = async () => {
		setConfirming(true);
		try {
			await dispatch(runIrisAction({ taskPublicId: task.public_id, projectPublicId, message: message.trim() })).unwrap();
			setResultText('Done — see the task and its comment history for what changed.');
			setPreview(null);
			setMessage('');
			// IRIS may have just changed the fields insights/estimate are based on -- the cached
			// reads are stale now, force a fresh one instead of waiting for the next open.
			// Sequential for the same reason as the initial load: avoid a double concurrent
			// LLM call right on top of the action that was just run.
			await loadInsights(task.public_id, true);
			await loadEstimate(task.public_id, true);
		} catch (error: any) {
			toast.error(typeof error === 'string' ? error : 'IRIS could not complete that action.');
		} finally {
			setConfirming(false);
		}
	};

	const handleApplyEstimate = async () => {
		if (estimate?.estimated_hours == null) return;
		await onUpdateField({ estimated_hours: estimate.estimated_hours });
		toast.success(`Estimate set to ${estimate.estimated_hours}h`);
	};

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
				{/* Header */}
				<Box sx={{ position: 'relative' }}>
					<Box sx={{ height: 3, background: theme.gradients?.brandDiagonal }} />
					<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
						<Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
							<Box
								sx={{
									width: 34,
									height: 34,
									borderRadius: '9px',
									background: theme.gradients?.brandDiagonal,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									flexShrink: 0,
									boxShadow: `0 2px 10px ${alpha(brand, 0.4)}`,
								}}
							>
								<AutoAwesome sx={{ fontSize: 18, color: '#fff' }} />
							</Box>
							<Box sx={{ minWidth: 0 }}>
								<Stack direction="row" alignItems="center" spacing={0.75}>
									<Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.1 }}>IRIS</Typography>
									<Chip label="AI co-worker" size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha(brand, 0.12), color: brand, '& .MuiChip-label': { px: 0.75 } }} />
								</Stack>
								<Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }} noWrap>
									{task.title}
								</Typography>
							</Box>
						</Stack>
						<IconButton size="small" onClick={onClose}>
							<CloseOutlined fontSize="small" />
						</IconButton>
					</Stack>
				</Box>

				<Box sx={{ flex: 1, overflowY: 'auto', p: 2.25, display: 'flex', flexDirection: 'column', gap: 2 }}>
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

					{/* Ask IRIS — propose then confirm */}
					<Box sx={{ mt: 0.5 }}>
						<Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.5 }}>
							<ChatBubbleOutlineRounded sx={{ fontSize: 15, color: brand }} />
							<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Ask IRIS</Typography>
						</Stack>
						<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.25, lineHeight: 1.5 }}>
							Nothing changes until you confirm — IRIS always shows its plan first.
						</Typography>

						{resultText && (
							<Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1.5, p: 1, borderRadius: '8px', bgcolor: alpha(theme.palette.success.main, 0.1) }}>
								<CheckCircleOutlineRounded sx={{ fontSize: 16, color: 'success.main' }} />
								<Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'success.main', fontWeight: 600 }}>{resultText}</Typography>
							</Stack>
						)}

						{preview ? (
							<Stack
								spacing={1.25}
								sx={{ p: 1.75, borderRadius: '12px', border: '1px solid', borderColor: alpha(brand, 0.35), bgcolor: alpha(brand, 0.05) }}
							>
								<Stack direction="row" spacing={0.75} alignItems="center">
									<AutoAwesome sx={{ fontSize: 15, color: brand }} />
									<Typography variant="caption" sx={{ fontWeight: 700, color: brand, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
										IRIS proposes
									</Typography>
								</Stack>
								{preview.response_to_user && (
									<Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{preview.response_to_user}</Typography>
								)}
								{preview.steps.length > 0 && (
									<Stack spacing={0.6}>
										{preview.steps.map((step, i) => (
											<Stack key={i} direction="row" spacing={0.75} alignItems="flex-start">
												<CheckOutlined sx={{ fontSize: 13, color: 'text.secondary', mt: 0.25, flexShrink: 0 }} />
												<Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
													{describeStep(step.tool_name, step.parameters)}
												</Typography>
											</Stack>
										))}
									</Stack>
								)}
								<Stack direction="row" spacing={1} sx={{ pt: 0.5 }}>
									<Button
										size="small"
										variant="contained"
										startIcon={confirming ? <CircularProgress size={13} sx={{ color: '#fff' }} /> : <CheckOutlined sx={{ fontSize: 15 }} />}
										onClick={handleConfirm}
										disabled={confirming}
										sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', bgcolor: brand, boxShadow: 'none', '&:hover': { bgcolor: '#7a6ae0', boxShadow: 'none' } }}
									>
										{confirming ? 'Working…' : 'Confirm'}
									</Button>
									<Button size="small" variant="text" onClick={() => setPreview(null)} disabled={confirming} sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}>
										Cancel
									</Button>
								</Stack>
							</Stack>
						) : (
							<>
								<Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 1.25 }}>
									{QUICK_ACTIONS.map((qa) => (
										<Chip
											key={qa.label}
											icon={qa.icon as any}
											label={qa.label}
											size="small"
											onClick={() => handleAsk(qa.message)}
											disabled={previewing}
											sx={{
												fontSize: '0.72rem',
												fontWeight: 600,
												borderRadius: '8px',
												bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
												border: '1px solid',
												borderColor: 'divider',
												'& .MuiChip-icon': { color: brand, ml: 0.75 },
												'&:hover': { bgcolor: alpha(brand, 0.08), borderColor: alpha(brand, 0.3) },
											}}
										/>
									))}
								</Stack>
								<Stack direction="row" spacing={1}>
									<TextField
										fullWidth
										size="small"
										placeholder="e.g. mark this high priority and set estimate to 4 hours"
										value={message}
										onChange={(e) => setMessage(e.target.value)}
										onKeyDown={(e) => { if (e.key === 'Enter') handleAsk(); }}
										disabled={previewing}
										sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
									/>
									<IconButton
										onClick={() => handleAsk()}
										disabled={previewing || !message.trim()}
										sx={{
											bgcolor: message.trim() ? brand : 'action.disabledBackground',
											color: '#fff',
											'&:hover': { bgcolor: '#7a6ae0' },
											'&.Mui-disabled': { color: 'action.disabled' },
										}}
									>
										{previewing ? <CircularProgress size={18} sx={{ color: 'inherit' }} /> : <SendRounded fontSize="small" />}
									</IconButton>
								</Stack>
							</>
						)}
				</Box>

				{/* Recent IRIS activity -- what it's already done on this task, so the panel
				    doesn't feel stateless every time it's reopened. */}
				<Box sx={{ mt: 0.5 }}>
					<Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1 }}>
						<HistoryRounded sx={{ fontSize: 15, color: 'text.secondary' }} />
						<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Recent activity</Typography>
					</Stack>
					{irisActivity.length > 0 ? (
						<Stack spacing={0}>
							{irisActivity.map((h, i) => (
								<Stack
									key={h.id}
									direction="row"
									spacing={1.25}
									alignItems="flex-start"
									sx={{
										py: 1,
										borderBottom: i < irisActivity.length - 1 ? '1px solid' : 'none',
										borderColor: 'divider',
									}}
								>
									<Box
										sx={{
											width: 22,
											height: 22,
											borderRadius: '6px',
											bgcolor: alpha(brand, 0.12),
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											flexShrink: 0,
											mt: 0.15,
										}}
									>
										<AutoAwesome sx={{ fontSize: 12, color: brand }} />
									</Box>
									<Box sx={{ minWidth: 0, flex: 1 }}>
										<Typography
											variant="body2"
											sx={{
												fontSize: '0.8rem',
												color: 'text.primary',
												display: '-webkit-box',
												WebkitLineClamp: 3,
												WebkitBoxOrient: 'vertical',
												overflow: 'hidden',
											}}
										>
											{(h.new_value || '').replace(/^⚠️\s*/, '')}
										</Typography>
										<Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.68rem' }}>
											{dayjs(h.changed_at).fromNow()}
										</Typography>
									</Box>
								</Stack>
							))}
						</Stack>
					) : (
						<Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
							No IRIS activity on this task yet — actions you confirm above will show up here.
						</Typography>
					)}
				</Box>
			</Box>
		</Box>
	</Drawer>
	);
};

export default IrisTaskPanel;
