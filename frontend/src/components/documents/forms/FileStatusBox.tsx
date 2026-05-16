import React from 'react';
import { Box, Paper, Typography, Stack, IconButton, useTheme, alpha } from '@mui/material';
import {
	Description as FileIcon,
	Visibility as PreviewIcon,
	Delete as DeleteIcon
} from '@mui/icons-material';
import type { CandidateDocument } from '../../../models/candidate';
import { useDateTime } from '../../../hooks/useDateTime';

interface FileStatusBoxProps {
	document: CandidateDocument;
	onPreview: (id: number) => void;
	onDelete: (id: number) => void;
}

/**
 * FileStatusBox - Specialized indicator for an uploaded document.
 * Fully theme-aligned with zero hardcoded colors.
 */
const FileStatusBox: React.FC<FileStatusBoxProps> = ({ document, onPreview, onDelete }) => {
	const theme = useTheme();
	const { formatDate } = useDateTime();

	return (
		<Box sx={{ width: '100%', mt: 2 }}>
			<Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
				<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.05em' }}>
					UPLOADED ON {formatDate(document.created_at).toUpperCase()}
				</Typography>
			</Box>
			<Paper 
				elevation={0} 
				sx={{
					p: 1.25,
					bgcolor: alpha(theme.palette.action.hover, 0.04),
					borderRadius: 1.25,
					border: '1px solid',
					borderColor: 'divider',
					display: 'grid',
					gridTemplateColumns: 'auto 1fr auto',
					alignItems: 'center',
					gap: 1.5,
					transition: 'all 0.2s ease',
					'&:hover': {
						bgcolor: alpha(theme.palette.primary.main, 0.04),
						borderColor: 'primary.light'
					}
				}}
			>
				{/* FILE ICON */}
				<Box sx={{ 
					p: 0.75, 
					bgcolor: 'background.paper', 
					borderRadius: 1, 
					border: '1px solid', 
					borderColor: 'divider', 
					display: 'flex', 
					flexShrink: 0 
				}}>
					<FileIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
				</Box>

				{/* FILENAME & SIZE */}
				<Box sx={{ minWidth: 0 }}>
					<Typography variant="body2" sx={{ 
						fontWeight: 700, 
						color: 'secondary.main', 
						fontSize: '0.75rem',
						lineHeight: 1.25,
						display: '-webkit-box',
						WebkitLineClamp: 2,
						WebkitBoxOrient: 'vertical',
						overflow: 'hidden',
						wordBreak: 'break-word'
					}}>
						{document.document_name}
					</Typography>
					<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', display: 'block', mt: 0.25 }}>
						{(document.file_size ? (document.file_size / 1024).toFixed(0) + ' KB' : 'PDF Document')}
					</Typography>
				</Box>

				{/* ACTIONS */}
				<Stack direction="row" spacing={0.5} sx={{ borderLeft: '1px solid', borderColor: 'divider', pl: 1, ml: 0.5, flexShrink: 0 }}>
					<IconButton
						size="small"
						onClick={() => onPreview(document.id)}
						sx={{ 
							color: 'primary.main', 
							p: 0.5, 
							'&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) } 
						}}
					>
						<PreviewIcon fontSize="small" />
					</IconButton>
					<IconButton
						size="small"
						color="error"
						onClick={() => onDelete(document.id)}
						sx={{ 
							p: 0.5, 
							'&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) } 
						}}
					>
						<DeleteIcon fontSize="small" />
					</IconButton>
				</Stack>
			</Paper>
		</Box>
	);
};

export default FileStatusBox;
