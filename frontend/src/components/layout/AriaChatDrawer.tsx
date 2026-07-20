import React, { useEffect, useRef, useState } from 'react';
import {
	Drawer,
	Box,
	Typography,
	IconButton,
	TextField,
	CircularProgress,
	Tooltip,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { Close, AutoAwesome, Send, AddCommentOutlined } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setAriaChatOpen } from '../../store/slices/uiSlice';
import { startAriaSession, sendAriaMessage } from '../../store/slices/aiSlice';
import useToast from '../../hooks/useToast';

const STATUS_LABEL: Record<string, string> = {
	planning: 'ARIA is thinking…',
	executing: 'Working on it…',
	typing: 'ARIA is replying…',
};

const AriaChatDrawer: React.FC = () => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const toast = useToast();
	const open = useAppSelector((state) => state.ui.ariaChatOpen);
	const { currentSessionId, messages, streaming, streamingStatus, streamingStatusMessage, streamingText, sendError } =
		useAppSelector((state) => state.ai);

	const [draft, setDraft] = useState('');
	const scrollRef = useRef<HTMLDivElement>(null);
	const lastError = useRef<string | null>(null);

	useEffect(() => {
		scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
	}, [messages.length, streamingText, streaming]);

	useEffect(() => {
		if (sendError && sendError !== lastError.current) {
			toast.error(sendError);
			lastError.current = sendError;
		}
	}, [sendError, toast]);

	const handleClose = () => dispatch(setAriaChatOpen(false));

	const handleSend = async () => {
		const content = draft.trim();
		if (!content || streaming) return;
		setDraft('');

		let sessionId = currentSessionId;
		if (!sessionId) {
			const result = await dispatch(startAriaSession(undefined));
			if (startAriaSession.rejected.match(result)) {
				toast.error((result.payload as string) || 'Failed to start a conversation with ARIA');
				return;
			}
			sessionId = result.payload.id;
		}

		dispatch(sendAriaMessage({ sessionId, content }));
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSend();
		}
	};

	const handleNewChat = () => {
		dispatch(startAriaSession(undefined));
	};

	return (
		<Drawer
			anchor="right"
			open={open}
			onClose={handleClose}
			PaperProps={{
				sx: {
					width: { xs: '100%', sm: 420 },
					bgcolor: theme.palette.background.default,
					color: theme.palette.text.primary,
					display: 'flex',
					flexDirection: 'column',
					boxShadow: 'none',
					borderLeft: `1px solid ${theme.palette.divider}`,
				},
			}}
		>
			{/* Header */}
			<Box
				sx={{
					p: 2.5,
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					bgcolor: theme.palette.background.paper,
					borderBottom: `1px solid ${theme.palette.divider}`,
					boxShadow: theme.shadows[1],
				}}
			>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
					<Box
						sx={{
							width: 32,
							height: 32,
							borderRadius: theme.layout.radius.card,
							background: theme.gradients.brandDiagonal,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<AutoAwesome sx={{ color: '#fff', fontSize: 18 }} />
					</Box>
					<Box>
						<Typography variant="h6" sx={{ color: theme.palette.secondary.main, fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>
							ARIA
						</Typography>
						<Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
							Your AI co-worker
						</Typography>
					</Box>
				</Box>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
					<Tooltip title="New chat">
						<IconButton onClick={handleNewChat} size="small" sx={{ color: theme.palette.text.secondary }}>
							<AddCommentOutlined fontSize="small" />
						</IconButton>
					</Tooltip>
					<IconButton onClick={handleClose} size="small" sx={{ color: theme.palette.text.secondary }} aria-label="Close ARIA chat">
						<Close fontSize="small" />
					</IconButton>
				</Box>
			</Box>

			{/* Messages */}
			<Box ref={scrollRef} sx={{ flex: 1, overflowY: 'auto', p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
				{messages.length === 0 && !streaming && (
					<Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, textAlign: 'center', color: theme.palette.text.secondary }}>
						<AutoAwesome sx={{ fontSize: 32, opacity: 0.4 }} />
						<Typography variant="body2">Ask ARIA anything — your open tasks, what needs attention, or just say hi.</Typography>
					</Box>
				)}

				{messages.map((message) => (
					<Box
						key={message.id}
						sx={{
							alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
							maxWidth: '85%',
						}}
					>
						<Box
							sx={{
								px: 2,
								py: 1.25,
								borderRadius: theme.layout.radius.card,
								bgcolor: message.role === 'user' ? theme.palette.accent.main : theme.palette.background.paper,
								color: message.role === 'user' ? '#fff' : theme.palette.text.primary,
								border: message.role === 'user' ? 'none' : `1px solid ${theme.palette.divider}`,
								whiteSpace: 'pre-wrap',
								wordBreak: 'break-word',
							}}
						>
							<Typography variant="body2">{message.content}</Typography>
						</Box>
					</Box>
				))}

				{streaming && (
					<Box sx={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
						<Box
							sx={{
								px: 2,
								py: 1.25,
								borderRadius: theme.layout.radius.card,
								bgcolor: theme.palette.background.paper,
								border: `1px solid ${theme.palette.divider}`,
								display: 'flex',
								alignItems: 'center',
								gap: 1,
							}}
						>
							{streamingText ? (
								<Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
									{streamingText}
								</Typography>
							) : (
								<>
									<CircularProgress size={14} sx={{ color: theme.palette.accent.main }} />
									<Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontStyle: 'italic' }}>
										{streamingStatusMessage || STATUS_LABEL[streamingStatus ?? 'planning']}
									</Typography>
								</>
							)}
						</Box>
					</Box>
				)}
			</Box>

			{/* Input */}
			<Box
				sx={{
					p: 2,
					borderTop: `1px solid ${theme.palette.divider}`,
					bgcolor: theme.palette.background.paper,
					display: 'flex',
					gap: 1,
					alignItems: 'flex-end',
				}}
			>
				<TextField
					fullWidth
					multiline
					maxRows={4}
					size="small"
					placeholder="Message ARIA…"
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					onKeyDown={handleKeyDown}
					disabled={streaming}
					sx={{
						'& .MuiInputBase-root': {
							borderRadius: theme.layout.radius.button,
							bgcolor: theme.palette.background.default,
						},
						'& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
					}}
				/>
				<IconButton
					onClick={handleSend}
					disabled={!draft.trim() || streaming}
					sx={{
						bgcolor: theme.palette.accent.main,
						color: '#fff',
						'&:hover': { bgcolor: theme.palette.accent.dark },
						'&.Mui-disabled': { bgcolor: alpha(theme.palette.accent.main, 0.3), color: '#fff' },
					}}
				>
					<Send fontSize="small" />
				</IconButton>
			</Box>
		</Drawer>
	);
};

export default AriaChatDrawer;
