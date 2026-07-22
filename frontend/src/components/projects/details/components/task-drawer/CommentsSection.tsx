import React, { useState, useRef, useMemo } from 'react';
import {
	Box,
	Stack,
	TextField,
	Button,
	Tab,
	Tabs,
	Typography,
	useTheme,
	IconButton,
	Popover,
	MenuItem,
} from '@mui/material';
import {
	FormatBold,
	FormatItalic,
	FormatQuote,
	Code,
	Link,
	FormatListNumbered,
	FormatListBulleted,
	AlternateEmail,
	SentimentSatisfiedAltOutlined,
	AttachFile,
	AutoAwesome,
} from '@mui/icons-material';
import type { ProjectTask, ProjectTaskFile } from '../../../../../models/projects/projectTask';
import type { CRMOwnerOption } from '../../../../../models/crm/owner';
import EnterpriseAvatar from '../../../../common/avatar/Avatar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface CommentsSectionProps {
	task: ProjectTask;
	commentText: string;
	setCommentText: (val: string) => void;
	onAddComment?: (content: string) => Promise<void>;
	onUploadAttachment?: (file: File) => Promise<void>;
	owners?: CRMOwnerOption[];
	tasks?: ProjectTask[];
	files?: ProjectTaskFile[];
	projectPublicId?: string;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
	task,
	commentText,
	setCommentText,
	onAddComment,
	onUploadAttachment,
	owners = [],
	tasks = [],
	files = [],
	projectPublicId = '',
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const [commentTab, setCommentTab] = useState(0);
	const [dragActive, setDragActive] = useState(false);

	// Mention Autocomplete States
	const [isMentionOpen, setIsMentionOpen] = useState(false);
	const [mentionSearch, setMentionSearch] = useState('');
	const [mentionStartIndex, setMentionStartIndex] = useState(0);

	const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const checkMention = () => {
		const input = inputRef.current;
		if (!input) return;

		const caretPos = input.selectionStart ?? 0;
		const textBeforeCaret = commentText.substring(0, caretPos);

		const lastAtIdx = textBeforeCaret.lastIndexOf('@');

		if (lastAtIdx !== -1) {
			const textAfterAt = textBeforeCaret.substring(lastAtIdx + 1);
			if (!/\s/.test(textAfterAt)) {
				setMentionSearch(textAfterAt);
				setIsMentionOpen(true);
				setMentionStartIndex(lastAtIdx);
				return;
			}
		}

		setIsMentionOpen(false);
	};

	const handleSelectMention = (type: 'user' | 'file' | 'task' | 'iris', item: any) => {
		const input = inputRef.current;
		if (!input) return;

		const caretPos = input.selectionStart ?? 0;
		const text = commentText;

		let insertionText = '';
		if (type === 'iris') {
			insertionText = `@iris `;
		} else if (type === 'user') {
			insertionText = `@${item.email.split('@')[0]} `;
		} else if (type === 'file') {
			insertionText = `[📄 ${item.file_name}](/api/v1/project-tasks/${task.public_id}/files/${item.public_id}/download) `;
		} else if (type === 'task') {
			insertionText = `[#${item.title}](/projects/${projectPublicId}?task=${item.public_id}) `;
		}

		const newText = text.substring(0, mentionStartIndex) + insertionText + text.substring(caretPos);
		setCommentText(newText);
		setIsMentionOpen(false);

		setTimeout(() => {
			input.focus();
			const newPos = mentionStartIndex + insertionText.length;
			input.setSelectionRange(newPos, newPos);
		}, 0);
	};

	const handleFormat = (type: string) => {
		const input = inputRef.current;
		if (!input) return;

		const start = input.selectionStart ?? 0;
		const end = input.selectionEnd ?? 0;
		const text = commentText;
		const selectedText = text.substring(start, end);

		let prefix = '';
		let suffix = '';
		let defaultPlaceholder = '';

		switch (type) {
			case 'Bold':
				prefix = '**';
				suffix = '**';
				defaultPlaceholder = 'bold text';
				break;
			case 'Italic':
				prefix = '*';
				suffix = '*';
				defaultPlaceholder = 'italic text';
				break;
			case 'Quote':
				prefix = '> ';
				defaultPlaceholder = 'quote';
				break;
			case 'Code':
				if (selectedText.includes('\n')) {
					prefix = '```\n';
					suffix = '\n```';
				} else {
					prefix = '`';
					suffix = '`';
				}
				defaultPlaceholder = 'code';
				break;
			case 'Link':
				prefix = '[';
				suffix = '](url)';
				defaultPlaceholder = 'link text';
				break;
			case 'Bulleted List':
				prefix = '- ';
				defaultPlaceholder = 'item';
				break;
			case 'Numbered List':
				prefix = '1. ';
				defaultPlaceholder = 'item';
				break;
			case 'Mention':
				prefix = '@';
				defaultPlaceholder = 'username';
				break;
			case 'Emoji':
				prefix = '😊';
				break;
			default:
				return;
		}

		const replacement = selectedText || defaultPlaceholder;
		const newText = text.substring(0, start) + prefix + replacement + suffix + text.substring(end);
		setCommentText(newText);

		// Reset selection and focus
		setTimeout(() => {
			input.focus();
			const newStart = start + prefix.length;
			const newEnd = newStart + replacement.length;
			input.setSelectionRange(newStart, newEnd);
		}, 0);
	};

	const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && onUploadAttachment) {
			for (let i = 0; i < e.target.files.length; i++) {
				await onUploadAttachment(e.target.files[i]);
			}
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);
	};

	const handleDrop = async (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);

		if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && onUploadAttachment) {
			for (let i = 0; i < e.dataTransfer.files.length; i++) {
				await onUploadAttachment(e.dataTransfer.files[i]);
			}
		}
	};

	// Matches IRIS_MENTION_RE (`@iris\b`) server-side -- selecting this inserts "@iris "
	// exactly like picking a real user inserts "@username ", so the backend's plain-text
	// detection in the task-comments endpoint picks it up with no extra wiring.
	const irisMentionMatches = 'iris'.includes(mentionSearch.toLowerCase());

	// Filter mention options
	const filteredUsers = useMemo(() => {
		return owners.filter(u =>
			(u.full_name || '').toLowerCase().includes(mentionSearch.toLowerCase()) ||
			(u.email || '').toLowerCase().includes(mentionSearch.toLowerCase())
		).slice(0, 5);
	}, [owners, mentionSearch]);

	const filteredFiles = useMemo(() => {
		return files.filter(f =>
			(f.file_name || '').toLowerCase().includes(mentionSearch.toLowerCase())
		).slice(0, 5);
	}, [files, mentionSearch]);

	const filteredTasks = useMemo(() => {
		return tasks.filter(t =>
			(t.title || '').toLowerCase().includes(mentionSearch.toLowerCase())
		).slice(0, 5);
	}, [tasks, mentionSearch]);

	const toolbarButtons = [
		{ icon: <FormatBold fontSize="small" sx={{ fontSize: 16 }} />, title: 'Bold' },
		{ icon: <FormatItalic fontSize="small" sx={{ fontSize: 16 }} />, title: 'Italic' },
		{ icon: <FormatQuote fontSize="small" sx={{ fontSize: 16 }} />, title: 'Quote' },
		{ icon: <Code fontSize="small" sx={{ fontSize: 16 }} />, title: 'Code' },
		{ icon: <Link fontSize="small" sx={{ fontSize: 16 }} />, title: 'Link' },
		{ icon: <FormatListBulleted fontSize="small" sx={{ fontSize: 16 }} />, title: 'Bulleted List' },
		{ icon: <FormatListNumbered fontSize="small" sx={{ fontSize: 16 }} />, title: 'Numbered List' },
		{ icon: <AlternateEmail fontSize="small" sx={{ fontSize: 16 }} />, title: 'Mention' },
		{ icon: <SentimentSatisfiedAltOutlined fontSize="small" sx={{ fontSize: 16 }} />, title: 'Emoji' },
	];

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
			<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
				<Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
					Add a comment
				</Typography>
				<Stack direction="row" alignItems="center" spacing={0.5}>
					<AutoAwesome sx={{ fontSize: 13, color: 'text.disabled' }} />
					<Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
						Type @iris to ask your AI co-worker about this task
					</Typography>
				</Stack>
			</Stack>

			{/* Hidden file input */}
			<input
				type="file"
				ref={fileInputRef}
				style={{ display: 'none' }}
				onChange={handleFileSelect}
				multiple
			/>

			{/* Editor Box */}
			<Box
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				sx={{
					border: '1px solid',
					borderColor: dragActive ? (isDark ? '#8b7cf6' : '#6366f1') : (isDark ? '#30363d' : '#d0d7de'),
					borderRadius: '8px',
					overflow: 'hidden',
					bgcolor: isDark ? '#0d1117' : '#ffffff',
					transition: 'border-color 0.2s',
				}}
			>
				{/* Write & Preview Tabs Header */}
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						borderBottom: '1px solid',
						borderColor: isDark ? '#30363d' : '#d0d7de',
						bgcolor: isDark ? '#161b22' : '#f6f8fa',
					}}
				>
					<Tabs
						value={commentTab}
						onChange={(_, v) => setCommentTab(v)}
						sx={{
							minHeight: '36px',
							'& .MuiTabs-indicator': {
								bgcolor: isDark ? '#f0f6fc' : '#0969da',
							},
							'& .MuiTab-root': {
								minHeight: '36px',
								py: 0.5,
								px: 2,
								textTransform: 'none',
								fontWeight: 600,
								fontSize: '0.8rem',
								color: 'text.secondary',
								'&.Mui-selected': {
									color: 'text.primary',
									fontWeight: 700,
								},
							},
						}}
					>
						<Tab label="Write" />
						<Tab label="Preview" />
					</Tabs>

					{/* Formatting Toolbar */}
					{commentTab === 0 && (
						<Stack direction="row" spacing={0.25} sx={{ pr: 1.5 }}>
							{toolbarButtons.map((btn, idx) => (
								<IconButton
									key={idx}
									size="small"
									title={btn.title}
									onClick={() => handleFormat(btn.title)}
									sx={{
										color: 'text.secondary',
										p: 0.4,
										borderRadius: '4px',
										'&:hover': { bgcolor: isDark ? '#30363d' : '#eef2ff' },
									}}
								>
									{btn.icon}
								</IconButton>
							))}
						</Stack>
					)}
				</Box>

				{/* Editor Content Area */}
				<Box sx={{ p: 1.5 }}>
					{commentTab === 0 ? (
						<Stack spacing={1.5}>
							<TextField
								id="task-comment-input"
								placeholder="Use Markdown to format your comment"
								multiline
								rows={4}
								fullWidth
								value={commentText}
								onChange={(e) => {
									setCommentText(e.target.value);
									setTimeout(checkMention, 0);
								}}
								onKeyUp={checkMention}
								onClick={checkMention}
								inputRef={inputRef}
								InputProps={{
									sx: {
										fontSize: '0.85rem',
										color: 'text.primary',
										fontFamily: 'inherit',
										alignItems: 'flex-start',
										p: 0,
										'& fieldset': { border: 'none' },
									},
								}}
							/>

							{/* Footer actions inside the Write panel */}
							<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ borderTop: '1px solid', borderColor: isDark ? '#21262d' : '#e1e4e8', pt: 1.5 }}>
								{/* Paperclip upload files text */}
								<Stack
									direction="row"
									alignItems="center"
									spacing={0.5}
									onClick={() => fileInputRef.current?.click()}
									sx={{ cursor: 'pointer', color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
								>
									<AttachFile sx={{ fontSize: 16 }} />
									<Typography sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
										Paste, drop, or click to add files
									</Typography>
								</Stack>

								{/* Buttons Group */}
								<Stack direction="row" spacing={1.25} alignItems="center">
									{/* Comment Action Button */}
									<Button
										variant="contained"
										disabled={!commentText.trim()}
										onClick={async () => {
											if (onAddComment && commentText.trim()) {
												await onAddComment(commentText.trim());
												setCommentText('');
											}
										}}
										sx={{
											textTransform: 'none',
											fontWeight: 700,
											fontSize: '0.8rem',
											borderRadius: '6px',
											px: 2.25,
											py: 0.65,
											bgcolor: isDark ? '#238636' : '#2da44e',
											color: '#ffffff !important',
											boxShadow: 'none',
											'&:hover': {
												bgcolor: isDark ? '#2ea44f' : '#2cbe4e',
												boxShadow: 'none',
											},
											'&.Mui-disabled': {
												bgcolor: isDark ? 'rgba(35,134,54,0.4)' : 'rgba(45,164,78,0.3)',
												color: isDark ? 'rgba(255,255,255,0.4) !important' : 'rgba(255,255,255,0.5) !important',
											},
										}}
									>
										Comment
									</Button>
								</Stack>
							</Stack>
						</Stack>
					) : (
						<Box sx={{ minHeight: 110, p: 1.5, border: '1px solid', borderColor: isDark ? '#30363d' : '#d0d7de', borderRadius: '8px', bgcolor: isDark ? '#0d1117' : '#ffffff' }}>
							{commentText.trim() ? (
								<Box className="markdown-body" sx={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'text.primary' }}>
									<ReactMarkdown remarkPlugins={[remarkGfm]}>{commentText}</ReactMarkdown>
								</Box>
							) : (
								<Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', textAlign: 'center', py: 4 }}>
									Nothing to preview. Type a comment in the "Write" tab.
								</Typography>
							)}
						</Box>
					)}
				</Box>
			</Box>

			{/* Mentions Popover */}
			<Popover
				open={isMentionOpen && (irisMentionMatches || filteredUsers.length > 0 || filteredFiles.length > 0 || filteredTasks.length > 0)}
				anchorEl={inputRef.current}
				onClose={() => setIsMentionOpen(false)}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'left',
				}}
				transformOrigin={{
					vertical: 'top',
					horizontal: 'left',
				}}
				disableAutoFocus
				disableEnforceFocus
				PaperProps={{
					sx: {
						maxHeight: 250,
						width: 320,
						mt: 0.5,
						borderRadius: '8px',
						boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
						border: '1px solid',
						borderColor: isDark ? '#30363d' : '#d0d7de',
						bgcolor: isDark ? '#161b22' : '#ffffff',
					}
				}}
			>
				<Box sx={{ p: 1 }}>
					{irisMentionMatches && (
						<Box>
							<MenuItem
								onClick={() => handleSelectMention('iris', null)}
								sx={{ borderRadius: '4px', py: 0.5 }}
							>
								<Stack direction="row" alignItems="center" spacing={1}>
									<Box
										sx={{
											width: 20,
											height: 20,
											borderRadius: '6px',
											background: theme.gradients.brandDiagonal,
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
										}}
									>
										<AutoAwesome sx={{ fontSize: 12, color: '#fff' }} />
									</Box>
									<Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
										IRIS
									</Typography>
									<Typography variant="caption" sx={{ color: 'text.disabled' }}>
										ask your AI co-worker
									</Typography>
								</Stack>
							</MenuItem>
						</Box>
					)}

					{filteredUsers.length > 0 && (
						<Box>
							<Typography variant="caption" sx={{ px: 1.5, py: 0.5, display: 'block', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem' }}>
								Users
							</Typography>
							{filteredUsers.map((u) => (
								<MenuItem
									key={u.id}
									onClick={() => handleSelectMention('user', u)}
									sx={{ borderRadius: '4px', py: 0.5 }}
								>
									<Stack direction="row" alignItems="center" spacing={1}>
										<EnterpriseAvatar name={u.full_name || u.email} size={20} sx={{ fontSize: '0.62rem', borderRadius: '6px' }} />
										<Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
											{u.full_name || u.email}
										</Typography>
										<Typography variant="caption" sx={{ color: 'text.disabled' }}>
											@{u.email.split('@')[0]}
										</Typography>
									</Stack>
								</MenuItem>
							))}
						</Box>
					)}

					{filteredFiles.length > 0 && (
						<Box sx={{ mt: filteredUsers.length > 0 ? 1 : 0 }}>
							<Typography variant="caption" sx={{ px: 1.5, py: 0.5, display: 'block', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem' }}>
								Files / Documents
							</Typography>
							{filteredFiles.map((f) => (
								<MenuItem
									key={f.id}
									onClick={() => handleSelectMention('file', f)}
									sx={{ borderRadius: '4px', py: 0.5 }}
								>
									<Typography variant="body2" noWrap sx={{ fontSize: '0.8rem', fontWeight: 500, maxWidth: 280 }}>
										📄 {f.file_name}
									</Typography>
								</MenuItem>
							))}
						</Box>
					)}

					{filteredTasks.length > 0 && (
						<Box sx={{ mt: (filteredUsers.length > 0 || filteredFiles.length > 0) ? 1 : 0 }}>
							<Typography variant="caption" sx={{ px: 1.5, py: 0.5, display: 'block', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem' }}>
								Tasks
							</Typography>
							{filteredTasks.map((t) => (
								<MenuItem
									key={t.id}
									onClick={() => handleSelectMention('task', t)}
									sx={{ borderRadius: '4px', py: 0.5 }}
								>
									<Typography variant="body2" noWrap sx={{ fontSize: '0.8rem', fontWeight: 500, maxWidth: 280 }}>
										# {t.title}
									</Typography>
								</MenuItem>
							))}
						</Box>
					)}
				</Box>
			</Popover>
		</Box>
	);
};

export default CommentsSection;
