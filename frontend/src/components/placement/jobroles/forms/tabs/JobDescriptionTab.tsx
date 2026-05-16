import React, { useRef, useState } from 'react';
import {
	Grid,
	TextField,
	Box,
	Stack,
	IconButton,
	Tooltip,
	Divider,
	Typography,
	Paper,
	ToggleButtonGroup,
	ToggleButton
} from '@mui/material';
import {
	FormatBold as BoldIcon,
	FormatItalic as ItalicIcon,
	FormatListBulleted as ListIcon,
	FormatListNumbered as NumberedIcon,
	FormatQuote as QuoteIcon,
	Code as CodeIcon,
	DescriptionOutlined as DescriptionIcon,
	InfoOutlined as InfoIcon,
	Edit as EditIcon,
	Visibility as PreviewIcon
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { awsStyles } from '../../../../../theme/theme';
import type { JobRole } from '../../../../../models/jobRole';

interface JobDescriptionTabProps {
	formData: Partial<JobRole>;
	handleChange: (field: string, value: any) => void;
	highlightMissing?: boolean;
}

const JobDescriptionTab: React.FC<JobDescriptionTabProps> = ({
	formData,
	handleChange,
	highlightMissing
}) => {
	const { awsPanel, helperBox } = awsStyles;
	const textFieldRef = useRef<HTMLTextAreaElement>(null);
	const [activeView, setActiveView] = useState<'edit' | 'preview'>('edit');

	const applyFormatting = (prefix: string, suffix: string = '', isBlock: boolean = false) => {
		const textField = textFieldRef.current;
		if (!textField) return;

		const start = textField.selectionStart;
		const end = textField.selectionEnd;
		const text = formData.description || '';
		const selectedText = text.substring(start, end);

		let replacement = '';
		let needsNewline = false;
		
		if (isBlock) {
			const beforeText = text.substring(0, start);
			needsNewline = beforeText.length > 0 && !beforeText.endsWith('\n');
			
			// Multi-line support for lists
			if (selectedText.includes('\n')) {
				replacement = (needsNewline ? '\n' : '') + selectedText
					.split('\n')
					.map(line => (line.trim() && !line.startsWith(prefix.trim())) ? `${prefix}${line}` : line)
					.join('\n');
			} else {
				replacement = `${needsNewline ? '\n' : ''}${prefix}${selectedText}${suffix}`;
			}
		} else {
			replacement = `${prefix}${selectedText}${suffix}`;
		}

		const newText = text.substring(0, start) + replacement + text.substring(end);
		handleChange('description', newText);

		// Re-focus and set selection
		setTimeout(() => {
			if (textFieldRef.current) {
				const textField = textFieldRef.current;
				textField.focus();
				const newPos = start + (needsNewline ? 1 : 0);
				textField.setSelectionRange(newPos, newPos + replacement.length - (needsNewline ? 1 : 0));
			}
		}, 0);
	};

	return (
		<Stack spacing={4}>
			<Paper elevation={0} sx={awsPanel}>
				<Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
					<Box sx={{ bgcolor: 'secondary.main', p: 0.5, borderRadius: '2px', display: 'flex' }}>
						<DescriptionIcon sx={{ color: '#ffffff', fontSize: 20 }} />
					</Box>
					<Typography variant="awsSectionTitle">Comprehensive Job Narrative</Typography>
				</Stack>

				<Box sx={helperBox}>
					<InfoIcon sx={{ color: '#007eb9', mt: 0.25, fontSize: 20 }} />
					<Typography variant="body2" sx={{ color: '#007eb9', fontWeight: 500 }}>
						Provide a detailed overview of the role using the formatting toolbar for bullet points and emphasis. This content is Markdown-compatible.
					</Typography>
				</Box>

				<Divider sx={{ mb: 4, borderColor: '#eaeded' }} />

				<Grid container spacing={2} sx={{ width: '100%' }}>
					<Grid size={{ xs: 12 }}>
						<Box sx={{ width: '100%', mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<Stack direction="row" spacing={2} alignItems="center">
								<Typography variant="awsFieldLabel" sx={{ mb: 0 }}>Job Description Content</Typography>
								{highlightMissing && (!formData.description || formData.description.length < 10) && (
									<Typography variant="caption" sx={{ color: '#ec7211', fontWeight: 700 }}>VERIFICATION REQUIRED</Typography>
								)}
							</Stack>
							<ToggleButtonGroup
								value={activeView}
								exclusive
								onChange={(_, v) => v && setActiveView(v)}
								size="small"
								aria-label="editor view"
								sx={{ height: 32 }}
							>
								<ToggleButton value="edit" aria-label="edit view" sx={{ textTransform: 'none', px: 1.5, gap: 1, fontWeight: 700 }}>
									<EditIcon sx={{ fontSize: 16 }} /> Edit
								</ToggleButton>
								<ToggleButton value="preview" aria-label="preview view" sx={{ textTransform: 'none', px: 1.5, gap: 1, fontWeight: 700 }}>
									<PreviewIcon sx={{ fontSize: 16 }} /> Preview
								</ToggleButton>
							</ToggleButtonGroup>
						</Box>

						<Box sx={{ 
							border: highlightMissing && (!formData.description || formData.description.length < 10) ? '1px dashed #ec7211' : '1px solid #d5dbdb', 
							borderRadius: '2px', 
							bgcolor: highlightMissing && (!formData.description || formData.description.length < 10) ? 'rgba(236, 114, 17, 0.03)' : (activeView === 'preview' ? '#fbfbfb' : '#fafafa'),
							overflow: 'hidden',
							minHeight: 400
						}}>
							{/* Formatting Toolbar - Only visible in Edit mode */}
							{activeView === 'edit' && (
								<Stack 
									direction="row" 
									spacing={0.5} 
									sx={{ 
										p: 0.5, 
										bgcolor: '#fff', 
										borderBottom: '1px solid #d5dbdb' 
									}}
								>
									<Tooltip title="Bold (Markdown)">
										<IconButton size="small" onClick={() => applyFormatting('**', '**')}>
											<BoldIcon fontSize="small" />
										</IconButton>
									</Tooltip>
									<Tooltip title="Italic (Markdown)">
										<IconButton size="small" onClick={() => applyFormatting('_', '_')}>
											<ItalicIcon fontSize="small" />
										</IconButton>
									</Tooltip>
									<Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
									<Tooltip title="Bullet List">
										<IconButton size="small" onClick={() => applyFormatting('- ', '', true)}>
											<ListIcon fontSize="small" />
										</IconButton>
									</Tooltip>
									<Tooltip title="Numbered List">
										<IconButton size="small" onClick={() => applyFormatting('1. ', '', true)}>
											<NumberedIcon fontSize="small" />
										</IconButton>
									</Tooltip>
									<Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
									<Tooltip title="Quote">
										<IconButton size="small" onClick={() => applyFormatting('> ', '', true)}>
											<QuoteIcon fontSize="small" />
										</IconButton>
									</Tooltip>
									<Tooltip title="Code">
										<IconButton size="small" onClick={() => applyFormatting('`', '`')}>
											<CodeIcon fontSize="small" />
										</IconButton>
									</Tooltip>
								</Stack>
							)}

							{/* Editor Area */}
							{activeView === 'edit' ? (
								<TextField
									fullWidth
									multiline
									rows={15}
									placeholder="Enter detailed job description here..."
									value={formData.description || ''}
									onChange={(e) => handleChange('description', e.target.value)}
									inputRef={textFieldRef}
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: 0,
											'& fieldset': { border: 'none' },
											bgcolor: 'white',
											fontFamily: '"Roboto Mono", monospace',
											fontSize: '0.875rem',
											lineHeight: 1.6,
											p: 2
										}
									}}
								/>
							) : (
								<Box sx={{ 
									p: 3, 
									bgcolor: 'white', 
									minHeight: 400,
									overflowY: 'auto',
									maxHeight: 400,
									color: '#545b64', 
									lineHeight: 1.7, 
									fontSize: '0.95rem',
									'& p': { mb: 2 },
									'& ul, & ol': { mb: 2, pl: 3 },
									'& li': { mb: 1 },
									'& strong, & b': { color: '#232f3e', fontWeight: 700 },
									'& h1, & h2, & h3': { color: '#232f3e', mt: 3, mb: 1, fontWeight: 700 }
								}}>
									<ReactMarkdown remarkPlugins={[remarkGfm]}>
										{formData.description || '_No description entered yet._'}
									</ReactMarkdown>
								</Box>
							)}
							
							{/* Footer info */}
							<Box sx={{ p: 1, borderTop: '1px solid #f2f3f3', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fff' }}>
								<Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>
									{activeView === 'edit' ? 'Supported: Markdown syntax' : 'Live Preview'}
								</Typography>
								<Typography variant="caption" sx={{ 
									color: (formData.description || '').length > 2000 ? 'error.main' : 'text.secondary', 
									mr: 1,
									fontWeight: 600
								}}>
									{(formData.description || '').length}/2000 characters
								</Typography>
							</Box>
						</Box>
					</Grid>
				</Grid>
			</Paper>
		</Stack>
	);
};

export default JobDescriptionTab;
