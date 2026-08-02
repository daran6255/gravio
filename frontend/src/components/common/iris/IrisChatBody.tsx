import React from 'react';
import {
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
	Fade,
} from '@mui/material';
import {
	SendRounded,
	CheckOutlined,
	DeleteOutlineRounded,
	WarningAmberRounded,
	KeyboardArrowDownRounded,
	AutoAwesome,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import EnterpriseAvatar from '../avatar/Avatar';
import { TypingDots } from './TypingDots';
import { StatusLabel } from './StatusLabel';
import { MarkdownMessage } from './MarkdownMessage';
import type { IrisChatPanel } from './useIrisChatPanel';

dayjs.extend(relativeTime);

const BRAND = '#8B7CF6';

export interface IrisQuickAction {
	label: string;
	icon: React.ReactNode;
	message: string;
}

interface IrisChatBodyProps {
	panel: IrisChatPanel;
	quickActions: IrisQuickAction[];
	emptyGreeting?: string;
	emptySubtitle?: string;
}

/** The header-less, Drawer-less scrollable content shared by every IRIS chat surface --
 * session-history list, message thread (empty state / bubbles / thinking row / approval
 * card), scroll-to-latest, and the input bar. Driven entirely by `useIrisChatPanel`'s output
 * so IrisContextPanel (wraps this in a Drawer + IrisPanelHeader) and IrisTaskPanel (embeds
 * this below its own Insights/Estimate sections) render byte-for-byte the same experience. */
export const IrisChatBody: React.FC<IrisChatBodyProps> = ({
	panel,
	quickActions,
	emptyGreeting = "Hi, I'm IRIS 👋",
	emptySubtitle = 'Ask me to look something up or take action across your workspace.',
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const {
		reducedMotion, userName, activeSessionId, groupedSessions,
		loadingSessions, sessions, removeSession,
		loadingMessages, messages, statusLabel, pendingApproval, deciding, sending,
		input, setInput,
		showSessions,
		rejectReason, setRejectReason, showRejectReason, setShowRejectReason,
		showScrollButton, scrollRef, scrollToBottom, handleScroll,
		handleSend, handleApprove, handleReject, handleOpenSession,
	} = panel;

	if (showSessions) {
		return (
			<Box sx={{ flex: 1, overflowY: 'auto', p: 1.75 }}>
				{loadingSessions ? (
					<Stack alignItems="center" sx={{ py: 4 }}>
						<CircularProgress size={22} />
					</Stack>
				) : sessions.length === 0 ? (
					<Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
						No conversations yet -- send a message to start one.
					</Typography>
				) : (
					<Stack spacing={2}>
						{groupedSessions.map((group) => (
							<Box key={group.label}>
								<Typography
									variant="caption"
									sx={{ display: 'block', fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem', mb: 0.75, px: 0.5 }}
								>
									{group.label}
								</Typography>
								<Stack spacing={0.75}>
									{group.items.map((s) => (
										<Paper
											key={s.id}
											elevation={0}
											onClick={() => handleOpenSession(s.id)}
											sx={{
												p: 1.5,
												borderRadius: '12px',
												border: '1px solid',
												borderColor: s.id === activeSessionId ? alpha(BRAND, 0.4) : 'divider',
												bgcolor: s.id === activeSessionId ? alpha(BRAND, 0.07) : 'transparent',
												cursor: 'pointer',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
												gap: 1,
												transition: reducedMotion ? 'none' : 'background-color 150ms ease, border-color 150ms ease',
												'&:hover': {
													bgcolor: s.id === activeSessionId ? alpha(BRAND, 0.09) : (isDark ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.025)'),
													borderColor: alpha(BRAND, 0.3),
												},
												'&:hover .chat-session-delete': { opacity: 1 },
											}}
										>
											<Box sx={{ minWidth: 0 }}>
												<Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.86rem' }} noWrap>{s.title}</Typography>
												<Typography variant="caption" color="text.secondary">{dayjs(s.created_at).fromNow()}</Typography>
											</Box>
											<IconButton
												size="small"
												className="chat-session-delete"
												onClick={(e) => { e.stopPropagation(); removeSession(s.id); }}
												sx={{
													color: 'text.disabled',
													opacity: 0.4,
													transition: reducedMotion ? 'none' : 'opacity 150ms ease',
													'&:hover': { color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.08), opacity: 1 },
												}}
											>
												<DeleteOutlineRounded sx={{ fontSize: 16 }} />
											</IconButton>
										</Paper>
									))}
								</Stack>
							</Box>
						))}
					</Stack>
				)}
			</Box>
		);
	}

	return (
		<>
			<Box sx={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
				<Box ref={scrollRef} onScroll={handleScroll} sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
					{loadingMessages ? (
						<Stack alignItems="center" sx={{ py: 4 }}>
							<CircularProgress size={22} />
						</Stack>
					) : messages.length === 0 ? (
						<Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', px: 1, py: 4, gap: 2.5 }}>
							<Box
								sx={{
									width: 56,
									height: 56,
									borderRadius: '16px',
									background: theme.gradients?.brandDiagonal,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									boxShadow: `0 8px 24px -6px ${alpha(BRAND, 0.5)}`,
								}}
							>
								<AutoAwesome sx={{ fontSize: 26, color: '#fff' }} />
							</Box>
							<Box>
								<Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>{emptyGreeting}</Typography>
								<Typography variant="body2" color="text.secondary" sx={{ maxWidth: 280, mx: 'auto' }}>
									{emptySubtitle}
								</Typography>
							</Box>
							<Stack direction="row" flexWrap="wrap" justifyContent="center" gap={0.75} sx={{ maxWidth: 320 }}>
								{quickActions.map((qa) => (
									<Chip
										key={qa.label}
										icon={qa.icon as any}
										label={qa.label}
										size="small"
										onClick={() => handleSend(qa.message)}
										sx={{
											fontSize: '0.72rem',
											fontWeight: 600,
											borderRadius: '8px',
											bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
											border: '1px solid',
											borderColor: 'divider',
											'& .MuiChip-icon': { color: BRAND, ml: 0.75 },
											'&:hover': { bgcolor: alpha(BRAND, 0.08), borderColor: alpha(BRAND, 0.3) },
										}}
									/>
								))}
							</Stack>
						</Box>
					) : (
						messages.map((m) => {
							const isUser = m.role === 'user';
							return (
								<Stack
									key={m.id}
									direction={isUser ? 'row-reverse' : 'row'}
									spacing={1}
									alignItems="flex-end"
									sx={{ alignSelf: isUser ? 'flex-end' : 'flex-start', maxWidth: '90%' }}
								>
									{isUser ? (
										<EnterpriseAvatar name={userName} size={26} sx={{ flexShrink: 0, mb: 0.25 }} />
									) : (
										<Box
											sx={{
												width: 26,
												height: 26,
												borderRadius: '8px',
												background: theme.gradients?.brandDiagonal,
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												flexShrink: 0,
												mb: 0.25,
											}}
										>
											<AutoAwesome sx={{ fontSize: 14, color: '#fff' }} />
										</Box>
									)}
									<Paper
										elevation={0}
										sx={{
											p: 1.25,
											borderRadius: '14px',
											minWidth: 0,
											...(isUser
												? { background: theme.gradients?.brandDiagonal, boxShadow: `0 3px 10px -3px ${alpha(BRAND, 0.45)}` }
												: {
													bgcolor: isDark ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.03)',
													border: '1px solid',
													borderColor: 'divider',
													boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.05)' : 'inset 0 1px 0 rgba(255,255,255,0.6)',
												}),
											color: isUser ? '#fff' : 'text.primary',
										}}
									>
										{isUser ? (
											<Typography variant="body2" sx={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
												{m.content}
											</Typography>
										) : m.streaming && !m.content ? (
											<TypingDots />
										) : (
											<MarkdownMessage content={m.content} />
										)}
									</Paper>
								</Stack>
							);
						})
					)}

					{statusLabel && (
						<Stack direction="row" spacing={1} alignItems="center" sx={{ alignSelf: 'flex-start', pl: 0.25 }}>
							<Box
								sx={{
									width: 26,
									height: 26,
									borderRadius: '8px',
									background: theme.gradients?.brandDiagonal,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									flexShrink: 0,
									opacity: 0.85,
								}}
							>
								<AutoAwesome sx={{ fontSize: 14, color: '#fff' }} />
							</Box>
							<Stack
								direction="row"
								spacing={0.75}
								alignItems="center"
								sx={{ px: 1.25, py: 0.5, borderRadius: '10px', bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: '1px solid', borderColor: 'divider' }}
							>
								<TypingDots />
								<StatusLabel label={statusLabel} />
							</Stack>
						</Stack>
					)}

					{pendingApproval && (
						<Paper
							elevation={0}
							sx={{
								p: 2,
								borderRadius: '14px',
								border: '1px solid',
								borderColor: alpha(theme.palette.warning.main, 0.35),
								borderLeft: '4px solid',
								borderLeftColor: 'warning.main',
								background: isDark
									? `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.14)} 0%, ${alpha(theme.palette.warning.main, 0.04)} 100%)`
									: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.02)} 100%)`,
								boxShadow: isDark ? '0 4px 16px -6px rgba(0,0,0,0.4)' : '0 4px 16px -6px rgba(0,0,0,0.1)',
								alignSelf: 'stretch',
							}}
						>
							<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.75 }}>
								<Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: alpha(theme.palette.warning.main, 0.18), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
									<WarningAmberRounded sx={{ fontSize: 16, color: 'warning.main' }} />
								</Box>
								<Typography variant="caption" sx={{ fontWeight: 800, color: 'warning.main', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem' }}>
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
								<Stack direction="row" spacing={1.25}>
									<Button
										size="small"
										variant="contained"
										startIcon={deciding ? <CircularProgress size={13} sx={{ color: '#fff' }} /> : <CheckOutlined sx={{ fontSize: 15 }} />}
										onClick={() => handleApprove()}
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

				<Fade in={showScrollButton} timeout={reducedMotion ? 0 : 200}>
					<IconButton
						onClick={() => scrollToBottom(true)}
						sx={{
							position: 'absolute',
							bottom: 12,
							left: '50%',
							transform: 'translateX(-50%)',
							bgcolor: theme.palette.background.paper,
							border: '1px solid',
							borderColor: 'divider',
							boxShadow: 3,
							'&:hover': { bgcolor: 'action.hover' },
						}}
					>
						<KeyboardArrowDownRounded />
					</IconButton>
				</Fade>
			</Box>

			<Box sx={{ borderTop: '1px solid', borderColor: 'divider', p: 2 }}>
				<Paper
					elevation={0}
					sx={{
						display: 'flex',
						alignItems: 'flex-end',
						gap: 1,
						p: 0.75,
						pl: 1.75,
						borderRadius: '16px',
						border: '1px solid',
						borderColor: 'divider',
						bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
						transition: reducedMotion ? 'none' : 'border-color 150ms ease',
						'&:focus-within': { borderColor: alpha(BRAND, 0.5) },
					}}
				>
					<TextField
						fullWidth
						variant="standard"
						placeholder={pendingApproval ? 'Waiting for your decision above…' : 'Message IRIS…'}
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
						disabled={sending || !!pendingApproval}
						multiline
						maxRows={4}
						InputProps={{ disableUnderline: true }}
						sx={{ '& .MuiInputBase-root': { fontSize: '0.875rem', py: 0.75 } }}
					/>
					<IconButton
						onClick={() => handleSend()}
						disabled={sending || !!pendingApproval || !input.trim()}
						sx={{
							bgcolor: input.trim() ? BRAND : 'action.disabledBackground',
							color: '#fff',
							mb: 0.25,
							'&:hover': { bgcolor: '#7a6ae0' },
							'&.Mui-disabled': { color: 'action.disabled' },
						}}
					>
						{sending ? <CircularProgress size={18} sx={{ color: 'inherit' }} /> : <SendRounded fontSize="small" />}
					</IconButton>
				</Paper>
			</Box>
		</>
	);
};

export default IrisChatBody;
