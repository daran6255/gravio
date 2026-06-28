import React, { useMemo } from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface RichTextEditorProps {
	label?: string;
	value: string;
	onChange: (html: string) => void;
	placeholder?: string;
	minHeight?: number;
	variant?: 'standard' | 'simple';
	/** Caps the plain-text word count; edits that would exceed it are rejected and a live counter is shown below the editor. */
	maxWords?: number;
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
	maxWords
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const modules = useMemo(() => ({
		toolbar: variant === 'simple' ? SIMPLE_TOOLBAR_OPTIONS : STANDARD_TOOLBAR_OPTIONS
	}), [variant]);

	const wordCount = useMemo(() => (maxWords ? countWords(value) : 0), [value, maxWords]);

	const handleChange = (html: string) => {
		if (maxWords && countWords(html) > maxWords) return;
		onChange(html);
	};

	return (
		<Box>
			{label && (
				<Typography variant="awsFieldLabel" component="label">
					{label}
				</Typography>
			)}
			<Box
				sx={{
					borderRadius: '10px',
					overflow: 'hidden',
					border: '1px solid',
					borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)',
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
						...(isDark && {
							'& span[style*="color: rgb(0, 0, 0)"], & span[style*="color: rgb(34, 34, 34)"], & span[style*="color: black"], & [style*="color:#000"], & [style*="color:#000000"]': {
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
					'& .ql-picker-options': {
						bgcolor: theme.palette.background.paper,
						border: '1px solid',
						borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
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
					'&:focus-within': {
						borderColor: alpha(theme.palette.primary.main, 0.6),
					},
				}}
			>
				<ReactQuill theme="snow" value={value} onChange={handleChange} modules={modules} placeholder={placeholder} />
			</Box>
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
