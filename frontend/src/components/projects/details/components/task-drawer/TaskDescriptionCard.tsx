import React, { useState, useEffect } from 'react';
import {
	Box,
	Stack,
	Typography,
	Button,
	Avatar,
	IconButton,
	useTheme,
	Menu,
	MenuItem,
	ListItemIcon,
	ListItemText,
	Divider,
	Popover,
	Tab,
	Tabs,
	alpha,
} from '@mui/material';
import {
	EditOutlined,
	MoreHorizOutlined,
	Link as LinkIcon,
	CodeOutlined,
	FormatQuoteOutlined,
	ReportOutlined,
	SentimentSatisfiedAltOutlined,
	KeyboardArrowDown,
	FormatBold,
	FormatItalic,
	FormatQuote,
	Code,
	AlternateEmail,
	AttachFile,
	Undo,
	FormatListNumbered,
	FormatListBulleted,
	PlaylistAddCheck,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import type { ProjectTask, ProjectTaskUpdate } from '../../../../../models/projects/projectTask';
import { RichTextViewer } from '../../../../common/form';
import useToast from '../../../../../hooks/useToast';
import { useAppSelector } from '../../../../../store/hooks';

interface TaskDescriptionCardProps {
	task: ProjectTask;
	onUpdateField: (fields: ProjectTaskUpdate) => Promise<void>;
	setCommentText?: React.Dispatch<React.SetStateAction<string>>;
}

export const TaskDescriptionCard: React.FC<TaskDescriptionCardProps> = ({
	task,
	onUpdateField,
	setCommentText,
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const cardBorderColor = isDark ? '#1f6feb' : '#0969da';
	const borderColor = isDark ? '#30363d' : '#d0d7de';
	const cardBg = isDark ? '#161b22' : '#ffffff';

	const user = useAppSelector((state) => state.auth.user);
	const userInitials = user
		? (user.full_name || user.username)
			.split(' ')
			.map((n: string) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2)
		: 'U';

	const [isEditingDesc, setIsEditingDesc] = useState(false);
	const [editDesc, setEditDesc] = useState(task.description || '');
	const [editTab, setEditTab] = useState(0);
	const [isFocused, setIsFocused] = useState(false);

	// Reactions state
	const [reactions, setReactions] = useState<Record<string, number>>({});
	const [userReactions, setUserReactions] = useState<Record<string, boolean>>({});

	// Anchor states for menus
	const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
	const [reactionAnchor, setReactionAnchor] = useState<null | HTMLElement>(null);

	const toast = useToast();

	useEffect(() => {
		setEditDesc(task.description || '');
		setIsEditingDesc(false);
		setEditTab(0);
		setMenuAnchor(null);
		setReactionAnchor(null);
	}, [task.id, task.description]);

	const saveDescription = async () => {
		if (editDesc !== (task.description || '')) {
			await onUpdateField({
				description: editDesc.trim() || null,
				custom_fields: {
					...task.custom_fields,
					last_edited_by: user?.username || 'dharani6255'
				}
			});
		}
		setIsEditingDesc(false);
	};

	const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
		setMenuAnchor(event.currentTarget);
	};

	const handleCloseMenu = () => {
		setMenuAnchor(null);
	};

	const handleCopyLink = () => {
		navigator.clipboard.writeText(window.location.href);
		toast.success('Link copied to clipboard');
		handleCloseMenu();
	};

	const handleCopyMarkdown = () => {
		const descriptionHTML = task.description || '';
		const cleanText = descriptionHTML.replace(/<[^>]*>/g, '').trim();
		navigator.clipboard.writeText(cleanText || 'No description provided.');
		toast.success('Description copied as Markdown');
		handleCloseMenu();
	};

	const handleQuoteReply = () => {
		const descriptionHTML = task.description || '';
		const cleanText = descriptionHTML.replace(/<[^>]*>/g, '').trim();
		const quote = `> ${cleanText || 'No description provided.'}\n\n`;
		setCommentText?.((prev) => prev + quote);
		
		setTimeout(() => {
			const commentInput = document.getElementById('task-comment-input');
			if (commentInput) {
				commentInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
				commentInput.focus();
			}
		}, 100);
		
		toast.info('Quoted description in comments');
		handleCloseMenu();
	};

	const handleEditDescription = () => {
		setIsEditingDesc(true);
		handleCloseMenu();
	};

	const handleReportContent = () => {
		toast.warning('Content reported to administrator');
		handleCloseMenu();
	};

	const toggleEmojiReaction = (emoji: string) => {
		setReactions(prev => {
			const currentCount = prev[emoji] || 0;
			const isAlreadyReacted = userReactions[emoji];
			return {
				...prev,
				[emoji]: isAlreadyReacted ? Math.max(0, currentCount - 1) : currentCount + 1
			};
		});
		setUserReactions(prev => ({
			...prev,
			[emoji]: !prev[emoji]
		}));
		setReactionAnchor(null);
	};

	const emojisList = ['👍', '❤️', '😄', '🎉', '😕', '🚀'];

	return (
		<Box
			sx={{
				border: '1px solid',
				borderColor: borderColor,
				borderRadius: '12px',
				overflow: 'hidden',
				bgcolor: cardBg,
				boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.15)' : '0 4px 20px rgba(0,0,0,0.02)',
			}}
		>
			{/* Card Header (GitHub issue comment style) */}
			<Box
				sx={{
					px: 2,
					py: 0.85,
					borderBottom: '1px solid',
					borderColor: borderColor,
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					bgcolor: isDark ? '#161b22' : '#f6f8fa',
					minHeight: '40px',
				}}
			>
				{/* Left side: Avatar + Username + time */}
				<Stack direction="row" alignItems="center" spacing={1}>
					<Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', fontWeight: 700, bgcolor: 'primary.main', color: 'white' }}>
						{userInitials}
					</Avatar>
					<Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.825rem', color: 'text.primary' }}>
						{user?.username || 'dharani6255'}
						<Box component="span" sx={{ color: 'text.secondary', fontWeight: 400, ml: 0.75 }}>
							opened on {dayjs(task.created_at).format('MMM D, YYYY')}
						</Box>
					</Typography>
				</Stack>

				{/* Right side: Last edited + Role + Options Menu */}
				<Stack direction="row" alignItems="center" spacing={1.25}>
					{task.custom_fields?.last_edited_by && (
						<Stack direction="row" alignItems="center" spacing={0.25} sx={{ cursor: 'pointer', opacity: 0.85 }}>
							<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 500 }}>
								Last edited by {task.custom_fields.last_edited_by}
							</Typography>
							<KeyboardArrowDown sx={{ fontSize: 12, color: 'text.secondary' }} />
						</Stack>
					)}
					<Box sx={{ border: '1px solid', borderColor: borderColor, px: 1, py: 0.125, borderRadius: '100px', fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary', bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
						Member
					</Box>
					{!isEditingDesc && (
						<IconButton size="small" onClick={handleOpenMenu} sx={{ color: 'text.secondary', '&:hover': { bgcolor: theme.palette.action.hover } }}>
							<MoreHorizOutlined fontSize="small" style={{ fontSize: 18 }} />
						</IconButton>
					)}
				</Stack>
			</Box>

			{/* Card Body */}
			<Box sx={{ px: 2.25, py: isEditingDesc ? 1.5 : 2.5 }}>
				{isEditingDesc ? (
					<Stack spacing={2}>
						{/* Styled Tabbed Editor Box (GitHub Style) */}
						<Box
							sx={{
								border: '1px solid',
								borderColor: isFocused ? theme.palette.primary.main : cardBorderColor,
								boxShadow: isFocused ? `0 0 0 1px ${theme.palette.primary.main}` : 'none',
								borderRadius: '8px',
								overflow: 'hidden',
								bgcolor: 'background.paper',
								transition: 'border-color 0.2s, box-shadow 0.2s',
							}}
						>
							{/* Editor Tabs & Formatting Toolbar */}
							<Box
								sx={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									borderBottom: '1px solid',
									borderColor: 'divider',
									bgcolor: isDark ? '#161b22' : '#f6f8fa',
								}}
							>
								{/* Write / Preview Tabs */}
								<Tabs
									value={editTab}
									onChange={(_, v) => setEditTab(v)}
									sx={{
										minHeight: '38px',
										overflow: 'visible',
										'& .MuiTabs-scroller': {
											overflow: 'visible !important',
										},
										'& .MuiTabs-indicator': {
											display: 'none',
										},
										'& .MuiTabs-flexContainer': {
											gap: '4px',
											pt: '6px',
											px: '8px',
											overflow: 'visible',
										}
									}}
								>
									<Tab
										label="Write"
										sx={{
											textTransform: 'none',
											fontWeight: 600,
											fontSize: '0.85rem',
											minWidth: 'auto',
											minHeight: '32px',
											py: 0.5,
											px: 2,
											borderRadius: '6px 6px 0 0',
											color: 'text.secondary',
											border: '1px solid transparent',
											borderBottom: 'none',
											'&.Mui-selected': {
												color: 'text.primary',
												bgcolor: 'background.paper',
												borderColor: 'divider',
												borderBottom: '1px solid',
												borderBottomColor: 'background.paper',
												marginBottom: '-1px',
												position: 'relative',
												zIndex: 2,
											}
										}}
									/>
									<Tab
										label="Preview"
										sx={{
											textTransform: 'none',
											fontWeight: 600,
											fontSize: '0.85rem',
											minWidth: 'auto',
											minHeight: '32px',
											py: 0.5,
											px: 2,
											borderRadius: '6px 6px 0 0',
											color: 'text.secondary',
											border: '1px solid transparent',
											borderBottom: 'none',
											'&.Mui-selected': {
												color: 'text.primary',
												bgcolor: 'background.paper',
												borderColor: 'divider',
												borderBottom: '1px solid',
												borderBottomColor: 'background.paper',
												marginBottom: '-1px',
												position: 'relative',
												zIndex: 2,
											}
										}}
									/>
								</Tabs>

								{/* Formatting Toolbar */}
								{editTab === 0 && (
									<Stack direction="row" spacing={0.25} alignItems="center" sx={{ pr: 1.5 }}>
										<IconButton size="small" title="Header" sx={{ color: 'text.secondary', p: 0.5 }}>
											<Typography sx={{ fontSize: '0.8rem', fontWeight: 800 }}>H</Typography>
										</IconButton>
										<IconButton size="small" title="Bold" sx={{ color: 'text.secondary', p: 0.5 }}>
											<FormatBold fontSize="small" style={{ fontSize: 16 }} />
										</IconButton>
										<IconButton size="small" title="Italic" sx={{ color: 'text.secondary', p: 0.5 }}>
											<FormatItalic fontSize="small" style={{ fontSize: 16 }} />
										</IconButton>
										<IconButton size="small" title="Quote" sx={{ color: 'text.secondary', p: 0.5 }}>
											<FormatQuote fontSize="small" style={{ fontSize: 16 }} />
										</IconButton>
										<IconButton size="small" title="Code" sx={{ color: 'text.secondary', p: 0.5 }}>
											<Code fontSize="small" style={{ fontSize: 16 }} />
										</IconButton>
										<IconButton size="small" title="Link" sx={{ color: 'text.secondary', p: 0.5 }}>
											<LinkIcon fontSize="small" style={{ fontSize: 16 }} />
										</IconButton>

										<Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 1 }} />

										<IconButton size="small" title="Numbered List" sx={{ color: 'text.secondary', p: 0.5 }}>
											<FormatListNumbered fontSize="small" style={{ fontSize: 16 }} />
										</IconButton>
										<IconButton size="small" title="Bulleted List" sx={{ color: 'text.secondary', p: 0.5 }}>
											<FormatListBulleted fontSize="small" style={{ fontSize: 16 }} />
										</IconButton>
										<IconButton size="small" title="Task List" sx={{ color: 'text.secondary', p: 0.5 }}>
											<PlaylistAddCheck fontSize="small" style={{ fontSize: 18 }} />
										</IconButton>

										<Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 1 }} />

										<IconButton size="small" title="Mention" sx={{ color: 'text.secondary', p: 0.5 }}>
											<AlternateEmail fontSize="small" style={{ fontSize: 16 }} />
										</IconButton>
										<IconButton size="small" title="Quote Reply" sx={{ color: 'text.secondary', p: 0.5 }}>
											<FormatQuoteOutlined fontSize="small" style={{ fontSize: 16 }} />
										</IconButton>
										<IconButton size="small" title="Attach file" sx={{ color: 'text.secondary', p: 0.5 }}>
											<AttachFile fontSize="small" style={{ fontSize: 16 }} />
										</IconButton>
										<IconButton size="small" title="Undo" sx={{ color: 'text.secondary', p: 0.5 }}>
											<Undo fontSize="small" style={{ fontSize: 16 }} />
										</IconButton>
									</Stack>
								)}
							</Box>

							{/* Text Field or Preview area */}
							{editTab === 0 ? (
								<textarea
									placeholder="Type your description here..."
									value={editDesc}
									onChange={(e) => setEditDesc(e.target.value)}
									onFocus={() => setIsFocused(true)}
									onBlur={() => setIsFocused(false)}
									style={{
										width: '100%',
										minHeight: '140px',
										padding: '16px',
										fontSize: '0.875rem',
										fontFamily: 'inherit',
										backgroundColor: 'transparent',
										border: 'none',
										outline: 'none',
										color: 'inherit',
										resize: 'vertical',
										boxSizing: 'border-box',
									}}
								/>
							) : (
								<Box sx={{ p: 2, minHeight: 140, overflowY: 'auto' }}>
									{editDesc.trim() ? (
										<RichTextViewer html={editDesc} />
									) : (
										<Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', textAlign: 'center', py: 4 }}>
											Nothing to preview. Type description in the "Write" tab.
										</Typography>
									)}
								</Box>
							)}

							{/* Editor Footer: Upload text on left, Cancel / Save buttons on right (Inside blue editor Box) */}
							<Box
								sx={{
									px: 2,
									py: 1.5,
									borderTop: '1px dashed',
									borderColor: 'divider',
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.002)',
								}}
							>
								<Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'text.secondary', cursor: 'pointer', '&:hover': { color: 'text.primary' } }}>
									<AttachFile sx={{ fontSize: 16 }} />
									<Typography variant="caption" sx={{ fontWeight: 500 }}>
										Paste, drop, or click to add files
									</Typography>
								</Stack>

								<Stack direction="row" spacing={1.5}>
									<Button
										onClick={() => setIsEditingDesc(false)}
										size="small"
										sx={{
											textTransform: 'none',
											fontWeight: 700,
											borderRadius: '6px',
											color: 'text.primary',
											border: '1px solid',
											borderColor: 'divider',
											px: 2,
											py: 0.5,
											bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
											'&:hover': { bgcolor: theme.palette.action.hover }
										}}
									>
										Cancel
									</Button>
									<Button
										variant="contained"
										onClick={saveDescription}
										size="small"
										sx={{
											textTransform: 'none',
											fontWeight: 700,
											borderRadius: '6px',
											px: 2.5,
											py: 0.5,
											bgcolor: '#2da44e',
											color: 'white !important',
											boxShadow: 'none',
											'&:hover': {
												bgcolor: '#2c974b',
												boxShadow: 'none',
											}
										}}
									>
										Save
									</Button>
								</Stack>
							</Box>
						</Box>
					</Stack>
				) : task.description ? (
					<RichTextViewer html={task.description} />
				) : (
					<Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
						No description provided.
					</Typography>
				)}

				{/* Render Reactions block if any emoji has > 0 count */}
				{Object.entries(reactions).some(([_, count]) => count > 0) && (
					<Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 3, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
						{Object.entries(reactions).map(([emoji, count]) => {
							if (count <= 0) return null;
							const isActive = userReactions[emoji];
							return (
								<Box
									key={emoji}
									onClick={() => toggleEmojiReaction(emoji)}
									sx={{
										display: 'flex',
										alignItems: 'center',
										gap: 0.75,
										px: 1.25,
										py: 0.5,
										borderRadius: '100px',
										border: '1px solid',
										borderColor: isActive ? 'primary.main' : 'divider',
										bgcolor: isActive ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
										color: isActive ? 'primary.main' : 'text.primary',
										cursor: 'pointer',
										fontSize: '0.75rem',
										fontWeight: 700,
										'&:hover': {
											borderColor: 'primary.main',
											bgcolor: alpha(theme.palette.primary.main, 0.04),
										}
									}}
								>
									<span>{emoji}</span>
									<span>{count}</span>
								</Box>
							);
						})}
					</Stack>
				)}
			</Box>

			{/* Card Footer Actions (Reaction trigger) */}
			{!isEditingDesc && (
				<Box sx={{ px: 2.25, pb: 2, display: 'flex', alignItems: 'center' }}>
					<IconButton
						size="small"
						onClick={(e) => setReactionAnchor(e.currentTarget)}
						sx={{
							color: 'text.secondary',
							border: '1px solid',
							borderColor: 'divider',
							p: 0.75,
							borderRadius: '50%',
							'&:hover': {
								bgcolor: theme.palette.action.hover,
								color: 'text.primary',
							}
						}}
						title="Add reaction"
					>
						<SentimentSatisfiedAltOutlined style={{ fontSize: 16 }} />
					</IconButton>
				</Box>
			)}

			{/* Context Options Menu */}
			<Menu
				anchorEl={menuAnchor}
				open={Boolean(menuAnchor)}
				onClose={handleCloseMenu}
				PaperProps={{
					sx: {
						minWidth: 180,
						borderRadius: '8px',
						mt: 0.5,
						boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
					}
				}}
			>
				<MenuItem onClick={handleCopyLink}>
					<ListItemIcon>
						<LinkIcon fontSize="small" />
					</ListItemIcon>
					<ListItemText primary="Copy link" />
				</MenuItem>
				<MenuItem onClick={handleCopyMarkdown}>
					<ListItemIcon>
						<CodeOutlined fontSize="small" />
					</ListItemIcon>
					<ListItemText primary="Copy Markdown" />
				</MenuItem>
				<MenuItem onClick={handleQuoteReply}>
					<ListItemIcon>
						<FormatQuoteOutlined fontSize="small" />
					</ListItemIcon>
					<ListItemText primary="Quote reply" />
				</MenuItem>
				
				<Divider sx={{ my: 0.5 }} />
				
				<MenuItem onClick={handleEditDescription}>
					<ListItemIcon>
						<EditOutlined fontSize="small" />
					</ListItemIcon>
					<ListItemText primary="Edit" />
				</MenuItem>
				
				<Divider sx={{ my: 0.5 }} />
				
				<MenuItem onClick={handleReportContent}>
					<ListItemIcon>
						<ReportOutlined fontSize="small" color="error" />
					</ListItemIcon>
					<ListItemText primary="Report content" primaryTypographyProps={{ color: 'error' }} />
				</MenuItem>
			</Menu>

			{/* Emoji Reaction Popover Picker */}
			<Popover
				open={Boolean(reactionAnchor)}
				anchorEl={reactionAnchor}
				onClose={() => setReactionAnchor(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				transformOrigin={{ vertical: 'top', horizontal: 'left' }}
				PaperProps={{
					sx: {
						borderRadius: '20px',
						p: 0.75,
						mt: 0.5,
						boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
						border: '1px solid',
						borderColor: 'divider',
					}
				}}
			>
				<Stack direction="row" spacing={0.5}>
					{emojisList.map((emoji) => (
						<IconButton
							key={emoji}
							size="small"
							onClick={() => toggleEmojiReaction(emoji)}
							sx={{
								fontSize: '1.1rem',
								p: 0.75,
								borderRadius: '50%',
								'&:hover': { bgcolor: theme.palette.action.hover }
							}}
						>
							{emoji}
						</IconButton>
					))}
				</Stack>
			</Popover>
		</Box>
	);
};
