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
}

const TOOLBAR_OPTIONS = [
	[{ header: [1, 2, 3, false] }],
	['bold', 'italic', 'underline', 'strike'],
	[{ color: [] }, { background: [] }],
	[{ list: 'ordered' }, { list: 'bullet' }],
	[{ align: [] }],
	['blockquote', 'link'],
	['clean'],
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ label, value, onChange, placeholder, minHeight = 160 }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const modules = useMemo(() => ({ toolbar: TOOLBAR_OPTIONS }), []);

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
				<ReactQuill theme="snow" value={value} onChange={onChange} modules={modules} placeholder={placeholder} />
			</Box>
		</Box>
	);
};

export default RichTextEditor;
