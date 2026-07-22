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
	Divider,
	useTheme,
	alpha,
} from '@mui/material';
import { CloseOutlined, AutoAwesome, SendOutlined, CheckOutlined, RefreshOutlined } from '@mui/icons-material';
import { useAppDispatch } from '../../../../../store/hooks';
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

interface IrisTaskPanelProps {
	open: boolean;
	onClose: () => void;
	task: ProjectTask;
	projectPublicId: string;
	onUpdateField: (fields: ProjectTaskUpdate) => Promise<void>;
}

const HEALTH_COLOR: Record<string, string> = {
	on_track: '#2e7d32',
	at_risk: '#ed6c02',
	blocked: '#d32f2f',
};

const HEALTH_LABEL: Record<string, string> = {
	on_track: 'On track',
	at_risk: 'At risk',
	blocked: 'Blocked',
};

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
		} finally {
			setInsightsLoading(false);
		}
	}, []);

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
		} finally {
			setEstimateLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!open) return;
		setPreview(null);
		setResultText(null);
		setMessage('');
		// Sequential, not parallel -- firing both LLM calls at once doubles concurrent load on
		// the configured provider right as the panel opens, which is an easy way to trip a
		// per-second/per-minute rate limit on a constrained tier. Insights still renders as
		// soon as it's ready; estimate's own spinner just runs a beat longer.
		(async () => {
			await loadInsights(task.public_id);
			await loadEstimate(task.public_id);
		})();
		// Only re-run when the panel opens for a (possibly different) task -- not on every
		// keystroke/prop change while it's already open.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, task.public_id]);

	const handleAsk = async () => {
		if (!message.trim() || previewing) return;
		setPreviewing(true);
		setPreview(null);
		setResultText(null);
		try {
			const result = await projectService.previewIrisAction(task.public_id, message.trim());
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

	return (
		<Drawer
			anchor="right"
			open={open}
			onClose={onClose}
			PaperProps={{
				sx: {
					width: { xs: '100%', sm: 420 },
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
				<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
					<Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
						<Box
							sx={{
								width: 26,
								height: 26,
								borderRadius: '7px',
								background: theme.gradients?.brandDiagonal,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								flexShrink: 0,
							}}
						>
							<AutoAwesome sx={{ fontSize: 15, color: '#fff' }} />
						</Box>
						<Box sx={{ minWidth: 0 }}>
							<Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.1 }}>IRIS</Typography>
							<Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }} noWrap>
								{task.title}
							</Typography>
						</Box>
					</Stack>
					<IconButton size="small" onClick={onClose}>
						<CloseOutlined fontSize="small" />
					</IconButton>
				</Stack>

				<Box sx={{ flex: 1, overflowY: 'auto', p: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
					{/* Insights */}
					<Box>
						<Stack direction="row" alignItems="center" justifyContent="space-between">
							<Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: '0.06em' }}>
								Insights
							</Typography>
							<IconButton size="small" title="Get a fresh read" onClick={() => loadInsights(task.public_id, true)} disabled={insightsLoading}>
								<RefreshOutlined sx={{ fontSize: 15 }} />
							</IconButton>
						</Stack>
						{insightsLoading ? (
							<Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
								<CircularProgress size={14} />
								<Typography variant="caption" color="text.secondary">Reading the task…</Typography>
							</Stack>
						) : insights ? (
							<Stack spacing={1} sx={{ mt: 1 }}>
								<Chip
									size="small"
									label={HEALTH_LABEL[insights.health] || insights.health}
									sx={{
										alignSelf: 'flex-start',
										fontWeight: 700,
										color: HEALTH_COLOR[insights.health] || theme.palette.text.secondary,
										bgcolor: alpha(HEALTH_COLOR[insights.health] || theme.palette.text.secondary, 0.12),
									}}
								/>
								{insights.risk_reasons.map((reason, i) => (
									<Typography key={i} variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
										• {reason}
									</Typography>
								))}
								{insights.suggestions.map((s, i) => (
									<Typography key={i} variant="body2" sx={{ fontSize: '0.8rem', color: 'text.primary' }}>
										→ {s}
									</Typography>
								))}
							</Stack>
						) : (
							<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
								Couldn't read this task right now.
							</Typography>
						)}
					</Box>

					<Divider />

					{/* Estimate */}
					<Box>
						<Stack direction="row" alignItems="center" justifyContent="space-between">
							<Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: '0.06em' }}>
								Estimate
							</Typography>
							<IconButton size="small" title="Get a fresh estimate" onClick={() => loadEstimate(task.public_id, true)} disabled={estimateLoading}>
								<RefreshOutlined sx={{ fontSize: 15 }} />
							</IconButton>
						</Stack>
						{estimateLoading ? (
							<Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
								<CircularProgress size={14} />
								<Typography variant="caption" color="text.secondary">Comparing similar tasks…</Typography>
							</Stack>
						) : estimate?.estimated_hours != null ? (
							<Stack spacing={1} sx={{ mt: 1 }}>
								<Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
									IRIS suggests <strong>{estimate.estimated_hours}h</strong>
									{task.estimated_hours != null ? ` (currently ${task.estimated_hours}h)` : ''}
								</Typography>
								{estimate.rationale && (
									<Typography variant="caption" color="text.secondary">{estimate.rationale}</Typography>
								)}
								<Button size="small" variant="outlined" onClick={handleApplyEstimate} sx={{ alignSelf: 'flex-start' }}>
									Apply {estimate.estimated_hours}h
								</Button>
							</Stack>
						) : (
							<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
								Not enough data to suggest an estimate yet.
							</Typography>
						)}
					</Box>

					<Divider />

					{/* Ask IRIS — propose then confirm */}
					<Box>
						<Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: '0.06em' }}>
							Ask IRIS
						</Typography>
						<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, mb: 1 }}>
							Edit fields, break this into subtasks, or ask a question. IRIS shows you what it plans to do first — nothing changes until you confirm.
						</Typography>

						{resultText && (
							<Typography variant="body2" sx={{ mb: 1.5, color: 'success.main' }}>
								✓ {resultText}
							</Typography>
						)}

						{preview ? (
							<Stack
								spacing={1.25}
								sx={{ p: 1.5, borderRadius: '10px', border: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.primary.main, 0.04) }}
							>
								{preview.response_to_user && (
									<Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{preview.response_to_user}</Typography>
								)}
								{preview.steps.length > 0 && (
									<Stack spacing={0.5}>
										{preview.steps.map((step, i) => (
											<Typography key={i} variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
												• {describeStep(step.tool_name, step.parameters)}
											</Typography>
										))}
									</Stack>
								)}
								<Stack direction="row" spacing={1} sx={{ pt: 0.5 }}>
									<Button size="small" variant="contained" startIcon={<CheckOutlined />} onClick={handleConfirm} disabled={confirming}>
										{confirming ? 'Working…' : 'Confirm'}
									</Button>
									<Button size="small" variant="text" onClick={() => setPreview(null)} disabled={confirming}>
										Cancel
									</Button>
								</Stack>
							</Stack>
						) : (
							<Stack direction="row" spacing={1}>
								<TextField
									fullWidth
									size="small"
									placeholder="e.g. mark this high priority and set estimate to 4 hours"
									value={message}
									onChange={(e) => setMessage(e.target.value)}
									onKeyDown={(e) => { if (e.key === 'Enter') handleAsk(); }}
									disabled={previewing}
								/>
								<IconButton color="primary" onClick={handleAsk} disabled={previewing || !message.trim()}>
									{previewing ? <CircularProgress size={18} /> : <SendOutlined fontSize="small" />}
								</IconButton>
							</Stack>
						)}
					</Box>
				</Box>
			</Box>
		</Drawer>
	);
};

export default IrisTaskPanel;
