import React from 'react';
import { Button, TextField, MenuItem, Stack, Box, IconButton, Typography, Divider } from '@mui/material';
import {
	Add as AddIcon,
	DeleteOutline as DeleteIcon,
	SettingsOutlined as ManageIcon
} from '@mui/icons-material';
import { DatePicker } from '../../../common/form';
import RichTextEditor from '../../../common/form/RichTextEditor';
import type { ProjectTask } from '../../../../models/projects/projectTask';
import type { Project } from '../../../../models/projects/project';
import type { TimesheetCategory } from '../../../../models/timesheet';
import type { RowDraft } from '../types';
import { ADD_NEW_CATEGORY, countWords } from '../utils';

interface TimeLogRowFieldsProps {
	row: RowDraft;
	rowIndex: number;
	totalRows: number;
	hasProjectModule: boolean;
	visibleProjects: Project[];
	getVisibleTasks: (row: RowDraft) => ProjectTask[];
	tasksLoading: boolean;
	categories: TimesheetCategory[];
	myCategories: TimesheetCategory[];
	submitting: boolean;
	updateRow: (key: string, patch: Partial<RowDraft>) => void;
	onProjectChange: (key: string, projectId: number) => void;
	onTaskChange: (key: string, taskId: number, row: RowDraft) => void;
	onCategorySelectChange: (rowKey: string, value: string) => void;
	onRemoveRow: (key: string) => void;
	onManageCategories: () => void;
}

// Renders the fields for a single row draft in the log-time form.
export const TimeLogRowFields: React.FC<TimeLogRowFieldsProps> = ({
	row,
	rowIndex,
	totalRows,
	hasProjectModule,
	visibleProjects,
	getVisibleTasks,
	tasksLoading,
	categories,
	myCategories,
	submitting,
	updateRow,
	onProjectChange,
	onTaskChange,
	onCategorySelectChange,
	onRemoveRow,
	onManageCategories
}) => {
	const parsedHours = parseFloat(row.hours);
	const hasHoursError = row.hours !== '' && (isNaN(parsedHours) || parsedHours <= 0 || parsedHours > 24);
	const hasNotesError = countWords(row.notes) > 150;

	return (
		<React.Fragment>
			{rowIndex > 0 && <Divider />}
			<Stack spacing={2}>
				{totalRows > 1 && (
					<Stack direction="row" justifyContent="space-between" alignItems="center">
						<Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
							Entry {rowIndex + 1}
						</Typography>
						<IconButton size="small" onClick={() => onRemoveRow(row.key)} disabled={submitting}>
							<DeleteIcon fontSize="small" />
						</IconButton>
					</Stack>
				)}

				{!hasProjectModule && rowIndex === 0 && (
					<Box sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
						<Typography variant="caption" color="text.secondary" display="block">
							Logging general/internal time. Project-based logging isn't available on your organization's plan.
						</Typography>
					</Box>
				)}

				{row.logAgainst !== 'general' && (
					<TextField
						select
						label="Project"
						value={row.projectId}
						onChange={(e) => onProjectChange(row.key, Number(e.target.value))}
						fullWidth
						required
						disabled={submitting}
						helperText={visibleProjects.length === 0 ? 'No active projects assigned to you' : undefined}
					>
						{visibleProjects.map((p) => (
							<MenuItem key={p.id} value={p.id}>
								{p.name}
							</MenuItem>
						))}
					</TextField>
				)}

				{row.logAgainst === 'project_task' && (
					<TextField
						select
						label="Task"
						value={row.taskId}
						onChange={(e) => onTaskChange(row.key, Number(e.target.value), row)}
						fullWidth
						required
						disabled={!row.projectId || submitting}
						helperText={
							tasksLoading
								? 'Loading tasks...'
								: row.projectId && getVisibleTasks(row).length === 0
									? 'No active tasks assigned to you on this project'
									: undefined
						}
					>
						{getVisibleTasks(row).map((t) => (
							<MenuItem key={t.id} value={t.id} sx={{ display: 'block' }}>
								<Typography variant="body2">{t.title}</Typography>
								<Typography variant="caption" color="text.secondary">
									{t.billing_type === 'billable' ? 'Billable' : 'Non-Billable'}
									{t.priority ? ` · ${t.priority.charAt(0).toUpperCase()}${t.priority.slice(1)} priority` : ''}
									{t.due_date ? ` · Due ${t.due_date}` : ''}
									{t.completed_at ? ' · Completed' : ''}
								</Typography>
							</MenuItem>
						))}
					</TextField>
				)}

				{row.logAgainst === 'general' && (
					<TextField
						select
						label="Category"
						value={row.categoryId}
						onChange={(e) => onCategorySelectChange(row.key, e.target.value as string)}
						fullWidth
						required
						disabled={submitting}
						helperText={categories.length === 0 ? "You don't have any categories yet -- add one below" : undefined}
					>
						{categories.map((c) => (
							<MenuItem key={c.id} value={c.id}>
								<Stack direction="row" spacing={1} alignItems="center">
									<Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.color || 'text.disabled', flexShrink: 0 }} />
									<Typography variant="body2">{c.name}</Typography>
								</Stack>
							</MenuItem>
						))}
						<Divider />
						<MenuItem value={ADD_NEW_CATEGORY} disabled={submitting}>
							<Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'primary.main', fontWeight: 700 }}>
								<AddIcon fontSize="small" />
								<Typography variant="body2" sx={{ fontWeight: 700 }}>Add New Category</Typography>
							</Stack>
						</MenuItem>
					</TextField>
				)}

				{row.logAgainst === 'general' && myCategories.length > 0 && (
					<Button
						size="small"
						startIcon={<ManageIcon fontSize="small" />}
						onClick={onManageCategories}
						disabled={submitting}
						sx={{ alignSelf: 'flex-start', fontWeight: 600, textTransform: 'none', mt: -1 }}
					>
						Manage My Categories
					</Button>
				)}

				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
					<DatePicker
						label="Date"
						value={row.logDate || null}
						onChange={(value) => updateRow(row.key, { logDate: value })}
						textFieldProps={{ required: true, disabled: submitting }}
						fullWidth
					/>
					<TextField
						label="Hours"
						type="number"
						inputProps={{ step: 0.25, min: 0.1, max: 24 }}
						value={row.hours}
						onChange={(e) => updateRow(row.key, { hours: e.target.value })}
						fullWidth
						required
						disabled={submitting}
						placeholder="e.g. 1.5"
						error={hasHoursError}
						helperText={
							hasHoursError
								? 'Hours must be between 0.1 and 24.0'
								: 'Use decimal format (e.g. 1.5 = 1h 30m, 8.0 = 8h)'
						}
					/>
				</Stack>

				<TextField
					select
					label="Billing Type"
					value={row.billingType}
					onChange={(e) => updateRow(row.key, { billingType: e.target.value as 'billable' | 'non_billable' })}
					fullWidth
					required
					disabled={submitting}
					helperText="Select 'Billable' for client billing or 'Non-Billable' for internal hours"
				>
					<MenuItem value="billable">Billable</MenuItem>
					<MenuItem value="non_billable">Non-Billable</MenuItem>
				</TextField>

				<Box>
					<RichTextEditor
						label="Notes / Description"
						value={row.notes}
						onChange={(val) => updateRow(row.key, { notes: val })}
						placeholder="What did you work on?"
						maxWords={150}
						variant="simple"
						minHeight={100}
						error={hasNotesError}
					/>
					<Typography
						variant="caption"
						color={hasNotesError ? 'error.main' : 'text.secondary'}
						sx={{ display: 'block', mt: 0.5 }}
					>
						{hasNotesError
							? 'Description exceeds the 150-word limit. Please shorten it.'
							: "Describe your activity (e.g. 'Created new UI components' or 'Attended sync meeting')"}
					</Typography>
				</Box>
			</Stack>
		</React.Fragment>
	);
};

