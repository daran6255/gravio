import React, { useState, useEffect, useCallback } from 'react';
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
	Paper,
	useTheme,
	alpha,
} from '@mui/material';
import {
	CloseOutlined,
	AutoAwesome,
	SendRounded,
	CheckOutlined,
	CheckCircleOutlineRounded,
	HistoryRounded,
	ChatBubbleOutlineRounded,
	TodayOutlined,
	CalendarViewWeekOutlined,
	TaskAltOutlined,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import timesheetService from '../../services/timesheetService';
import type { IrisPreviewResponse, IrisActivityEntry } from '../../models/iris';
import useToast from '../../hooks/useToast';

dayjs.extend(relativeTime);

interface IrisTimesheetPanelProps {
	open: boolean;
	onClose: () => void;
	onActionConfirmed?: () => void;
}

// One-click starting points -- each fills the input with a concrete instruction and previews
// it right away (nothing runs until Confirm, same as typing it out by hand).
const QUICK_ACTIONS: { label: string; icon: React.ReactNode; message: string }[] = [
	{ label: "Log today's hours", icon: <TodayOutlined sx={{ fontSize: 15 }} />, message: 'Log my hours for today.' },
	{ label: 'Show my week', icon: <CalendarViewWeekOutlined sx={{ fontSize: 15 }} />, message: 'Show me what I logged this week.' },
	{ label: 'Submit this week', icon: <TaskAltOutlined sx={{ fontSize: 15 }} />, message: "Submit this week's timesheet." },
];

// Turns a planned tool call into one plain-language line for the confirm card -- the raw
// tool_name/parameters shape means nothing to a non-technical user reading a proposal.
const describeStep = (toolName: string, parameters: Record<string, any>): string => {
	switch (toolName) {
		case 'log_time': {
			const target = parameters?.project || parameters?.category || 'general time';
			return `Log ${parameters?.hours ?? '?'}h on ${target} for ${parameters?.log_date ?? 'the given date'}`;
		}
		case 'list_my_time_logs':
			return `Look up logged hours from ${parameters?.start_date} to ${parameters?.end_date}`;
		case 'update_time_log':
			return `Update the ${parameters?.log_date ?? ''} entry`.trim();
		case 'delete_time_log':
			return `Delete the ${parameters?.log_date ?? ''} entry`.trim();
		case 'submit_weekly_timesheet':
			return `Submit the week of ${parameters?.week_start_date} for approval`;
		case 'request_week_unlock':
			return `Request an unlock for the week of ${parameters?.week_start_date}`;
		default:
			return toolName.replace(/_/g, ' ');
	}
};

export const IrisTimesheetPanel: React.FC<IrisTimesheetPanelProps> = ({ open, onClose, onActionConfirmed }) => {
	const theme = useTheme();
	const toast = useToast();
	const brand = '#8B7CF6';

	const [activity, setActivity] = useState<IrisActivityEntry[]>([]);
	const [activityLoading, setActivityLoading] = useState(false);

	const [message, setMessage] = useState('');
	const [preview, setPreview] = useState<IrisPreviewResponse | null>(null);
	const [previewing, setPreviewing] = useState(false);
	const [confirming, setConfirming] = useState(false);
	const [resultText, setResultText] = useState<string | null>(null);
	const [followUp, setFollowUp] = useState('');

	const loadActivity = useCallback(async () => {
		setActivityLoading(true);
		try {
			const result = await timesheetService.getIrisActivity();
			setActivity(result);
		} catch {
			setActivity([]);
		} finally {
			setActivityLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!open) return;
		setPreview(null);
		setResultText(null);
		setMessage('');
		setFollowUp('');
		loadActivity();
	}, [open, loadActivity]);

	const handleAsk = async (overrideText?: string) => {
		const text = (overrideText ?? message).trim();
		if (!text || previewing) return;
		setMessage(text);
		setPreviewing(true);
		setPreview(null);
		setResultText(null);
		try {
			const result = await timesheetService.previewIrisAction(text);
			setPreview(result);
		} catch (error: any) {
			toast.error(error?.response?.data?.error?.message || 'IRIS could not plan that action.');
		} finally {
			setPreviewing(false);
		}
	};

	const handleClarify = async () => {
		const answer = followUp.trim();
		if (!answer || previewing) return;
		const question = preview?.response_to_user || 'Could you clarify?';
		setFollowUp('');
		await handleAsk(`${message}\n\nIRIS asked: "${question}"\nMy answer: ${answer}`);
	};

	const handleConfirm = async () => {
		setConfirming(true);
		try {
			await timesheetService.executeIrisAction(message.trim());
			setResultText('Done — see below for what changed.');
			setPreview(null);
			setMessage('');
			await loadActivity();
			onActionConfirmed?.();
		} catch (error: any) {
			toast.error(error?.response?.data?.error?.message || 'IRIS could not complete that action.');
		} finally {
			setConfirming(false);
		}
	};

	const needsClarification = !!preview && preview.steps.length === 0;

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
					width: { xs: '100%', sm: 420 },
					maxWidth: '100%',
					bgcolor: theme.palette.background.paper,
					color: theme.palette.text.primary,
					boxShadow: 'none',
				},
			}}
		>
			<Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
									Timesheet assistant
								</Typography>
							</Box>
						</Stack>
						<IconButton size="small" onClick={onClose}>
							<CloseOutlined fontSize="small" />
						</IconButton>
					</Stack>
				</Box>

				<Box sx={{ flex: 1, overflowY: 'auto', p: 2.25, display: 'flex', flexDirection: 'column', gap: 2 }}>
					<Paper elevation={0} sx={sectionCardSx}>
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
							<Stack spacing={1.25} sx={{ p: 1.75, borderRadius: '12px', border: '1px solid', borderColor: alpha(brand, 0.35), bgcolor: alpha(brand, 0.05) }}>
								<Stack direction="row" spacing={0.75} alignItems="center">
									<AutoAwesome sx={{ fontSize: 15, color: brand }} />
									<Typography variant="caption" sx={{ fontWeight: 700, color: brand, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
										{needsClarification ? 'IRIS needs more detail' : 'IRIS proposes'}
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
								{needsClarification ? (
									<Stack spacing={1} sx={{ pt: 0.5 }}>
										<Stack direction="row" spacing={1}>
											<TextField
												fullWidth
												autoFocus
												size="small"
												placeholder="Type your answer…"
												value={followUp}
												onChange={(e) => setFollowUp(e.target.value)}
												onKeyDown={(e) => { if (e.key === 'Enter') handleClarify(); }}
												disabled={previewing}
												sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: theme.palette.background.paper } }}
											/>
											<IconButton
												onClick={handleClarify}
												disabled={previewing || !followUp.trim()}
												sx={{
													bgcolor: followUp.trim() ? brand : 'action.disabledBackground',
													color: '#fff',
													'&:hover': { bgcolor: '#7a6ae0' },
													'&.Mui-disabled': { color: 'action.disabled' },
												}}
											>
												{previewing ? <CircularProgress size={18} sx={{ color: 'inherit' }} /> : <SendRounded fontSize="small" />}
											</IconButton>
										</Stack>
										<Button
											size="small"
											variant="text"
											onClick={() => { setPreview(null); setFollowUp(''); }}
											disabled={previewing}
											sx={{ alignSelf: 'flex-start', textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
										>
											Cancel
										</Button>
									</Stack>
								) : (
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
								)}
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
										placeholder="e.g. change yesterday's Project X entry to 3 hours"
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
					</Paper>

					<Box sx={{ mt: 0.5 }}>
						<Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1 }}>
							<HistoryRounded sx={{ fontSize: 15, color: 'text.secondary' }} />
							<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Recent activity</Typography>
						</Stack>
						{activityLoading ? (
							<Stack alignItems="center" sx={{ py: 2 }}>
								<CircularProgress size={20} />
							</Stack>
						) : activity.length > 0 ? (
							<Stack spacing={0}>
								{activity.map((h, i) => (
									<Stack
										key={h.id}
										direction="row"
										spacing={1.25}
										alignItems="flex-start"
										sx={{ py: 1, borderBottom: i < activity.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}
									>
										<Box sx={{ width: 22, height: 22, borderRadius: '6px', bgcolor: alpha(brand, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.15 }}>
											<AutoAwesome sx={{ fontSize: 12, color: brand }} />
										</Box>
										<Box sx={{ minWidth: 0, flex: 1 }}>
											<Typography
												variant="body2"
												sx={{ fontSize: '0.8rem', color: 'text.primary', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
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
								No IRIS activity yet — actions you confirm above will show up here.
							</Typography>
						)}
					</Box>
				</Box>
			</Box>
		</Drawer>
	);
};

export default IrisTimesheetPanel;
