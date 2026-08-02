import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const BRAND = '#8B7CF6';

/** Renders an assistant message's markdown (bold/italic/lists/code/tables) with MUI-themed
 * elements -- user messages stay plain text (they're what the person literally typed). Shared
 * across every IRIS chat surface so assistant replies read identically everywhere. */
export const MarkdownMessage: React.FC<{ content: string }> = ({ content }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	return (
		<Box sx={{ fontSize: '0.85rem', lineHeight: 1.65, '& > *:first-of-type': { mt: 0 }, '& > *:last-of-type': { mb: 0 } }}>
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				components={{
					p: ({ children }) => (
						<Typography variant="body2" sx={{ fontSize: 'inherit', lineHeight: 'inherit', my: 0.75 }}>{children}</Typography>
					),
					strong: ({ children }) => <Box component="strong" sx={{ fontWeight: 700 }}>{children}</Box>,
					em: ({ children }) => <Box component="em" sx={{ fontStyle: 'italic' }}>{children}</Box>,
					ul: ({ children }) => (
						<Box component="ul" sx={{ pl: 2.25, my: 0.5, display: 'flex', flexDirection: 'column', gap: 0.35 }}>{children}</Box>
					),
					ol: ({ children }) => (
						<Box component="ol" sx={{ pl: 2.25, my: 0.5, display: 'flex', flexDirection: 'column', gap: 0.35 }}>{children}</Box>
					),
					li: ({ children }) => <Box component="li" sx={{ fontSize: '0.85rem' }}>{children}</Box>,
					a: ({ href, children }) => (
						<Box
							component="a"
							href={href}
							target="_blank"
							rel="noopener noreferrer"
							sx={{ color: BRAND, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '2px' }}
						>
							{children}
						</Box>
					),
					code: ({ className, children }) => {
						const isBlock = /language-/.test(className || '');
						if (isBlock) {
							return (
								<Box component="code" className={className} sx={{ fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace', fontSize: '0.78rem' }}>
									{children}
								</Box>
							);
						}
						return (
							<Box
								component="code"
								sx={{
									fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
									fontSize: '0.8em',
									bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
									px: 0.6,
									py: 0.15,
									borderRadius: '4px',
								}}
							>
								{children}
							</Box>
						);
					},
					pre: ({ children }) => (
						<Box
							component="pre"
							sx={{
								overflowX: 'auto',
								p: 1.25,
								my: 0.75,
								borderRadius: '8px',
								bgcolor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.04)',
								border: '1px solid',
								borderColor: 'divider',
							}}
						>
							{children}
						</Box>
					),
					table: ({ children }) => (
						<Box sx={{ overflowX: 'auto', my: 0.75 }}>
							<Box component="table" sx={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.8rem' }}>{children}</Box>
						</Box>
					),
					th: ({ children }) => (
						<Box component="th" sx={{ textAlign: 'left', borderBottom: '2px solid', borderColor: 'divider', p: 0.6, fontWeight: 700 }}>{children}</Box>
					),
					td: ({ children }) => (
						<Box component="td" sx={{ borderBottom: '1px solid', borderColor: 'divider', p: 0.6 }}>{children}</Box>
					),
				}}
			>
				{content}
			</ReactMarkdown>
		</Box>
	);
};

export default MarkdownMessage;
