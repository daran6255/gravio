import React, { useState } from 'react';
import {
	Box,
	Stack,
	TextField,
	Button,
	Tab,
	Tabs,
	Typography,
	useTheme,
} from '@mui/material';
import type { ProjectTask } from '../../../../../models/projects/projectTask';

interface CommentsSectionProps {
	task: ProjectTask;
}

export const CommentsSection: React.FC<CommentsSectionProps> = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const [commentTab, setCommentTab] = useState(0);
	const [commentText, setCommentText] = useState('');

	return (
		<Box sx={{ border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', borderRadius: '12px', overflow: 'hidden', bgcolor: 'background.paper' }}>
			<Tabs
				value={commentTab}
				onChange={(_, v) => setCommentTab(v)}
				sx={{
					borderBottom: '1px solid',
					borderColor: 'divider',
					bgcolor: isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.005)',
					minHeight: '42px',
					'& .MuiTab-root': {
						minHeight: '42px',
						py: 1,
						textTransform: 'none',
						fontWeight: 700,
						fontSize: '0.825rem',
					},
				}}
			>
				<Tab label="Write" />
				<Tab label="Preview" />
			</Tabs>
			<Box sx={{ p: 2 }}>
				{commentTab === 0 ? (
					<Stack spacing={1.5}>
						<TextField
							placeholder="Leave a comment..."
							multiline
							rows={4}
							fullWidth
							value={commentText}
							onChange={(e) => setCommentText(e.target.value)}
							InputProps={{
								sx: {
									borderRadius: '8px',
									fontSize: '0.875rem',
								},
							}}
						/>
						<Stack direction="row" justifyContent="flex-end">
							<Button
								variant="contained"
								disabled={!commentText.trim()}
								onClick={() => setCommentText('')}
								sx={{
									color: 'white',
									textTransform: 'none',
									fontWeight: 700,
									borderRadius: '8px',
									px: 3,
								}}
							>
								Comment
							</Button>
						</Stack>
					</Stack>
				) : (
					<Box sx={{ minHeight: 110, p: 1 }}>
						{commentText.trim() ? (
							<Typography variant="body2" sx={{ lineHeight: 1.6 }}>
								{commentText}
							</Typography>
						) : (
							<Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', textAlign: 'center', py: 3 }}>
								Nothing to preview. Type a comment in the "Write" tab.
							</Typography>
						)}
					</Box>
				)}
			</Box>
		</Box>
	);
};

export default CommentsSection;
