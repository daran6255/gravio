import React, { useEffect, useRef, useState } from 'react';
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
	Tooltip,
	Divider,
} from '@mui/material';
import {
	CloseOutlined,
	AutoAwesome,
	SendRounded,
	CheckOutlined,
	HistoryRounded,
	AddCircleOutlineRounded,
	DeleteOutlineRounded,
	ArrowBackRounded,
	WarningAmberRounded,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useAIChat } from '../../../hooks/useAIChat';

dayjs.extend(relativeTime);

interface ChatDrawerProps {
	open: boolean;
	onClose: () => void;
}

const BRAND = '#8B7CF6';

export const ChatDrawer: React.FC<ChatDrawerProps> = ({ open, onClose }) => {
	const theme = useTheme();
	const [input, setInput] = useState('');
	const [showSessions, setShowSessions] = useState(false);
	const [rejectReason, setRejectReason] = useState('');
	const [showRejectReason, setShowRejectReason] = useState(false);
	const scrollRef = useRef<HTMLDivElement | null>(null);

	const {
		sessions,
		loadingSessions,
		activeSessionId,
		messages,
		loadingMessages,
		sending,
		statusLabel,
		pendingApproval,
		deciding,
		openSession,
		startNewSession,
		removeSession,
		sendMessage,
		approve,
		reject,
	} = useAIChat(open);

	useEffect(() => {
		scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
	}, [messages, statusLabel, pendingApproval]);

	const handleSend = () => {
		const text = input.trim();
		if (!text) return;
		setInput('');
		setShowSessions(false);
		sendMessage(text);
	};

	const handleReject = () => {
		reject(rejectReason.trim() || undefined);
		setRejectReason('');
		setShowRejectReason(false);
	};

	const activeSession = sessions.find((s) => s.id === activeSessionId);

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
					// color regardless of light/dark mode -- override back to real theme colors,
					// same as every other drawer in the app (IrisTaskPanel, ProjectTaskDetailDrawer).
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
							{showSessions ? (
								<IconButton size="small" onClick={() => setShowSessions(false)}>
									<ArrowBackRounded fontSize="small" />
								</IconButton>
							) : (
								<Box
									sx={{
										width: 34, height: 34, borderRadius: '9px',
										background: theme.gradients?.brandDiagonal,
										display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
										boxShadow: `0 2px 10px ${alpha(BRAND, 0.4)}`,
									}}
								>
									<AutoAwesome sx={{ fontSize: 18, color: '#fff' }} />
								</Box>
							)}
							<Box sx={{ minWidth: 0 }}>
								<Stack direction="row" alignItems="center" spacing={0.75}>
									<Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
										{showSessions ? 'Conversations' : 'IRIS'}
									</Typography>
									{!showSessions && (
										<Chip label="AI co-worker" size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha(BRAND, 0.12), color: BRAND, '& .MuiChip-label': { px: 0.75 } }} />
									)}
								</Stack>
								{!showSessions && (
									<Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }} noWrap>
										{activeSession?.title || 'New conversation'}
									</Typography>
								)}
							</Box>
						</Stack>
						<Stack direction="row" alignItems="center" spacing={0.25}>
							{!showSessions && (
								<>
									<Tooltip title="New chat">
										<IconButton size="small" onClick={startNewSession}>
											<AddCircleOutlineRounded fontSize="small" />
										</IconButton>
									</Tooltip>
									<Tooltip title="Past conversations">
										<IconButton size="small" onClick={() => setShowSessions(true)}>
											<HistoryRounded fontSize="small" />
										</IconButton>
									</Tooltip>
								</>
							)}
							<IconButton size="small" onClick={onClose}>
								<CloseOutlined fontSize="small" />
							</IconButton>
						</Stack>
					</Stack>
				</Box>

				{showSessions ? (
					<Box sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
						{loadingSessions ? (
							<Stack alignItems="center" sx={{ py: 4 }}>
								<CircularProgress size={22} />
							</Stack>
						) : sessions.length === 0 ? (
							<Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
								No conversations yet -- send a message to start one.
							</Typography>
						) : (
							<Stack spacing={0.5}>
								{sessions.map((s) => (
									<Paper
										key={s.id}
										elevation={0}
										onClick={() => { openSession(s.id); setShowSessions(false); }}
										sx={{
											p: 1.25,
											borderRadius: '10px',
											border: '1px solid',
											borderColor: s.id === activeSessionId ? alpha(BRAND, 0.4) : 'divider',
											bgcolor: s.id === activeSessionId ? alpha(BRAND, 0.06) : 'transparent',
											cursor: 'pointer',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'space-between',
											gap: 1,
											'&:hover': { bgcolor: alpha(BRAND, 0.06) },
										}}
									>
										<Box sx={{ minWidth: 0 }}>
											<Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }} noWrap>{s.title}</Typography>
											<Typography variant="caption" color="text.secondary">{dayjs(s.created_at).fromNow()}</Typography>
										</Box>
										<IconButton
											size="small"
											onClick={(e) => { e.stopPropagation(); removeSession(s.id); }}
											sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}
										>
											<DeleteOutlineRounded sx={{ fontSize: 16 }} />
										</IconButton>
									</Paper>
								))}
							</Stack>
						)}
					</Box>
				) : (
					<>
						<Box ref={scrollRef} sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
							{loadingMessages ? (
								<Stack alignItems="center" sx={{ py: 4 }}>
									<CircularProgress size={22} />
								</Stack>
							) : messages.length === 0 ? (
								<Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
									Ask IRIS anything -- it can look things up or take action across your workspace.
								</Typography>
							) : (
								messages.map((m) => (
									<Box
										key={m.id}
										sx={{
											alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
											maxWidth: '85%',
										}}
									>
										<Paper
											elevation={0}
											sx={{
												p: 1.25,
												borderRadius: '12px',
												bgcolor: m.role === 'user' ? BRAND : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.035)'),
												color: m.role === 'user' ? '#fff' : 'text.primary',
												border: m.role === 'user' ? 'none' : '1px solid',
												borderColor: 'divider',
											}}
										>
											<Typography variant="body2" sx={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
												{m.content}
												{m.streaming && !m.content && (
													<CircularProgress size={12} sx={{ color: 'inherit', ml: 0.5 }} />
												)}
											</Typography>
										</Paper>
									</Box>
								))
							)}

							{statusLabel && (
								<Stack direction="row" spacing={0.75} alignItems="center" sx={{ alignSelf: 'flex-start', px: 0.5 }}>
									<CircularProgress size={12} sx={{ color: BRAND }} />
									<Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>{statusLabel}</Typography>
								</Stack>
							)}

							{pendingApproval && (
								<Paper
									elevation={0}
									sx={{
										p: 1.75,
										borderRadius: '12px',
										border: '1px solid',
										borderColor: alpha(theme.palette.warning.main, 0.4),
										bgcolor: alpha(theme.palette.warning.main, 0.08),
										alignSelf: 'stretch',
									}}
								>
									<Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
										<WarningAmberRounded sx={{ fontSize: 16, color: 'warning.main' }} />
										<Typography variant="caption" sx={{ fontWeight: 700, color: 'warning.main', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
											Needs your approval
										</Typography>
									</Stack>

									{showRejectReason ? (
										<Stack spacing={1}>
											<TextField
												autoFocus
												size="small"
												placeholder="Optional reason for rejecting…"
												value={rejectReason}
												onChange={(e) => setRejectReason(e.target.value)}
												disabled={deciding}
												fullWidth
											/>
											<Stack direction="row" spacing={1}>
												<Button
													size="small"
													variant="contained"
													color="error"
													onClick={handleReject}
													disabled={deciding}
													startIcon={deciding ? <CircularProgress size={13} sx={{ color: '#fff' }} /> : undefined}
													sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
												>
													Confirm reject
												</Button>
												<Button size="small" variant="text" onClick={() => setShowRejectReason(false)} disabled={deciding} sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}>
													Back
												</Button>
											</Stack>
										</Stack>
									) : (
										<Stack direction="row" spacing={1}>
											<Button
												size="small"
												variant="contained"
												startIcon={deciding ? <CircularProgress size={13} sx={{ color: '#fff' }} /> : <CheckOutlined sx={{ fontSize: 15 }} />}
												onClick={() => approve()}
												disabled={deciding}
												sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', bgcolor: BRAND, boxShadow: 'none', '&:hover': { bgcolor: '#7a6ae0', boxShadow: 'none' } }}
											>
												{deciding ? 'Working…' : 'Approve'}
											</Button>
											<Button
												size="small"
												variant="outlined"
												color="error"
												onClick={() => setShowRejectReason(true)}
												disabled={deciding}
												sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
											>
												Reject
											</Button>
										</Stack>
									)}
								</Paper>
							)}
						</Box>

						<Divider />
						<Stack direction="row" spacing={1} sx={{ p: 2 }}>
							<TextField
								fullWidth
								size="small"
								placeholder={pendingApproval ? 'Waiting for your decision above…' : 'Message IRIS…'}
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
								disabled={sending || !!pendingApproval}
								multiline
								maxRows={4}
								sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
							/>
							<IconButton
								onClick={handleSend}
								disabled={sending || !!pendingApproval || !input.trim()}
								sx={{
									bgcolor: input.trim() ? BRAND : 'action.disabledBackground',
									color: '#fff',
									alignSelf: 'flex-end',
									'&:hover': { bgcolor: '#7a6ae0' },
									'&.Mui-disabled': { color: 'action.disabled' },
								}}
							>
								{sending ? <CircularProgress size={18} sx={{ color: 'inherit' }} /> : <SendRounded fontSize="small" />}
							</IconButton>
						</Stack>
					</>
				)}
			</Box>
		</Drawer>
	);
};

export default ChatDrawer;
