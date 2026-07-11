import type { ProjectTimeLog } from '../../../models/timesheet';
import type { ProjectTask } from '../../../models/projects/projectTask';

export interface TimeLogEntryFormDialogProps {
	open: boolean;
	onClose: () => void;
	log?: ProjectTimeLog;
	defaultDate?: string;
	onSave?: () => void;
}

export type LogAgainst = 'project_task' | 'project_only' | 'general';

export interface RowDraft {
	key: string;
	logAgainst: LogAgainst;
	projectId: number | '';
	taskId: number | '';
	categoryId: number | '';
	logDate: string;
	hours: string;
	billingType: 'billable' | 'non_billable';
	notes: string;
	tasks: ProjectTask[];
	tasksLoading: boolean;
}
