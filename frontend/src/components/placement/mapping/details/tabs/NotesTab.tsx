import React from 'react';
import { Box, Typography, Stack, Button, useTheme, Paper, TextField, Avatar } from '@mui/material';
import {
	Notes as NotesIcon,
	Send as SendIcon,
} from '@mui/icons-material';
import { formatDateIST, formatTimeIST } from '../drawerUtils';

interface NotesTabProps {
	notes: any[];
	newNote: string;
	onNewNoteChange: (value: string) => void;
	onAddNote: () => void;
	isAdding: boolean;
}

const NotesTab: React.FC<NotesTabProps> = ({ 
	notes, 
	newNote, 
	onNewNoteChange, 
	onAddNote, 
	isAdding 
}) => {
	const theme = useTheme();

	return (
		<Box>
			<Box sx={{ mb: 4 }}>
				<Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.text.secondary, mb: 1, display: 'block' }}>
					Add Private Observation
				</Typography>
				<TextField
					multiline
					rows={3}
					fullWidth
					placeholder="Only visible to internal recruitment team..."
					value={newNote}
					onChange={(e) => onNewNoteChange(e.target.value)}
					sx={{
						bgcolor: theme.palette.background.paper,
						'& .MuiOutlinedInput-root': { borderRadius: '4px' }
					}}
				/>
				<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
					<Button
						variant="contained"
						size="small"
						endIcon={<SendIcon sx={{ fontSize: 14 }} />}
						onClick={onAddNote}
						disabled={!newNote.trim() || isAdding}
						sx={{
							textTransform: 'none',
							bgcolor: theme.palette.accent.main,
							fontWeight: 700,
							borderRadius: '4px',
							px: 3,
							'&:hover': { bgcolor: theme.palette.accent.dark }
						}}
					>
						{isAdding ? 'Posting...' : 'Commit Note'}
					</Button>
				</Box>
			</Box>

			<Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.text.primary, mb: 2 }}>
				Note History
			</Typography>
			
			<Stack spacing={2}>
				{notes.map((note, index) => (
					<Paper
						key={index}
						elevation={0}
						sx={{
							p: 2.5,
							border: `1px solid ${theme.palette.divider}`,
							bgcolor: theme.palette.background.paper,
							borderRadius: '8px'
						}}
					>
						<Box sx={{ display: 'flex', gap: 2 }}>
							<Avatar sx={{ 
								width: 32, 
								height: 32, 
								fontSize: '0.8125rem', 
								bgcolor: theme.palette.secondary.light, 
								fontWeight: 700 
							}}>
								{note.created_by_name?.[0] || 'U'}
							</Avatar>
							<Box sx={{ flexGrow: 1 }}>
								<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
									<Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
										{note.created_by_name || 'System User'}
									</Typography>
									<Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
										{formatDateIST(note.created_at)} • {formatTimeIST(note.created_at)}
									</Typography>
								</Box>
								<Typography variant="body2" sx={{ color: theme.palette.text.primary, fontSize: '0.875rem', lineHeight: 1.6 }}>
									{note.content}
								</Typography>
							</Box>
						</Box>
					</Paper>
				))}
			</Stack>
			
			{notes.length === 0 && (
				<Box sx={{ textAlign: 'center', py: 8, opacity: 0.6 }}>
					<NotesIcon sx={{ fontSize: 40, mb: 1.5, color: theme.palette.divider }} />
					<Typography variant="body2" sx={{ fontWeight: 500, color: theme.palette.text.secondary }}>
						No internal notes captured yet.
					</Typography>
				</Box>
			)}
		</Box>
	);
};

export default NotesTab;
