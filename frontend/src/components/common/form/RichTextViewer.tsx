import React, { useMemo } from 'react';
import { Box, useTheme } from '@mui/material';
import DOMPurify from 'dompurify';

interface RichTextViewerProps {
	html: string;
}

export const RichTextViewer: React.FC<RichTextViewerProps> = ({ html }) => {
	const theme = useTheme();
	const clean = useMemo(() => DOMPurify.sanitize(html), [html]);

	return (
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
				'& a': { color: theme.palette.primary.main },
				'& blockquote': {
					borderLeft: '3px solid',
					borderColor: 'divider',
					pl: 1.5,
					ml: 0,
					color: 'text.secondary',
				},
				...(theme.palette.mode === 'dark' ? {
					'& span[style*="color: rgb(0, 0, 0)"], & span[style*="color: rgb(34, 34, 34)"], & span[style*="color: black"], & [style*="color:#000"], & [style*="color:#000000"]': {
						color: `${theme.palette.text.primary} !important`,
					},
				} : {
					'& span[style*="color: rgb(255, 255, 255)"], & span[style*="color: white"], & [style*="color:#fff"], & [style*="color:#ffffff"], & [style*="color: rgb(250, 250, 250)"]': {
						color: `${theme.palette.text.primary} !important`,
					},
				}),
			}}
			dangerouslySetInnerHTML={{ __html: clean }}
		/>
	);
};

export default RichTextViewer;
