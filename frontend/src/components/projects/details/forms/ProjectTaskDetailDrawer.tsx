import React, { useState, useEffect } from 'react';
import {
	Drawer,
	Box,
	Stack,
	Typography,
	Button,
	useTheme,
} from '@mui/material';
import {
	EditOutlined,
} from '@mui/icons-material';
import type { ProjectTask, ProjectTaskUpdate, ProjectTaskStatus, ProjectTaskTag } from '../../../../models/projects/projectTask';
import type { CRMOwnerOption } from '../../../../models/crm/owner';
import { RichTextEditor, RichTextViewer } from '../../../common/form';

// Import Decomposed task drawer sub-components
import { TaskDrawerHeader } from '../components/task-drawer/TaskDrawerHeader';
import { TaskDrawerSidebar } from '../components/task-drawer/TaskDrawerSidebar';
import { SubtasksList } from '../components/task-drawer/SubtasksList';
import { ActivityTimeline } from '../components/task-drawer/ActivityTimeline';
import { CommentsSection } from '../components/task-drawer/CommentsSection';

interface ProjectTaskDetailDrawerProps {
	open: boolean;
	onClose: () => void;
	task: ProjectTask;
	tasks: ProjectTask[];
	statuses: ProjectTaskStatus[];
	owners: CRMOwnerOption[];
	existingTags: ProjectTaskTag[];
	onSubmit: (payload: ProjectTaskUpdate) => Promise<void>;
	onDelete: () => void;
	onAddSubtask: (parent: ProjectTask) => void;
}

export const ProjectTaskDetailDrawer: React.FC<ProjectTaskDetailDrawerProps> = ({
	open,
	onClose,
	task,
	tasks,
	statuses,
	owners,
	existingTags,
	onSubmit,
	onDelete,
	onAddSubtask,
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	// Get latest version from source-of-truth list
	const latestTask = tasks.find((t) => t.id === task.id) || task;

	const [isEditingDesc, setIsEditingDesc] = useState(false);
	const [editDesc, setEditDesc] = useState(latestTask.description || '');

	useEffect(() => {
		if (open) {
			setEditDesc(latestTask.description || '');
			setIsEditingDesc(false);
		}
	}, [open, latestTask.id, latestTask.description]);

	const handleUpdateField = async (fields: ProjectTaskUpdate) => {
		await onSubmit(fields);
	};

	const saveDescription = async () => {
		if (editDesc !== (latestTask.description || '')) {
			await handleUpdateField({ description: editDesc.trim() || undefined });
		}
		setIsEditingDesc(false);
	};

	return (
		<Drawer
			anchor="right"
			open={open}
			onClose={onClose}
			PaperProps={{
				sx: {
					width: { xs: '100%', md: '850px', lg: '1050px' },
					maxWidth: '100%',
					borderTopLeftRadius: '16px',
					borderBottomLeftRadius: '16px',
					bgcolor: 'background.paper',
					boxShadow: 'none',
				},
			}}
		>
			<Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
				{/* Header */}
				<TaskDrawerHeader
					task={latestTask}
					statuses={statuses}
					onUpdateField={handleUpdateField}
					onDelete={onDelete}
					onClose={onClose}
				/>

				{/* Two Column Scrollable Body */}
				<Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
					{/* Left Column (Main details) */}
					<Box sx={{ flex: 1, p: 3.5, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
						{/* Description Card */}
						<Box
							sx={{
								border: '1px solid',
								borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
								borderRadius: '12px',
								overflow: 'hidden',
								bgcolor: 'background.paper',
								boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.15)' : '0 4px 20px rgba(0,0,0,0.02)',
							}}
						>
							<Box
								sx={{
									px: 2.25,
									py: 1.5,
									borderBottom: '1px solid',
									borderColor: 'divider',
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									bgcolor: isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.005)',
								}}
							>
								<Typography variant="subtitle2" sx={{ fontWeight: 750, letterSpacing: '-0.01em' }}>
									Description
								</Typography>
								{!isEditingDesc && (
									<Button
										startIcon={<EditOutlined fontSize="small" />}
										size="small"
										onClick={() => setIsEditingDesc(true)}
										sx={{ textTransform: 'none', fontWeight: 700 }}
									>
										Edit
									</Button>
								)}
							</Box>
							<Box sx={{ p: 2.5 }}>
								{isEditingDesc ? (
									<Stack spacing={2}>
										<RichTextEditor
											value={editDesc}
											onChange={setEditDesc}
											variant="standard"
											minHeight={150}
										/>
										<Stack direction="row" spacing={1.5} justifyContent="flex-end">
											<Button onClick={() => setIsEditingDesc(false)} size="small" sx={{ textTransform: 'none', fontWeight: 700 }}>
												Cancel
											</Button>
											<Button
												variant="contained"
												onClick={saveDescription}
												size="small"
												sx={{ color: 'white', textTransform: 'none', fontWeight: 700 }}
											>
												Save Changes
											</Button>
										</Stack>
									</Stack>
								) : latestTask.description ? (
									<RichTextViewer html={latestTask.description} />
								) : (
									<Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
										No description provided.
									</Typography>
								)}
							</Box>
						</Box>

						{/* Sub-tasks checklist */}
						<SubtasksList
							task={latestTask}
							tasks={tasks}
							statuses={statuses}
							owners={owners}
							onAddSubtask={onAddSubtask}
						/>

						{/* Timeline Activity */}
						<ActivityTimeline task={latestTask} />

						{/* Comments Section */}
						<CommentsSection task={latestTask} />
					</Box>

					{/* Right Column (Sidebar settings) */}
					<TaskDrawerSidebar
						task={latestTask}
						statuses={statuses}
						owners={owners}
						existingTags={existingTags}
						onUpdateField={handleUpdateField}
					/>
				</Box>
			</Box>
		</Drawer>
	);
};

export default ProjectTaskDetailDrawer;
