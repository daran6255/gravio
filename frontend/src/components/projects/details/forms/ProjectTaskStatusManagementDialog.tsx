import React from 'react';
import CommonStageManagementDialog from '../../../common/kanban/StageManagementDialog';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { updateTaskStatuses, fetchProjectTasks } from '../../../../store/slices/projectsSlice';
import useToast from '../../../../hooks/useToast';
import { PROJECT_STAGE_PRESETS } from '../../../../data/projectStagePresets';
import { getCategoryForTemplateKey } from '../../../../data/projectTemplates';
import type { Project } from '../../../../models/projects/project';

/** Only show the preset that matches this project's own template — not the full generic list. */
const getPresetsForProject = (project?: Project) => {
	const category = getCategoryForTemplateKey(project?.template_key);
	if (!category) return PROJECT_STAGE_PRESETS.map((p) => ({ key: p.category, label: p.category, stages: p.stages }));
	const match = PROJECT_STAGE_PRESETS.find((p) => p.category === category);
	return match ? [{ key: match.category, label: `Reset to "${match.category}" template`, stages: match.stages }] : [];
};

interface ProjectTaskStatusManagementDialogProps {
	open: boolean;
	onClose: () => void;
	/** The project this dialog was opened from — determines which stages are shown
	 *  and scopes saves to this project only. */
	project?: Project;
}

export const ProjectTaskStatusManagementDialog: React.FC<ProjectTaskStatusManagementDialogProps> = ({ open, onClose, project }) => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const { taskStatuses, taskStatusMutating } = useAppSelector((state) => state.projects);
	const recommendedPresetKey = getCategoryForTemplateKey(project?.template_key);
	const presets = getPresetsForProject(project);

	const isDefaultStage = (item: any) => {
		if (!project) return false;
		if (project.template_key) {
			const category = getCategoryForTemplateKey(project.template_key);
			const preset = PROJECT_STAGE_PRESETS.find((p) => p.category === category);
			if (preset) {
				return preset.stages.some((s) => s.name.toLowerCase() === item.name.toLowerCase());
			}
		} else {
			// Blank project default stages
			const defaultNames = ['Planning', 'Active', 'In Progress', 'Delayed', 'In Testing', 'On Hold', 'Completed', 'Approved', 'Invoiced', 'Canceled'];
			return defaultNames.some((n) => n.toLowerCase() === item.name.toLowerCase());
		}
		return false;
	};

	const handleSave = async (updatedStatuses: any[]) => {
		if (!project) return;
		try {
			await dispatch(updateTaskStatuses({ projectPublicId: project.public_id, statuses: updatedStatuses })).unwrap();
			await dispatch(fetchProjectTasks(project.public_id)).unwrap();
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
			subtitle="Customize the task columns for this project's board"
			loading={taskStatusMutating}
			initialItems={taskStatuses}
			type="projects"
			onSave={handleSave}
			presets={presets}
			recommendedPresetKey={recommendedPresetKey ?? undefined}
			isReadOnlyStageName={isDefaultStage}
			isDeletableStage={(item) => !isDefaultStage(item)}
		/>
	);
};

export default ProjectTaskStatusManagementDialog;
