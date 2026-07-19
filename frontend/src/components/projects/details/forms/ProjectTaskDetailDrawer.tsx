import React, { useState } from 'react';
import {
	Drawer,
	Box,
	useTheme,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { updateProjectTask, addTaskComment, uploadTaskFile } from '../../../../store/slices/projectsSlice';
import type { ProjectTask, ProjectTaskUpdate, ProjectTaskStatus, ProjectTaskTag } from '../../../../models/projects/projectTask';
import type { CRMOwnerOption } from '../../../../models/crm/owner';
import { useParams } from 'react-router-dom';

// Import Decomposed task drawer sub-components
import { TaskDrawerHeader } from '../components/task-drawer/TaskDrawerHeader';
import { TaskDetailsPanel } from '../components/task-drawer/TaskDetailsPanel';
import { TaskAttachmentsCard } from '../components/task-drawer/TaskAttachmentsCard';
import { TaskDescriptionCard } from '../components/task-drawer/TaskDescriptionCard';
import { SubtasksList } from '../components/task-drawer/SubtasksList';
import { TaskHistoryTimeline } from '../components/task-drawer/TaskHistoryTimeline';
import { CommentsSection } from '../components/task-drawer/CommentsSection';

interface ProjectTaskDetailDrawerProps {
	open: boolean;
	onClose: () => void;
	task: ProjectTask;
	tasks: ProjectTask[];
	projectName: string;
	statuses: ProjectTaskStatus[];
	owners: CRMOwnerOption[];
	existingTags: ProjectTaskTag[];
	onSubmit: (payload: ProjectTaskUpdate, keepOpen?: boolean) => Promise<ProjectTask | void>;
	onDelete: () => void;
	onAddSubtask: (parent: ProjectTask) => void;
}

export const ProjectTaskDetailDrawer: React.FC<ProjectTaskDetailDrawerProps> = (props) => {
	const {
		open,
		onClose,
		task,
		tasks,
		projectName,
		statuses,
		owners,
		existingTags,
		onSubmit,
		onDelete,
		onAddSubtask,
	} = props;

	const dispatch = useAppDispatch();
	const theme = useTheme();
	const bgColor = theme.palette.background.paper;
	const { public_id: projectPublicId = '' } = useParams<{ public_id: string }>();
	const taskFiles = useAppSelector((state) => state.projects.taskFiles);

	const [commentText, setCommentText] = useState('');

	// Get latest version from source-of-truth list
	const latestTask = tasks.find((t) => t.id === task.id) || task;

	const handleUpdateField = async (fields: ProjectTaskUpdate) => {
		await onSubmit(fields, true);
	};

	const handleUpdateSubtask = async (subtaskPublicId: string, fields: ProjectTaskUpdate) => {
		await dispatch(updateProjectTask({ taskPublicId: subtaskPublicId, payload: fields })).unwrap();
	};

	const handleAddComment = async (content: string) => {
		await dispatch(addTaskComment({ taskPublicId: latestTask.public_id, content })).unwrap();
	};

	const handleUploadAttachment = async (file: File) => {
		await dispatch(uploadTaskFile({ taskPublicId: latestTask.public_id, file })).unwrap();
	};


	return (
		<Drawer
			anchor="right"
			open={open}
			onClose={onClose}
			PaperProps={{
				sx: {
					width: { xs: '100%', md: '80vw' },
					maxWidth: '100%',
					borderTopLeftRadius: '8px',
					borderBottomLeftRadius: '8px',
					bgcolor: bgColor,
					boxShadow: 'none',
				},
			}}
		>
			<Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
				{/* Header */}
				<TaskDrawerHeader
					task={latestTask}
					statuses={statuses}
					tasks={tasks}
					projectName={projectName}
					onUpdateField={handleUpdateField}
					onDelete={onDelete}
					onClose={onClose}
				/>

				{/* Two Column Scrollable Body */}
				<Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'flex-start', minHeight: 0 }}>
					{/* Left Column (Main description card & subtasks) - 67% width on Desktop */}
					<Box sx={{ width: { xs: '100%', md: '67%' }, flexShrink: 0, p: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
						{/* Task Description Card Component */}
						<TaskDescriptionCard
							task={latestTask}
							onUpdateField={handleUpdateField}
							setCommentText={setCommentText}
							owners={owners}
							tasks={tasks}
							files={taskFiles}
						/>

						{/* Sub-tasks checklist */}
						<SubtasksList
							task={latestTask}
							tasks={tasks}
							statuses={statuses}
							owners={owners}
							onAddSubtask={onAddSubtask}
							onUpdateSubtask={handleUpdateSubtask}
						/>

						{/* Task History Timeline */}
						<TaskHistoryTimeline
							task={latestTask}
							tasks={tasks}
							statuses={statuses}
							owners={owners}
							projectName={projectName}
						/>

						{/* Comments Section */}
						<CommentsSection
							task={latestTask}
							commentText={commentText}
							setCommentText={setCommentText}
							onAddComment={handleAddComment}
							onUploadAttachment={handleUploadAttachment}
							owners={owners}
							tasks={tasks}
							files={taskFiles}
							projectPublicId={projectPublicId}
						/>
					</Box>

					{/* Right Column (Sidebar settings) - 33% width on Desktop */}
					<Box
						sx={{
							width: { xs: '100%', md: '33%' },
							flexShrink: 0,
							minHeight: { md: '100%' },
							p: 2,
							display: 'flex',
							flexDirection: 'column',
							gap: 2.5,
						}}
					>
						<TaskDetailsPanel
							task={latestTask}
							tasks={tasks}
							statuses={statuses}
							owners={owners}
							existingTags={existingTags}
							projectName={projectName}
							onUpdateField={handleUpdateField}
						/>
						<TaskAttachmentsCard task={latestTask} />
					</Box>
				</Box>
			</Box>
		</Drawer>
	);
};

export default ProjectTaskDetailDrawer;
