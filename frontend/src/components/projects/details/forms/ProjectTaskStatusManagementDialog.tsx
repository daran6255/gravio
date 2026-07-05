import React from 'react';
import CommonStageManagementDialog from '../../../common/kanban/StageManagementDialog';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { updateTaskStatuses } from '../../../../store/slices/projectsSlice';
import useToast from '../../../../hooks/useToast';

interface ProjectTaskStatusManagementDialogProps {
	open: boolean;
	onClose: () => void;
}

export const ProjectTaskStatusManagementDialog: React.FC<ProjectTaskStatusManagementDialogProps> = ({ open, onClose }) => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const { taskStatuses, taskStatusMutating } = useAppSelector((state) => state.projects);

	const handleSave = async (updatedStatuses: any[]) => {
		try {
			await dispatch(updateTaskStatuses(updatedStatuses)).unwrap();
			toast.success('Task statuses updated');
		} catch (err: any) {
			throw err || 'Failed to update task statuses';
		}
	};

	return (
		<CommonStageManagementDialog
			open={open}
			onClose={onClose}
			title="Manage Task Statuses"
			subtitle="Customize the columns used across every project's task board"
			loading={taskStatusMutating}
			initialItems={taskStatuses}
			type="projects"
			onSave={handleSave}
		/>
	);
};

export default ProjectTaskStatusManagementDialog;
