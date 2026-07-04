import React, { useState } from 'react';
import {
	Box,
	TextField,
	Button,
	IconButton,
	Stack,
	Checkbox,
	FormControlLabel,
	Typography,
	CircularProgress,
	Alert,
	Tooltip,
} from '@mui/material';
import { Add, DeleteOutline, ArrowUpward, ArrowDownward } from '@mui/icons-material';
import BaseDialog from '../../common/dialogbox/BaseDialog';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { updateTaskStatuses } from '../../../store/slices/projectsSlice';
import useToast from '../../../hooks/useToast';
import type { ProjectTaskStatusUpsert } from '../../../models/projects/projectTask';

interface ProjectTaskStatusManagementDialogProps {
	open: boolean;
	onClose: () => void;
}

const blankStatus = (order: number): ProjectTaskStatusUpsert => ({
	name: '',
	order,
	color: '#808080',
	is_initial_status: false,
	is_done_status: false,
});

export const ProjectTaskStatusManagementDialog: React.FC<ProjectTaskStatusManagementDialogProps> = ({ open, onClose }) => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const { taskStatuses, taskStatusMutating } = useAppSelector((state) => state.projects);

	const [statuses, setStatuses] = useState<ProjectTaskStatusUpsert[]>([]);
	const [error, setError] = useState<string | null>(null);

	const [prevOpen, setPrevOpen] = useState(open);
	if (open !== prevOpen) {
		setPrevOpen(open);
		if (open) {
			setStatuses(taskStatuses.map((s) => ({ ...s })));
			setError(null);
		}
	}

	const updateStatus = (index: number, patch: Partial<ProjectTaskStatusUpsert>) => {
		setStatuses((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
	};

	const removeStatus = (index: number) => {
		setStatuses((prev) => prev.filter((_, i) => i !== index));
	};

	const addStatus = () => {
		setStatuses((prev) => [...prev, blankStatus(prev.length)]);
	};

	const moveStatus = (index: number, direction: -1 | 1) => {
		setStatuses((prev) => {
			const next = [...prev];
			const target = index + direction;
			if (target < 0 || target >= next.length) return prev;
			[next[index], next[target]] = [next[target], next[index]];
			return next;
		});
	};

	const handleSave = async () => {
		if (statuses.some((s) => !s.name.trim())) {
			setError('Every status needs a name');
			return;
		}
		setError(null);
		try {
			await dispatch(updateTaskStatuses(statuses.map((s, i) => ({ ...s, order: i })))).unwrap();
			toast.success('Task statuses updated');
			onClose();
		} catch (err: any) {
			setError(err || 'Failed to update task statuses');
		}
	};

	return (
		<BaseDialog
			open={open}
			onClose={onClose}
			title="Manage Task Statuses"
			subtitle="Customize the columns used across every project's task board"
			maxWidth="md"
			loading={taskStatusMutating}
			actions={
				<>
					<Button onClick={onClose} disabled={taskStatusMutating} sx={{ textTransform: 'none', fontWeight: 600 }}>
						Cancel
					</Button>
					<Button
						variant="contained"
						onClick={handleSave}
						disabled={taskStatusMutating}
						sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px', px: 3 }}
					>
						{taskStatusMutating ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
					</Button>
				</>
			}
		>
			<Stack spacing={2}>
				{error && <Alert severity="error">{error}</Alert>}

				{statuses.map((status, index) => (
					<Stack key={index} direction="row" spacing={1.5} alignItems="center">
						<Stack direction="column" spacing={0}>
							<IconButton size="small" disabled={index === 0} onClick={() => moveStatus(index, -1)}>
								<ArrowUpward fontSize="inherit" />
							</IconButton>
							<IconButton size="small" disabled={index === statuses.length - 1} onClick={() => moveStatus(index, 1)}>
								<ArrowDownward fontSize="inherit" />
							</IconButton>
						</Stack>

						<TextField
							value={status.color}
							onChange={(e) => updateStatus(index, { color: e.target.value })}
							type="color"
							size="small"
							sx={{ width: 56 }}
						/>

						<TextField
							value={status.name}
							onChange={(e) => updateStatus(index, { name: e.target.value })}
							placeholder="Status name"
							size="small"
							sx={{ flex: 1 }}
						/>

						<Tooltip title="New tasks start in this status">
							<FormControlLabel
								control={
									<Checkbox
										size="small"
										checked={status.is_initial_status}
										onChange={(e) => updateStatus(index, { is_initial_status: e.target.checked })}
									/>
								}
								label="Initial"
								sx={{ mr: 0 }}
							/>
						</Tooltip>

						<Tooltip title="Tasks reaching this status count as complete">
							<FormControlLabel
								control={
									<Checkbox
										size="small"
										checked={status.is_done_status}
										onChange={(e) => updateStatus(index, { is_done_status: e.target.checked })}
									/>
								}
								label="Done"
								sx={{ mr: 0 }}
							/>
						</Tooltip>

						<IconButton size="small" onClick={() => removeStatus(index)} color="error">
							<DeleteOutline fontSize="small" />
						</IconButton>
					</Stack>
				))}

				<Box>
					<Button startIcon={<Add />} onClick={addStatus} sx={{ textTransform: 'none', fontWeight: 600 }}>
						Add Status
					</Button>
				</Box>

				{statuses.length === 0 && (
					<Typography variant="body2" color="text.secondary">
						No task statuses configured yet. Add at least one to create tasks.
					</Typography>
				)}
			</Stack>
		</BaseDialog>
	);
};

export default ProjectTaskStatusManagementDialog;
