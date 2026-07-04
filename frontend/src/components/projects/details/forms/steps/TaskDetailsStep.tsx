import React from 'react';
import { Stack, TextField, MenuItem, Autocomplete } from '@mui/material';
import type { ProjectTaskStatus, ProjectTaskTag } from '../../../../../models/projects/projectTask';
import type { LeadPriority } from '../../../../../models/crm/lead';
import type { CRMOwnerOption } from '../../../../../models/crm/owner';
import { TaskTagsInput } from '../TaskTagsInput';

const PRIORITIES: { value: LeadPriority; label: string }[] = [
	{ value: 'low', label: 'Low' },
	{ value: 'medium', label: 'Medium' },
	{ value: 'high', label: 'High' },
	{ value: 'urgent', label: 'Urgent' },
];

interface TaskDetailsStepProps {
	title: string;
	setTitle: (val: string) => void;
	titleError: string;
	description: string;
	setDescription: (val: string) => void;
	statusId: number | '';
	setStatusId: (val: number) => void;
	statuses: ProjectTaskStatus[];
	priority: LeadPriority;
	setPriority: (val: LeadPriority) => void;
	assigneeId: number | null;
	setAssigneeId: (val: number | null) => void;
	owners: CRMOwnerOption[];
	tags: ProjectTaskTag[];
	setTags: (val: ProjectTaskTag[]) => void;
	existingTags: ProjectTaskTag[];
}

export const TaskDetailsStep: React.FC<TaskDetailsStepProps> = ({
	title,
	setTitle,
	titleError,
	description,
	setDescription,
	statusId,
	setStatusId,
	statuses,
	priority,
	setPriority,
	assigneeId,
	setAssigneeId,
	owners,
	tags,
	setTags,
	existingTags,
}) => {
	const selectedAssignee = owners.find((o) => o.id === assigneeId) || null;

	return (
		<Stack spacing={2.5} sx={{ mt: 1 }}>
			<TextField
				label="Title"
				value={title}
				onChange={(e) => setTitle(e.target.value)}
				required
				fullWidth
				error={!!titleError}
				helperText={titleError}
			/>

			<TextField
				label="Description"
				value={description}
				onChange={(e) => setDescription(e.target.value)}
				fullWidth
				multiline
				rows={3}
			/>

			<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
				<TextField
					select
					label="Status"
					value={statusId}
					onChange={(e) => setStatusId(Number(e.target.value))}
					fullWidth
				>
					{statuses.map((s) => (
						<MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
					))}
				</TextField>

				<TextField
					select
					label="Priority"
					value={priority}
					onChange={(e) => setPriority(e.target.value as LeadPriority)}
					fullWidth
				>
					{PRIORITIES.map((p) => (
						<MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
					))}
				</TextField>
			</Stack>

			<Autocomplete
				fullWidth
				options={owners}
				getOptionLabel={(o) => o.full_name || o.email}
				isOptionEqualToValue={(o, v) => o.id === v.id}
				value={selectedAssignee}
				onChange={(_, newValue) => setAssigneeId(newValue?.id ?? null)}
				renderInput={(params) => <TextField {...params} label="Assignee" placeholder="Unassigned" />}
			/>

			<TaskTagsInput value={tags} onChange={setTags} existingTags={existingTags} />
		</Stack>
	);
};

export default TaskDetailsStep;
