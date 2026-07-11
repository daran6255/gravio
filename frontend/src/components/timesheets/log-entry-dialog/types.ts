import type { ProjectTimeLog } from '../../../models/timesheet';

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
}
