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
	IconButton,
	alpha,
} from '@mui/material';
import {
	FormatBold,
	FormatItalic,
	FormatQuote,
	Code,
	Link,
	FormatListNumbered,
	FormatListBulleted,
	AlternateEmail,
	SentimentSatisfiedAltOutlined,
	CheckCircleOutline,
	ReplayOutlined,
} from '@mui/icons-material';
import type { ProjectTask, ProjectTaskStatus } from '../../../../../models/projects/projectTask';

interface CommentsSectionProps {
	task: ProjectTask;
	statuses: ProjectTaskStatus[];
	onUpdateField: (fields: { status_id: number }) => Promise<void>;
	commentText: string;
	setCommentText: (val: string) => void;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
	task,
	statuses,
	onUpdateField,
	commentText,
	setCommentText,
}) => {
	const theme = useTheme();

	const [commentTab, setCommentTab] = useState(0);

	const selectedStatus = statuses.find((s) => s.id === task.status_id) || statuses[0];
	const isClosed = selectedStatus.is_done_status;

	const handleStatusToggle = async () => {
		if (isClosed) {
			// Find initial status (or first stage)
			const initialStatus = statuses.find((s) => s.is_initial_status) || statuses[0];
			await onUpdateField({ status_id: initialStatus.id });
		} else {
			// Find done status
			const doneStatus = statuses.find((s) => s.is_done_status) || statuses[statuses.length - 1];
			await onUpdateField({ status_id: doneStatus.id });
		}
	};

	const toolbarButtons = [
		{ icon: <FormatBold fontSize="small" />, title: 'Bold' },
		{ icon: <FormatItalic fontSize="small" />, title: 'Italic' },
		{ icon: <FormatQuote fontSize="small" />, title: 'Quote' },
		{ icon: <Code fontSize="small" />, title: 'Code' },
		{ icon: <Link fontSize="small" />, title: 'Link' },
		{ icon: <FormatListNumbered fontSize="small" />, title: 'Numbered List' },
		{ icon: <FormatListBulleted fontSize="small" />, title: 'Bulleted List' },
		{ icon: <AlternateEmail fontSize="small" />, title: 'Mention' },
		{ icon: <SentimentSatisfiedAltOutlined fontSize="small" />, title: 'Emoji' },
	];

	return (
		<Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px', overflow: 'hidden', bgcolor: 'background.paper' }}>
			{/* Write & Preview Tabs Header */}
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.005)' }}>
				<Tabs
					value={commentTab}
					onChange={(_, v) => setCommentTab(v)}
					sx={{
						minHeight: '40px',
						'& .MuiTab-root': {
							minHeight: '40px',
							py: 0.75,
							px: 2.25,
							textTransform: 'none',
							fontWeight: 700,
							fontSize: '0.825rem',
						},
					}}
				>
					<Tab label="Write" />
					<Tab label="Preview" />
				</Tabs>

				{/* Mock Formatting Toolbar (only on Write tab) */}
				{commentTab === 0 && (
					<Stack direction="row" spacing={0.25} sx={{ pr: 1.5 }}>
						{toolbarButtons.map((btn, idx) => (
							<IconButton key={idx} size="small" title={btn.title} sx={{ color: 'text.secondary', p: 0.5, '&:hover': { bgcolor: theme.palette.action.hover } }}>
								{btn.icon}
							</IconButton>
						))}
					</Stack>
				)}
			</Box>

			{/* Editor Content Area */}
			<Box sx={{ p: 2 }}>
				{commentTab === 0 ? (
					<Stack spacing={1.5}>
						<TextField
							id="task-comment-input"
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
									bgcolor: 'background.paper',
								},
							}}
						/>
						{/* Drag and drop footer */}
						<Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: -0.5, border: '1px dashed', borderColor: 'divider', p: 1, borderRadius: '6px', textAlign: 'center', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)' }}>
							Attach files by dragging & dropping, selecting, or pasting them.
						</Typography>

						{/* Footer Actions: Reopen/Close button and green Comment button */}
						<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.5 }}>
							<Button
								variant="outlined"
								size="small"
								onClick={handleStatusToggle}
								startIcon={isClosed ? <ReplayOutlined /> : <CheckCircleOutline />}
								sx={{
									textTransform: 'none',
									fontWeight: 700,
									borderRadius: '6px',
									borderColor: 'divider',
									color: 'text.primary',
									bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
									'&:hover': {
										borderColor: isClosed ? 'primary.main' : 'error.main',
										bgcolor: theme.palette.action.hover,
									},
								}}
							>
								{isClosed ? 'Reopen task' : 'Close task'}
							</Button>

							<Button
								variant="contained"
								disabled={!commentText.trim()}
								onClick={() => setCommentText('')}
								sx={{
									textTransform: 'none',
									fontWeight: 700,
									borderRadius: '6px',
									px: 3.5,
									bgcolor: theme.palette.success.main,
									color: 'white !important',
									boxShadow: 'none',
									'&:hover': {
										bgcolor: theme.palette.success.dark,
										boxShadow: 'none',
									},
									'&.Mui-disabled': {
										bgcolor: alpha(theme.palette.success.main, 0.4),
										color: 'rgba(255,255,255,0.5) !important',
									},
								}}
							>
								Comment
							</Button>
						</Stack>
					</Stack>
				) : (
					<Box sx={{ minHeight: 110, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: '8px', bgcolor: 'background.paper' }}>
						{commentText.trim() ? (
							<Typography variant="body2" sx={{ lineHeight: 1.6 }}>
								{commentText}
							</Typography>
						) : (
							<Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', textAlign: 'center', py: 4 }}>
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
