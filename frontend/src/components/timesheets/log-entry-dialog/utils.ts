import type { LogAgainst, RowDraft } from './types';

// Sentinel select value that opens the inline "create category" dialog instead of
// actually being assigned to a row -- never persisted to categoryId.
export const ADD_NEW_CATEGORY = '__add_new_category__';

export const CATEGORY_COLORS = [
	'#8B7CF6', '#10B981', '#F59E0B', '#3B82F6', '#EC4899',
	'#14B8A6', '#EF4444', '#6366F1', '#A855F7', '#6B7280'
];

let rowKeySeq = 0;
export const nextRowKey = () => `row_${Date.now()}_${rowKeySeq++}`;

export const makeEmptyRow = (defaultDate?: string, defaultLogAgainst: LogAgainst = 'project_task'): RowDraft => ({
	key: nextRowKey(),
	logAgainst: defaultLogAgainst,
	projectId: '',
	taskId: '',
	categoryId: '',
	logDate: defaultDate || new Date().toISOString().split('T')[0],
	hours: '',
	billingType: 'billable',
	notes: '',
	tasks: [],
	tasksLoading: false
});

export const buildLogPayload = (row: RowDraft) => ({
	project_id: row.logAgainst !== 'general' ? (row.projectId as number) : null,
	task_id: row.logAgainst === 'project_task' ? (row.taskId as number) : null,
	category_id: row.logAgainst === 'general' ? (row.categoryId as number) : null,
	log_date: row.logDate,
	hours: parseFloat(row.hours),
	notes: row.notes || null,
	billing_type: row.billingType
});

export const validateRow = (row: RowDraft): string | null => {
	const hrs = parseFloat(row.hours);
	if (isNaN(hrs) || hrs <= 0 || hrs > 24) {
		return 'Hours must be between 0.1 and 24.0';
	}
	if (!row.logDate) {
		return 'Date is required';
	}
	if (row.logAgainst === 'project_task' && (!row.projectId || !row.taskId)) {
		return 'Project and Task are required';
	}
	if (row.logAgainst === 'project_only' && !row.projectId) {
		return 'Project is required';
	}
	if (row.logAgainst === 'general' && !row.categoryId) {
		return 'Category is required';
	}
	return null;
};
