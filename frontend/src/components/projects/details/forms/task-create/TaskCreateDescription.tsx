import React from 'react';
import { Box, Stack, Typography, IconButton, Tab, Tabs, Divider, useTheme } from '@mui/material';
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
} from '@mui/icons-material';
import { RichTextViewer } from '../../../../common/form';

interface TaskCreateDescriptionProps {
	description: string;
	setDescription: (val: string) => void;
	editTab: number;
	setEditTab: (val: number) => void;
	isDescFocused: boolean;
	setIsDescFocused: (val: boolean) => void;
}

export const TaskCreateDescription: React.FC<TaskCreateDescriptionProps> = ({
	description,
	setDescription,
	editTab,
	setEditTab,
	isDescFocused,
	setIsDescFocused,
}) => {
	const theme = useTheme();

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

	return (
		<Stack spacing={1}>
			<Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem', color: 'text.primary' }}>
				Add a description
			</Typography>
			<Box
				sx={{
					border: '1px solid',
					borderColor: isDescFocused ? theme.palette.primary.main : theme.palette.divider,
					borderRadius: '6px',
					overflow: 'hidden',
					bgcolor: 'transparent',
					transition: 'border-color 0.15s ease-in-out',
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
							<RichTextViewer html={description} />
						) : (
							<Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', textAlign: 'center', py: 4 }}>
								Nothing to preview. Type description in the "Write" tab.
							</Typography>
						)}
					</Box>
				)}

				{/* Editor Footer */}
				<Box
					sx={{
						px: 2,
						py: 1.25,
						borderTop: '1px dashed',
						borderColor: theme.palette.divider,
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						bgcolor: theme.palette.background.default,
					}}
				>
					<Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'text.secondary', cursor: 'pointer', '&:hover': { color: 'text.primary' } }}>
						<AttachFile sx={{ fontSize: 16 }} />
						<Typography variant="caption" sx={{ fontWeight: 500 }}>
							Paste, drop, or click to add files
						</Typography>
					</Stack>

					<Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'text.secondary', cursor: 'pointer', '&:hover': { color: 'primary.main' } }}>
						<AutoAwesomeOutlined sx={{ fontSize: 14 }} />
						<Typography variant="caption" sx={{ fontWeight: 600 }}>
							Write with Gravit
						</Typography>
					</Stack>
				</Box>
			</Box>
		</Stack>
	);
};
