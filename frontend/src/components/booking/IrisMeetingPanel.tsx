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
	AutoAwesome,
	SendRounded,
	CheckOutlined,
	CheckCircleOutlineRounded,
	HistoryRounded,
	ChatBubbleOutlineRounded,
	FreeBreakfastOutlined,
	CalendarViewWeekOutlined,
	UpdateOutlined,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import bookingService from '../../services/bookingService';
import type { IrisPreviewResponse, IrisActivityEntry } from '../../models/iris';
import useToast from '../../hooks/useToast';
import IrisPanelHeader from '../common/iris/IrisPanelHeader';

dayjs.extend(relativeTime);

interface IrisMeetingPanelProps {
	open: boolean;
	onClose: () => void;
	onActionConfirmed?: () => void;
}

const QUICK_ACTIONS: { label: string; icon: React.ReactNode; message: string }[] = [
	{ label: 'Find me a free slot tomorrow', icon: <FreeBreakfastOutlined sx={{ fontSize: 15 }} />, message: 'When am I free tomorrow?' },
	{ label: "What's on my calendar this week", icon: <CalendarViewWeekOutlined sx={{ fontSize: 15 }} />, message: "What's on my calendar this week?" },
	{ label: 'Reschedule my next meeting', icon: <UpdateOutlined sx={{ fontSize: 15 }} />, message: 'I need to reschedule my next meeting.' },
];

const describeStep = (toolName: string, parameters: Record<string, any>): string => {
	switch (toolName) {
		case 'find_available_slots':
			return `Check open slots on ${parameters?.target_date ?? 'the given day'}`;
		case 'list_my_meetings':
			return 'Look up your scheduled meetings';
		case 'schedule_meeting':
			return `Schedule a meeting with ${parameters?.client_name ?? 'someone'}`;
		case 'cancel_meeting':
			return 'Cancel a meeting';
		case 'reschedule_meeting':
			return `Reschedule a meeting to ${parameters?.new_start_time ?? 'a new time'}`;
		default:
			return toolName.replace(/_/g, ' ');
	}
};

export const IrisMeetingPanel: React.FC<IrisMeetingPanelProps> = ({ open, onClose, onActionConfirmed }) => {
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
			const result = await bookingService.getIrisActivity();
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
			const result = await bookingService.previewIrisAction(text);
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
			await bookingService.executeIrisAction(message.trim());
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
				<IrisPanelHeader subtitle="Meetings assistant" onClose={onClose} />

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
							<Stack spacing={1.25} sx={{ p: 1.75, borderRadius: '12px', border: '1px solid', borderColor: alpha(brand, 0.35), bgcolor: alpha(brand, 0.05), boxShadow: theme.palette.mode === 'dark' ? '0 4px 16px -8px rgba(0,0,0,0.5)' : '0 4px 16px -8px rgba(0,0,0,0.12)' }}>
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
										placeholder="e.g. book a 30-minute call with Jane tomorrow at 3pm"
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

export default IrisMeetingPanel;
