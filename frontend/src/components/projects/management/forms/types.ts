import type { DSRProject } from '../../../../models/dsr';
import type { User } from '../../../../models/user';
import type { TrainingBatch } from '../../../../models/training';

export interface ProjectFormData {
	name: string;
	owner: User | null;
	is_active: boolean;
	project_type: 'standard' | 'training';
	selectedBatches: TrainingBatch[];
}

export interface ProjectDialogProps {
	open: boolean;
	project: DSRProject | null;
	onClose: () => void;
	onSuccess: (message: string) => void;
	onDelete?: (project: DSRProject) => void;
}
