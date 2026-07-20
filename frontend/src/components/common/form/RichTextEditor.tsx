import React, { useMemo, useState, useRef } from 'react';
import { Box, Typography, useTheme, alpha, Popover, MenuItem, Stack } from '@mui/material';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import EnterpriseAvatar from '../avatar/Avatar';

interface RichTextEditorProps {
	label?: React.ReactNode;
	value: string;
	onChange: (html: string) => void;
	placeholder?: string;
	minHeight?: number;
	variant?: 'standard' | 'simple';
	/** Caps the plain-text word count; edits that would exceed it are rejected and a live counter is shown below the editor. */
	maxWords?: number;
	/** Set to false when embedding inside an already-bordered container to avoid a double frame. */
	bordered?: boolean;
	error?: boolean;
	mentionSuggestions?: {
		users: Array<{ id: number; username?: string; full_name?: string; email: string }>;
		documents?: Array<{ id: number; public_id: string; file_name: string }>;
		tasks?: Array<{ id: number; public_id: string; title: string }>;
		projectPublicId?: string;
		taskPublicId?: string;
	};
}

const countWords = (html: string): number => {
	if (typeof document === 'undefined') return 0;
	const temp = document.createElement('div');
	temp.innerHTML = html;
	const text = (temp.textContent || temp.innerText || '').trim();
	return text ? text.split(/\s+/).length : 0;
};

const STANDARD_TOOLBAR_OPTIONS = [
	[{ header: [1, 2, 3, false] }],
	['bold', 'italic', 'underline', 'strike'],
	[{ color: [] }, { background: [] }],
	[{ list: 'ordered' }, { list: 'bullet' }],
	[{ align: [] }],
	['blockquote', 'link'],
	['clean'],
];

const SIMPLE_TOOLBAR_OPTIONS = [
	['bold', 'italic'],
	[{ list: 'ordered' }, { list: 'bullet' }],
	[{ align: [] }],
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
	label,
	value,
	onChange,
	placeholder,
	minHeight = 160,
	variant = 'standard',
	maxWords,
	bordered = true,
	error = false,
	mentionSuggestions,
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const [isMentionOpen, setIsMentionOpen] = useState(false);
	const [mentionSearch, setMentionSearch] = useState('');
	const [mentionStartIndex, setMentionStartIndex] = useState(0);

	const quillRef = useRef<ReactQuill>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const modules = useMemo(() => ({
		toolbar: variant === 'simple' ? SIMPLE_TOOLBAR_OPTIONS : STANDARD_TOOLBAR_OPTIONS
	}), [variant]);

	const wordCount = useMemo(() => (maxWords ? countWords(value) : 0), [value, maxWords]);

	const checkMention = () => {
		if (!mentionSuggestions) return;
		const editor = quillRef.current?.getEditor();
		if (!editor) return;

		const range = editor.getSelection();
		if (!range) {
			setIsMentionOpen(false);
			return;
		}

		const textBeforeCursor = editor.getText(0, range.index);
		const lastAtIdx = textBeforeCursor.lastIndexOf('@');

		if (lastAtIdx !== -1) {
			const textAfterAt = textBeforeCursor.substring(lastAtIdx + 1);
			if (!/\s/.test(textAfterAt)) {
				setMentionSearch(textAfterAt);
				setIsMentionOpen(true);
				setMentionStartIndex(lastAtIdx);
				return;
			}
		}

		setIsMentionOpen(false);
	};

	const handleChange = (html: string) => {
		onChange(html);

		// Run mention check on change
		setTimeout(checkMention, 0);
	};

	const handleSelectMention = (type: 'user' | 'file' | 'task', item: any) => {
		const editor = quillRef.current?.getEditor();
		if (!editor) return;

		const range = editor.getSelection();
		const caretIndex = range ? range.index : mentionStartIndex + mentionSearch.length + 1;
		const lengthToDelete = caretIndex - mentionStartIndex;

		// 1. Delete the "@search" string
		editor.deleteText(mentionStartIndex, lengthToDelete);

		// 2. Insert mention html node
		let insertHTML = '';
		if (type === 'user') {
			const displayName = item.full_name || item.username;
			insertHTML = `<strong class="user-mention" style="color: ${theme.palette.primary.main}">@${displayName}</strong> `;
		} else if (type === 'file' && mentionSuggestions) {
			const fileUrl = `/api/v1/project-tasks/${mentionSuggestions.taskPublicId}/files/${item.public_id}/download`;
			insertHTML = `<a href="${fileUrl}" target="_blank" rel="noopener noreferrer">📄 ${item.file_name}</a> `;
		} else if (type === 'task' && mentionSuggestions) {
			const taskUrl = `/projects/${mentionSuggestions.projectPublicId}?task=${item.public_id}`;
			insertHTML = `<a href="${taskUrl}">#${item.title}</a> `;
		}

		editor.clipboard.dangerouslyPasteHTML(mentionStartIndex, insertHTML);
		setIsMentionOpen(false);

		// Focus and set selection range
		setTimeout(() => {
			editor.focus();
			editor.setSelection(mentionStartIndex + editor.getText(mentionStartIndex).indexOf(' ') + 1, 0);
		}, 50);
	};

	// Filter suggestions
	const filteredUsers = useMemo(() => {
		if (!mentionSuggestions) return [];
		return mentionSuggestions.users.filter(u =>
			(u.full_name || '').toLowerCase().includes(mentionSearch.toLowerCase()) ||
			(u.username || '').toLowerCase().includes(mentionSearch.toLowerCase()) ||
			(u.email || '').toLowerCase().includes(mentionSearch.toLowerCase())
		).slice(0, 5);
	}, [mentionSuggestions, mentionSearch]);

	const filteredFiles = useMemo(() => {
		if (!mentionSuggestions || !mentionSuggestions.documents) return [];
		return mentionSuggestions.documents.filter(f =>
			(f.file_name || '').toLowerCase().includes(mentionSearch.toLowerCase())
		).slice(0, 5);
	}, [mentionSuggestions, mentionSearch]);

	const filteredTasks = useMemo(() => {
		if (!mentionSuggestions || !mentionSuggestions.tasks) return [];
		return mentionSuggestions.tasks.filter(t =>
			(t.title || '').toLowerCase().includes(mentionSearch.toLowerCase())
		).slice(0, 5);
	}, [mentionSuggestions, mentionSearch]);

	return (
		<Box ref={containerRef}>
			{label && (
				<Typography variant="awsFieldLabel" component="label">
					{label}
				</Typography>
			)}
			<Box
				sx={{
					borderRadius: bordered ? '10px' : 0,
					overflow: 'hidden',
					border: bordered ? '1px solid' : 'none',
					borderColor: error
						? theme.palette.error.main
						: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)',
					'& .ql-toolbar.ql-snow': {
						borderColor: 'transparent',
						borderBottom: '1px solid',
						borderBottomColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
						bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
					},
					'& .ql-container.ql-snow': {
						borderColor: 'transparent',
						fontFamily: theme.typography.fontFamily,
						fontSize: '0.9375rem',
					},
					'& .ql-editor': {
						minHeight,
						color: theme.palette.text.primary,
						'&.ql-blank::before': {
							color: theme.palette.text.secondary,
							fontStyle: 'normal',
						},
						...(isDark ? {
							'& span[style*="color: rgb(0, 0, 0)"], & span[style*="color: rgb(34, 34, 34)"], & span[style*="color: black"], & [style*="color:#000"], & [style*="color:#000000"]': {
								color: `${theme.palette.text.primary} !important`,
							},
						} : {
							'& span[style*="color: rgb(255, 255, 255)"], & span[style*="color: white"], & [style*="color:#fff"], & [style*="color:#ffffff"], & [style*="color: rgb(250, 250, 250)"]': {
								color: `${theme.palette.text.primary} !important`,
							},
						}),
					},
					'& .ql-snow .ql-stroke': {
						stroke: theme.palette.text.secondary,
					},
					'& .ql-snow .ql-fill': {
						fill: theme.palette.text.secondary,
					},
					'& .ql-snow .ql-picker': {
						color: theme.palette.text.secondary,
					},
					'& .ql-snow.ql-toolbar button:hover .ql-stroke, & .ql-snow .ql-toolbar button:hover .ql-stroke': {
						stroke: theme.palette.primary.main,
					},
					'& .ql-snow.ql-toolbar button:hover .ql-fill, & .ql-snow .ql-toolbar button:hover .ql-fill': {
						fill: theme.palette.primary.main,
					},
					'& .ql-snow.ql-toolbar button.ql-active .ql-stroke, & .ql-snow .ql-toolbar button.ql-active .ql-stroke': {
						stroke: theme.palette.primary.main,
					},
					'& .ql-snow.ql-toolbar button.ql-active .ql-fill, & .ql-snow .ql-toolbar button.ql-active .ql-fill': {
						fill: theme.palette.primary.main,
					},
					...(bordered && {
						'&:focus-within': {
							borderColor: error
								? theme.palette.error.main
								: alpha(theme.palette.primary.main, 0.6),
						},
					}),
				}}
			>
				<ReactQuill
					ref={quillRef}
					theme="snow"
					value={value}
					onChange={handleChange}
					onChangeSelection={checkMention}
					modules={modules}
					placeholder={placeholder}
				/>
			</Box>

			{/* Mentions Popover */}
			{mentionSuggestions && (
				<Popover
					open={isMentionOpen && (filteredUsers.length > 0 || filteredFiles.length > 0 || filteredTasks.length > 0)}
					anchorEl={containerRef.current}
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
												@{u.username}
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
			)}

			{maxWords && (
				<Typography
					variant="caption"
					sx={{ display: 'block', textAlign: 'right', mt: 0.5, color: wordCount >= maxWords ? 'error.main' : 'text.secondary' }}
				>
					{wordCount}/{maxWords} words
				</Typography>
			)}
		</Box>
	);
};

export default RichTextEditor;
