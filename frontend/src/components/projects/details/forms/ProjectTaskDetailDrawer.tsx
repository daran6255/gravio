import React from 'react';
import {
	Drawer,
	Box,
	useTheme,
} from '@mui/material';
import type { ProjectTask, ProjectTaskUpdate, ProjectTaskStatus, ProjectTaskTag } from '../../../../models/projects/projectTask';
import type { CRMOwnerOption } from '../../../../models/crm/owner';

// Import Decomposed task drawer sub-components
import { TaskDrawerHeader } from '../components/task-drawer/TaskDrawerHeader';
import { TaskDrawerSidebar } from '../components/task-drawer/TaskDrawerSidebar';
import { TaskDescriptionCard } from '../components/task-drawer/TaskDescriptionCard';

interface ProjectTaskDetailDrawerProps {
	open: boolean;
	onClose: () => void;
	task: ProjectTask;
	tasks: ProjectTask[];
	projectName: string;
	statuses: ProjectTaskStatus[];
	owners: CRMOwnerOption[];
	existingTags: ProjectTaskTag[];
	onSubmit: (payload: ProjectTaskUpdate) => Promise<void>;
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
	} = props;

	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const bgColor = isDark ? '#0d1117' : '#ffffff';

	// Get latest version from source-of-truth list
	const latestTask = tasks.find((t) => t.id === task.id) || task;

	const handleUpdateField = async (fields: ProjectTaskUpdate) => {
		await onSubmit(fields);
	};

	return (
		<Drawer
			anchor="right"
			open={open}
			onClose={onClose}
			PaperProps={{
				sx: {
					width: { xs: '100%', md: '70vw' },
					maxWidth: '100%',
					borderTopLeftRadius: '16px',
					borderBottomLeftRadius: '16px',
					bgcolor: bgColor,
					boxShadow: 'none',
				},
			}}
		>
			<Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
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
				<Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: 0 }}>
					{/* Left Column (Main description card) - 50% width on Desktop */}
					<Box sx={{ width: { xs: '100%', md: '50vw' }, p: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
						{/* Task Description Card Component */}
						<TaskDescriptionCard
							task={latestTask}
							onUpdateField={handleUpdateField}
						/>
					</Box>

					{/* Right Column (Sidebar settings) - 20% width on Desktop */}
					<Box sx={{ width: { xs: '100%', md: '20vw' } }}>
						<TaskDrawerSidebar
							task={latestTask}
							statuses={statuses}
							owners={owners}
							existingTags={existingTags}
							projectName={projectName}
							onUpdateField={handleUpdateField}
							onDelete={onDelete}
						/>
					</Box>
				</Box>
			</Box>
		</Drawer>
	);
};

export default ProjectTaskDetailDrawer;
