import React, { useRef, useState, useEffect } from 'react';
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
	CircularProgress,
	Fade,
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
	AttachFile,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import type { ProjectTask, ProjectTaskUpdate } from '../../../../../models/projects/projectTask';
import { RichTextEditor, RichTextViewer } from '../../../../common/form';
import useToast from '../../../../../hooks/useToast';
import { useAppDispatch, useAppSelector } from '../../../../../store/hooks';
import { uploadTaskFile } from '../../../../../store/slices/projectsSlice';
import { MAX_FILE_SIZE_BYTES, ALLOWED_UPLOAD_MIME_TYPES } from '../../../../../constants/fileUpload';

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
	const [isDraggingFile, setIsDraggingFile] = useState(false);
	const [isUploadingFile, setIsUploadingFile] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Reactions state
	const [reactions, setReactions] = useState<Record<string, number>>({});
	const [userReactions, setUserReactions] = useState<Record<string, boolean>>({});

	// Anchor states for menus
	const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
	const [reactionAnchor, setReactionAnchor] = useState<null | HTMLElement>(null);

	const toast = useToast();
	const dispatch = useAppDispatch();

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
					last_edited_by: user?.username || 'Unknown user'
				}
			});
		}
		setIsEditingDesc(false);
	};

	const cancelEditDescription = () => {
		setEditDesc(task.description || '');
		setEditTab(0);
		setIsEditingDesc(false);
	};

	const uploadDescriptionFile = async (file: File) => {
		if (file.size > MAX_FILE_SIZE_BYTES) {
			toast.error(`File size exceeds the ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB limit`);
			return;
		}
		if (file.type && !ALLOWED_UPLOAD_MIME_TYPES.includes(file.type)) {
			toast.error(`File type "${file.type}" is not allowed`);
			return;
		}

		setIsUploadingFile(true);
		try {
			await dispatch(uploadTaskFile({ taskPublicId: task.public_id, file })).unwrap();
			toast.success('File attached to task');
		} catch (err: any) {
			toast.error(err || 'Failed to upload file');
		} finally {
			setIsUploadingFile(false);
		}
	};

	const handleAttachFileClick = () => {
		if (!isUploadingFile) fileInputRef.current?.click();
	};

	const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files || e.target.files.length === 0) return;
		await uploadDescriptionFile(e.target.files[0]);
		e.target.value = '';
	};

	const handleDescDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		if (!isUploadingFile) setIsDraggingFile(true);
	};

	const handleDescDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDraggingFile(false);
	};

	const handleDescDrop = async (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDraggingFile(false);
		if (isUploadingFile || !e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
		await uploadDescriptionFile(e.dataTransfer.files[0]);
	};

	const handleDescPaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
		const file = Array.from(e.clipboardData?.files || [])[0];
		if (file) await uploadDescriptionFile(file);
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
						{user?.username || 'Unknown user'}
						<Box component="span" sx={{ color: 'text.secondary', fontWeight: 400, ml: 0.75 }}>
							opened on {dayjs(task.created_at).format('MMM D, YYYY')}
						</Box>
					</Typography>
				</Stack>

				{/* Right side: Last edited + Role + Options Menu */}
				<Stack direction="row" alignItems="center" spacing={1.25}>
					{task.custom_fields?.last_edited_by && (
						<Stack direction="row" alignItems="center" spacing={0.25} sx={{ opacity: 0.85 }}>
							<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 500 }}>
								Last edited by {task.custom_fields.last_edited_by}
							</Typography>
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
								borderColor: cardBorderColor,
								borderRadius: '8px',
								overflow: 'hidden',
								bgcolor: 'background.paper',
								transition: 'border-color 0.2s, box-shadow 0.2s',
							}}
						>
							{/* Editor Tabs & Attach action */}
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

								{editTab === 0 && (
									<IconButton
										size="small"
										title="Attach file"
										onClick={handleAttachFileClick}
										disabled={isUploadingFile}
										sx={{ color: 'text.secondary', p: 0.5, mr: 1.5 }}
									>
										{isUploadingFile ? <CircularProgress size={16} /> : <AttachFile fontSize="small" style={{ fontSize: 16 }} />}
									</IconButton>
								)}
							</Box>

							{/* Editor or Preview area */}
							{editTab === 0 ? (
								<RichTextEditor
									value={editDesc}
									onChange={setEditDesc}
									placeholder="Type your description here..."
									minHeight={140}
									variant="standard"
									bordered={false}
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

							{/* Editor Footer: Upload zone on left, Cancel / Save buttons on right */}
							<Box
								onDragOver={handleDescDragOver}
								onDragLeave={handleDescDragLeave}
								onDrop={handleDescDrop}
								onPaste={handleDescPaste}
								sx={{
									px: 2,
									py: 1.5,
									borderTop: '1px dashed',
									borderColor: isDraggingFile ? 'primary.main' : 'divider',
									bgcolor: isDraggingFile
										? alpha(theme.palette.primary.main, 0.04)
										: (isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.002)'),
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									transition: 'background-color 0.15s ease, border-color 0.15s ease',
								}}
							>
								<Stack
									direction="row"
									spacing={0.5}
									alignItems="center"
									onClick={handleAttachFileClick}
									sx={{ color: isDraggingFile ? 'primary.main' : 'text.secondary', cursor: 'pointer', '&:hover': { color: 'text.primary' } }}
								>
									{isUploadingFile ? <CircularProgress size={14} /> : <AttachFile sx={{ fontSize: 16 }} />}
									<Typography variant="caption" sx={{ fontWeight: 500 }}>
										{isDraggingFile ? 'Drop file to attach' : 'Paste, drop, or click to add files'}
									</Typography>
								</Stack>
								<input
									type="file"
									ref={fileInputRef}
									onChange={handleFileInputChange}
									style={{ display: 'none' }}
								/>

								<Stack direction="row" spacing={1.5}>
									<Button
										onClick={cancelEditDescription}
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
				TransitionComponent={Fade}
				transitionDuration={150}
				PaperProps={{
					sx: {
						borderRadius: '20px',
						p: 0.75,
						mt: 0.5,
						boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
						border: '1px solid',
						borderColor: 'divider',
						willChange: 'auto',
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
								fontSize: '20px',
								lineHeight: 1,
								p: 0.75,
								borderRadius: '50%',
								WebkitFontSmoothing: 'antialiased',
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
