import React, { useMemo } from 'react';
import { Box, Typography, IconButton, Stack, Button, alpha, useTheme } from '@mui/material';
import {
	Close as CloseIcon,
	Work as WorkIcon,
	Description as DescriptionIcon
} from '@mui/icons-material';
import type { CandidateDocument } from '../../../../models/candidate';

interface DrawerHeaderProps {
	candidateName: string;
	jobTitle: string;
	documents: CandidateDocument[];
	onClose: () => void;
	onViewResume: (docId: number) => void;
}

const DrawerHeader: React.FC<DrawerHeaderProps> = ({ 
	candidateName, 
	jobTitle, 
	documents, 
	onClose, 
	onViewResume 
}) => {
	const theme = useTheme();

	// Find the best resume document to display
	const resumeDoc = useMemo(() => {
		if (!documents || documents.length === 0) return null;
		
		// Priority logic for resume selection
		return (
			// 1. Active Trainer Resume
			documents.find(d => 
				(d.document_type === 'resume' || d.document_type?.toLowerCase().includes('resume')) && 
				d.document_source === 'trainer' && 
				d.is_active
			) ||
			// 2. Any Trainer Resume
			documents.find(d => 
				(d.document_type === 'resume' || d.document_type?.toLowerCase().includes('resume')) && 
				d.document_source === 'trainer'
			) ||
			// 3. Active Candidate Resume
			documents.find(d => 
				(d.document_type === 'resume' || d.document_type?.toLowerCase().includes('resume')) && 
				d.is_active
			) ||
			// 4. Any Candidate Resume
			documents.find(d => 
				(d.document_type === 'resume' || d.document_type?.toLowerCase().includes('resume'))
			)
		);
	}, [documents]);

	return (
		<Box sx={{
			p: 2.5,
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'space-between',
			bgcolor: theme.palette.secondary.light,
			color: 'common.white',
			borderBottom: `1px solid ${theme.palette.divider}`
		}}>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
				<Box sx={{ 
					bgcolor: theme.palette.accent.main, 
					p: 1.25, 
					borderRadius: '4px', 
					display: 'flex', 
					boxShadow: `0 2px 4px ${alpha(theme.palette.common.black, 0.2)}` 
				}}>
					<WorkIcon sx={{ color: 'common.white', fontSize: 20 }} />
				</Box>
				<Box>
					<Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2, letterSpacing: '0.2px' }}>
						Placement Lifecycle
					</Typography>
					<Typography variant="caption" sx={{ color: alpha(theme.palette.common.white, 0.7), fontSize: '0.75rem', fontWeight: 500 }}>
						{candidateName} • {jobTitle}
					</Typography>
				</Box>
			</Box>
			<Stack direction="row" spacing={1} alignItems="center">
				{resumeDoc && (
					<Button
						size="small"
						startIcon={<DescriptionIcon sx={{ fontSize: 16 }} />}
						onClick={() => onViewResume(resumeDoc.id)}
						sx={{
							textTransform: 'none',
							color: 'common.white',
							fontWeight: 700,
							bgcolor: alpha(theme.palette.common.white, 0.1),
							px: 2,
							'&:hover': { bgcolor: alpha(theme.palette.common.white, 0.2) }
						}}
					>
						Resume
					</Button>
				)}
				<IconButton onClick={onClose} sx={{ color: 'common.white', '&:hover': { bgcolor: alpha(theme.palette.common.white, 0.1) } }}>
					<CloseIcon fontSize="small" />
				</IconButton>
			</Stack>
		</Box>
	);
};

export default DrawerHeader;
