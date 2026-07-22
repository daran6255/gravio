import React, { useRef, useState } from 'react';
import { Box, Stack, Typography, IconButton, Tab, Tabs, Divider, useTheme, alpha, Tooltip, CircularProgress } from '@mui/material';
import {
	FormatBold,
	FormatItalic,
	FormatQuote,
	Code,
	Link as LinkIcon,
	AttachFile,
	FormatListNumbered,
	FormatListBulleted,
	PlaylistAddCheck,
	AutoAwesomeOutlined,
	InsertDriveFileOutlined,
	ImageOutlined,
	PictureAsPdfOutlined,
	TableChartOutlined,
	CloseOutlined,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import projectService from '../../../../../services/projectService';
import useToast from '../../../../../hooks/useToast';

interface TaskCreateDescriptionProps {
	description: string;
	setDescription: (val: string) => void;
	editTab: number;
	setEditTab: (val: number) => void;
	isDescFocused: boolean;
	setIsDescFocused: (val: boolean) => void;
	pendingFiles: File[];
	onFilesSelected: (files: FileList | File[]) => void;
	onRemoveFile: (index: number) => void;
	uploading?: boolean;
}

const fileIconFor = (mimeType: string) => {
	if (mimeType.startsWith('image/')) return ImageOutlined;
	if (mimeType === 'application/pdf') return PictureAsPdfOutlined;
	if (mimeType.includes('spreadsheet') || mimeType === 'text/csv') return TableChartOutlined;
	return InsertDriveFileOutlined;
};

const formatFileSize = (bytes: number) => {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const TaskCreateDescription: React.FC<TaskCreateDescriptionProps> = ({
	description,
	setDescription,
	editTab,
	setEditTab,
	isDescFocused,
	setIsDescFocused,
	pendingFiles,
	onFilesSelected,
	onRemoveFile,
	uploading = false,
}) => {
	const theme = useTheme();
	const toast = useToast();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [isEnhancing, setIsEnhancing] = useState(false);

	const handleEnhanceDescription = async () => {
		if (isEnhancing) return;
		setIsEnhancing(true);
		try {
			const mode = description.trim() ? 'improve' : 'expand';
			const enhanced = await projectService.enhanceDescription(description, mode);
			setDescription(enhanced);
		} catch (err: any) {
			toast.error(err?.response?.data?.error?.message || 'IRIS could not enhance this description');
		} finally {
			setIsEnhancing(false);
		}
	};

	const insertMarkdown = (syntax: string) => {
		const textarea = document.getElementById('create-task-desc-textarea') as HTMLTextAreaElement;
		if (!textarea) return;
		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const text = textarea.value;
		const selected = text.substring(start, end);
		
		let replacement = '';
		if (syntax === 'bold') replacement = `**${selected || 'bold text'}**`;
		else if (syntax === 'italic') replacement = `*${selected || 'italic text'}*`;
		else if (syntax === 'code') replacement = `\`${selected || 'code'}\``;
		else if (syntax === 'quote') replacement = `> ${selected || 'quote'}\n`;
		else if (syntax === 'h') replacement = `### ${selected || 'Heading'}\n`;
		else if (syntax === 'link') replacement = `[${selected || 'link text'}](url)`;
		else if (syntax === 'list') replacement = `- ${selected || 'item'}\n`;
		else if (syntax === 'numlist') replacement = `1. ${selected || 'item'}\n`;
		else if (syntax === 'tasklist') replacement = `- [ ] ${selected || 'task'}\n`;
		
		setDescription(text.substring(0, start) + replacement + text.substring(end));
		
		setTimeout(() => {
			textarea.focus();
			textarea.setSelectionRange(start + replacement.length, start + replacement.length);
		}, 0);
	};

	const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
		const files = Array.from(e.clipboardData.files || []);
		if (files.length > 0) {
			e.preventDefault();
			onFilesSelected(files);
		}
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		if (!uploading) setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragging(false);
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragging(false);
		if (uploading || !e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
		onFilesSelected(e.dataTransfer.files);
	};

	const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) onFilesSelected(e.target.files);
		e.target.value = '';
	};

	return (
		<Stack spacing={1}>
			<Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem', color: 'text.primary' }}>
				Add a description
			</Typography>
			<Box
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				sx={{
					border: '1px solid',
					borderColor: isDragging ? theme.palette.primary.main : (isDescFocused ? theme.palette.primary.main : theme.palette.divider),
					borderRadius: '6px',
					overflow: 'hidden',
					bgcolor: isDragging ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
					transition: 'border-color 0.15s ease-in-out, background-color 0.15s ease-in-out',
				}}
			>
				{/* Editor Header: Tabs + Formatting Toolbar */}
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						borderBottom: '1px solid',
						borderColor: theme.palette.divider,
						bgcolor: theme.palette.action.hover,
						px: 1,
					}}
				>
					<Tabs
						value={editTab}
						onChange={(_, v) => setEditTab(v)}
						sx={{
							minHeight: '38px',
							'& .MuiTabs-indicator': { display: 'none' },
							'& .MuiTabs-flexContainer': { gap: '4px', pt: '6px' },
						}}
					>
						{['Write', 'Preview'].map((label) => (
							<Tab
								key={label}
								label={label}
								sx={{
									textTransform: 'none',
									fontWeight: 600,
									fontSize: '0.8rem',
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
										bgcolor: theme.palette.background.paper,
										borderColor: theme.palette.divider,
										borderBottom: '1px solid',
										borderBottomColor: theme.palette.background.paper,
										marginBottom: '-1px',
										position: 'relative',
										zIndex: 2,
									},
								}}
							/>
						))}
					</Tabs>

					{/* Toolbar */}
					{editTab === 0 && (
						<Stack direction="row" spacing={0.25} alignItems="center" sx={{ pr: 1 }}>
							<IconButton size="small" onClick={() => insertMarkdown('h')} title="Heading" sx={{ color: 'text.secondary', p: 0.5 }}>
								<Typography sx={{ fontSize: '0.8rem', fontWeight: 800 }}>H</Typography>
							</IconButton>
							<IconButton size="small" onClick={() => insertMarkdown('bold')} title="Bold" sx={{ color: 'text.secondary', p: 0.5 }}>
								<FormatBold fontSize="small" style={{ fontSize: 16 }} />
							</IconButton>
							<IconButton size="small" onClick={() => insertMarkdown('italic')} title="Italic" sx={{ color: 'text.secondary', p: 0.5 }}>
								<FormatItalic fontSize="small" style={{ fontSize: 16 }} />
							</IconButton>
							<IconButton size="small" onClick={() => insertMarkdown('quote')} title="Quote" sx={{ color: 'text.secondary', p: 0.5 }}>
								<FormatQuote fontSize="small" style={{ fontSize: 16 }} />
							</IconButton>
							<IconButton size="small" onClick={() => insertMarkdown('code')} title="Code" sx={{ color: 'text.secondary', p: 0.5 }}>
								<Code fontSize="small" style={{ fontSize: 16 }} />
							</IconButton>
							<IconButton size="small" onClick={() => insertMarkdown('link')} title="Link" sx={{ color: 'text.secondary', p: 0.5 }}>
								<LinkIcon fontSize="small" style={{ fontSize: 16 }} />
							</IconButton>
							<Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 1 }} />
							<IconButton size="small" onClick={() => insertMarkdown('numlist')} title="Numbered List" sx={{ color: 'text.secondary', p: 0.5 }}>
								<FormatListNumbered fontSize="small" style={{ fontSize: 16 }} />
							</IconButton>
							<IconButton size="small" onClick={() => insertMarkdown('list')} title="Bulleted List" sx={{ color: 'text.secondary', p: 0.5 }}>
								<FormatListBulleted fontSize="small" style={{ fontSize: 16 }} />
							</IconButton>
							<IconButton size="small" onClick={() => insertMarkdown('tasklist')} title="Task List" sx={{ color: 'text.secondary', p: 0.5 }}>
								<PlaylistAddCheck fontSize="small" style={{ fontSize: 18 }} />
							</IconButton>
						</Stack>
					)}
				</Box>

				{/* Edit area or Preview Area */}
				{editTab === 0 ? (
					<textarea
						id="create-task-desc-textarea"
						placeholder="Type your description here..."
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						onFocus={() => setIsDescFocused(true)}
						onBlur={() => setIsDescFocused(false)}
						onPaste={handlePaste}
						style={{
							width: '100%',
							minHeight: '130px',
							padding: '16px',
							fontSize: '0.875rem',
							fontFamily: 'inherit',
							backgroundColor: 'transparent',
							border: 'none',
							outline: 'none',
							color: theme.palette.text.primary,
							resize: 'vertical',
							boxSizing: 'border-box',
						}}
					/>
				) : (
					<Box sx={{ p: 2, minHeight: 130, overflowY: 'auto' }}>
						{description.trim() ? (
							<Box
								sx={{
									color: 'text.secondary',
									fontSize: '0.875rem',
									lineHeight: 1.57,
									wordBreak: 'break-word',
									overflowWrap: 'break-word',
									'& p': { m: 0, mb: 1 },
									'& p:last-child': { mb: 0 },
									'& ul, & ol': { pl: 3, mb: 1 },
									'& li': { mb: 0.25 },
									'& a': { color: theme.palette.primary.main },
									'& h1, & h2, & h3': { color: 'text.primary', fontWeight: 700, mt: 0, mb: 1 },
									'& h3': { fontSize: '1rem' },
									'& code': {
										bgcolor: theme.palette.action.hover,
										px: 0.5,
										py: 0.125,
										borderRadius: '4px',
										fontSize: '0.85em',
										fontFamily: 'monospace',
									},
									'& blockquote': {
										borderLeft: '3px solid',
										borderColor: 'divider',
										pl: 1.5,
										ml: 0,
										color: 'text.secondary',
									},
									'& input[type="checkbox"]': { mr: 0.75 },
								}}
							>
								<ReactMarkdown remarkPlugins={[remarkGfm]}>{description}</ReactMarkdown>
							</Box>
						) : (
							<Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', textAlign: 'center', py: 4 }}>
								Nothing to preview. Type description in the "Write" tab.
							</Typography>
						)}
					</Box>
				)}

				{/* Pending attachments */}
				{pendingFiles.length > 0 && (
					<Stack
						spacing={0.5}
						sx={{
							px: 2,
							py: 1.25,
							borderTop: '1px dashed',
							borderColor: theme.palette.divider,
							bgcolor: theme.palette.background.default,
						}}
					>
						{pendingFiles.map((file, index) => {
							const FileIcon = fileIconFor(file.type);
							return (
								<Stack
									key={`${file.name}-${index}`}
									direction="row"
									alignItems="center"
									spacing={1}
									sx={{
										px: 1,
										py: 0.5,
										borderRadius: '6px',
										bgcolor: theme.palette.action.hover,
									}}
								>
									<FileIcon sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
									<Typography noWrap sx={{ flex: 1, fontSize: '0.78rem', fontWeight: 600, color: 'text.primary' }}>
										{file.name}
									</Typography>
									<Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', flexShrink: 0 }}>
										{formatFileSize(file.size)}
									</Typography>
									<IconButton
										size="small"
										disabled={uploading}
										onClick={() => onRemoveFile(index)}
										sx={{ p: 0.25, color: 'text.secondary', '&:hover': { color: 'error.main' } }}
									>
										<CloseOutlined sx={{ fontSize: 14 }} />
									</IconButton>
								</Stack>
							);
						})}
					</Stack>
				)}

				{/* Editor Footer */}
				<Box
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
					sx={{
						px: 2,
						py: 1.25,
						borderTop: '1px dashed',
						borderColor: theme.palette.divider,
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						bgcolor: isDragging ? alpha(theme.palette.primary.main, 0.04) : theme.palette.background.default,
					}}
				>
					<Tooltip title="Up to 10MB per file — PDF, images, Office docs, CSV, text, zip">
						<Stack
							direction="row"
							spacing={0.5}
							alignItems="center"
							onClick={() => !uploading && fileInputRef.current?.click()}
							sx={{ color: uploading ? 'text.disabled' : 'text.secondary', cursor: uploading ? 'default' : 'pointer', '&:hover': uploading ? undefined : { color: 'text.primary' } }}
						>
							{uploading ? <CircularProgress size={14} /> : <AttachFile sx={{ fontSize: 16 }} />}
							<Typography variant="caption" sx={{ fontWeight: 500 }}>
								{uploading ? 'Uploading…' : 'Paste, drop, or click to add files'}
							</Typography>
						</Stack>
					</Tooltip>
					<input
						type="file"
						multiple
						ref={fileInputRef}
						onChange={handleFileInputChange}
						style={{ display: 'none' }}
					/>

					<Stack
						direction="row"
						spacing={0.5}
						alignItems="center"
						onClick={handleEnhanceDescription}
						sx={{
							color: isEnhancing ? 'text.disabled' : 'text.secondary',
							cursor: isEnhancing ? 'default' : 'pointer',
							'&:hover': { color: isEnhancing ? 'text.disabled' : 'primary.main' },
						}}
					>
						{isEnhancing ? <CircularProgress size={14} /> : <AutoAwesomeOutlined sx={{ fontSize: 14 }} />}
						<Typography variant="caption" sx={{ fontWeight: 600 }}>
							{isEnhancing ? 'Writing…' : 'Write with Gravit'}
						</Typography>
					</Stack>
				</Box>
			</Box>
		</Stack>
	);
};
