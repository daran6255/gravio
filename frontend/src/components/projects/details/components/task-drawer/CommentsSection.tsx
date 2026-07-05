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
	AttachFile,
	KeyboardArrowDown,
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
	const isDark = theme.palette.mode === 'dark';

	const [commentTab, setCommentTab] = useState(0);

	const selectedStatus = statuses.find((s) => s.id === task.status_id) || statuses[0];
	const isClosed = selectedStatus.is_done_status;

	const handleStatusToggle = async () => {
		if (isClosed) {
			const initialStatus = statuses.find((s) => s.is_initial_status) || statuses[0];
			await onUpdateField({ status_id: initialStatus.id });
		} else {
			const doneStatus = statuses.find((s) => s.is_done_status) || statuses[statuses.length - 1];
			await onUpdateField({ status_id: doneStatus.id });
		}
	};

	const toolbarButtons = [
		{ icon: <FormatBold fontSize="small" sx={{ fontSize: 16 }} />, title: 'Bold' },
		{ icon: <FormatItalic fontSize="small" sx={{ fontSize: 16 }} />, title: 'Italic' },
		{ icon: <FormatQuote fontSize="small" sx={{ fontSize: 16 }} />, title: 'Quote' },
		{ icon: <Code fontSize="small" sx={{ fontSize: 16 }} />, title: 'Code' },
		{ icon: <Link fontSize="small" sx={{ fontSize: 16 }} />, title: 'Link' },
		{ icon: <FormatListBulleted fontSize="small" sx={{ fontSize: 16 }} />, title: 'Bulleted List' },
		{ icon: <FormatListNumbered fontSize="small" sx={{ fontSize: 16 }} />, title: 'Numbered List' },
		{ icon: <AlternateEmail fontSize="small" sx={{ fontSize: 16 }} />, title: 'Mention' },
		{ icon: <SentimentSatisfiedAltOutlined fontSize="small" sx={{ fontSize: 16 }} />, title: 'Emoji' },
	];

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
			<Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', mb: 0.5 }}>
				Add a comment
			</Typography>

			{/* Editor Box */}
			<Box
				sx={{
					border: '1px solid',
					borderColor: isDark ? '#30363d' : '#d0d7de',
					borderRadius: '8px',
					overflow: 'hidden',
					bgcolor: isDark ? '#0d1117' : '#ffffff',
				}}
			>
				{/* Write & Preview Tabs Header */}
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						borderBottom: '1px solid',
						borderColor: isDark ? '#30363d' : '#d0d7de',
						bgcolor: isDark ? '#161b22' : '#f6f8fa',
					}}
				>
					<Tabs
						value={commentTab}
						onChange={(_, v) => setCommentTab(v)}
						sx={{
							minHeight: '36px',
							'& .MuiTabs-indicator': {
								bgcolor: isDark ? '#f0f6fc' : '#0969da',
							},
							'& .MuiTab-root': {
								minHeight: '36px',
								py: 0.5,
								px: 2,
								textTransform: 'none',
								fontWeight: 600,
								fontSize: '0.8rem',
								color: 'text.secondary',
								'&.Mui-selected': {
									color: 'text.primary',
									fontWeight: 700,
								},
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
								<IconButton
									key={idx}
									size="small"
									title={btn.title}
									sx={{
										color: 'text.secondary',
										p: 0.4,
										borderRadius: '4px',
										'&:hover': { bgcolor: isDark ? '#30363d' : '#eef2ff' },
									}}
								>
									{btn.icon}
								</IconButton>
							))}
						</Stack>
					)}
				</Box>

				{/* Editor Content Area */}
				<Box sx={{ p: 1.5 }}>
					{commentTab === 0 ? (
						<Stack spacing={1.5}>
							<TextField
								id="task-comment-input"
								placeholder="Use Markdown to format your comment"
								multiline
								rows={4}
								fullWidth
								value={commentText}
								onChange={(e) => setCommentText(e.target.value)}
								InputProps={{
									sx: {
										fontSize: '0.85rem',
										color: 'text.primary',
										fontFamily: 'inherit',
										alignItems: 'flex-start',
										p: 0,
										'& fieldset': { border: 'none' },
									},
								}}
							/>

							{/* Footer actions inside the Write panel */}
							<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ borderTop: '1px solid', borderColor: isDark ? '#21262d' : '#e1e4e8', pt: 1.5 }}>
								{/* Paperclip upload files text */}
								<Stack direction="row" alignItems="center" spacing={0.5} sx={{ cursor: 'pointer', color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>
									<AttachFile sx={{ fontSize: 16 }} />
									<Typography sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
										Paste, drop, or click to add files
									</Typography>
								</Stack>

								{/* Buttons Group */}
								<Stack direction="row" spacing={1.25} alignItems="center">
									{/* Status Split Button */}
									<Box
										sx={{
											display: 'inline-flex',
											borderRadius: '6px',
											border: '1px solid',
											borderColor: isDark ? '#30363d' : '#d0d7de',
											bgcolor: isDark ? '#21262d' : '#f6f8fa',
											overflow: 'hidden',
											'&:hover': {
												borderColor: isDark ? '#8b7cf6' : '#6366f1',
											}
										}}
									>
										<Button
											size="small"
											onClick={handleStatusToggle}
											startIcon={isClosed ? <ReplayOutlined sx={{ color: '#2da44e', fontSize: 15 }} /> : <CheckCircleOutline sx={{ fontSize: 15 }} />}
											sx={{
												textTransform: 'none',
												fontWeight: 600,
												fontSize: '0.8rem',
												color: 'text.primary',
												px: 1.5,
												py: 0.5,
												minWidth: 'auto',
												borderRadius: 0,
												border: 'none',
												'&:hover': {
													bgcolor: isDark ? '#30363d' : '#eef2ff',
												}
											}}
										>
											{isClosed ? 'Reopen issue' : 'Close issue'}
										</Button>
										<Box sx={{ width: '1px', bgcolor: isDark ? '#30363d' : '#d0d7de' }} />
										<Button
											size="small"
											sx={{
												p: 0.5,
												minWidth: '24px',
												borderRadius: 0,
												color: 'text.primary',
												border: 'none',
												'&:hover': {
													bgcolor: isDark ? '#30363d' : '#eef2ff',
												}
											}}
										>
											<KeyboardArrowDown sx={{ fontSize: 14 }} />
										</Button>
									</Box>

									{/* Comment Action Button */}
									<Button
										variant="contained"
										disabled={!commentText.trim()}
										onClick={() => setCommentText('')}
										sx={{
											textTransform: 'none',
											fontWeight: 600,
											fontSize: '0.8rem',
											borderRadius: '6px',
											px: 2.25,
											py: 0.65,
											bgcolor: isDark ? '#238636' : '#2da44e',
											color: 'white !important',
											boxShadow: 'none',
											'&:hover': {
												bgcolor: isDark ? '#2ea44f' : '#2cbe4e',
												boxShadow: 'none',
											},
											'&.Mui-disabled': {
												bgcolor: isDark ? 'rgba(35,134,54,0.4)' : 'rgba(44,190,78,0.3)',
												color: 'rgba(255,255,255,0.4) !important',
											},
										}}
									>
										Comment
									</Button>
								</Stack>
							</Stack>
						</Stack>
					) : (
						<Box sx={{ minHeight: 110, p: 1.5, border: '1px solid', borderColor: isDark ? '#30363d' : '#d0d7de', borderRadius: '8px', bgcolor: isDark ? '#0d1117' : '#ffffff' }}>
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
		</Box>
	);
};

export default CommentsSection;
