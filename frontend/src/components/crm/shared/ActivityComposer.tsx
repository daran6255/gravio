import React, { useState } from 'react';
import { Box, TextField, Button, Stack, CircularProgress, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { Notes, Call, Email, Groups, CheckCircleOutline, WhatsApp } from '@mui/icons-material';
import { useAppDispatch } from '../../../store/hooks';
import { createActivity } from '../../../store/slices/crmSlice';
import type { CRMActivityType, CRMActivityEntityType } from '../../../models/crm/crmActivity';
import useToast from '../../../hooks/useToast';

const TYPE_OPTIONS: { value: CRMActivityType; label: string; icon: React.ReactNode }[] = [
	{ value: 'note', label: 'Note', icon: <Notes fontSize="small" /> },
	{ value: 'call', label: 'Call', icon: <Call fontSize="small" /> },
	{ value: 'email', label: 'Email', icon: <Email fontSize="small" /> },
	{ value: 'meeting', label: 'Meeting', icon: <Groups fontSize="small" /> },
	{ value: 'task', label: 'Task', icon: <CheckCircleOutline fontSize="small" /> },
	{ value: 'whatsapp', label: 'WhatsApp', icon: <WhatsApp fontSize="small" /> },
];

interface ActivityComposerProps {
	entityType: CRMActivityEntityType;
	entityId: number;
	onCreated?: () => void;
}

export const ActivityComposer: React.FC<ActivityComposerProps> = ({ entityType, entityId, onCreated }) => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const [type, setType] = useState<CRMActivityType>('note');
	const [subject, setSubject] = useState('');
	const [description, setDescription] = useState('');
	const [dueDate, setDueDate] = useState('');
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async () => {
		if (!subject.trim()) return;
		setSubmitting(true);
		try {
			await dispatch(createActivity({
				type,
				subject: subject.trim(),
				description: description || undefined,
				entity_type: entityType,
				entity_id: entityId,
				due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
			})).unwrap();
			setSubject('');
			setDescription('');
			setDueDate('');
			toast.success('Activity logged');
			onCreated?.();
		} catch (err: any) {
			toast.error(err || 'Failed to log activity');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Box sx={{
			p: 2,
			borderRadius: '14px',
			border: '1px solid',
			borderColor: 'divider',
			bgcolor: 'background.default',
		}}>
			<ToggleButtonGroup
				value={type}
				exclusive
				onChange={(_e, value) => value && setType(value)}
				size="small"
				sx={{ mb: 1.5, flexWrap: 'wrap', gap: 0.5, '& .MuiToggleButtonGroup-grouped': { border: '1px solid', borderColor: 'divider', borderRadius: '8px !important' } }}
			>
				{TYPE_OPTIONS.map((opt) => (
					<ToggleButton key={opt.value} value={opt.value} sx={{ textTransform: 'none', px: 1.25, gap: 0.5 }}>
						{opt.icon}
						{opt.label}
					</ToggleButton>
				))}
			</ToggleButtonGroup>

			<TextField
				placeholder={type === 'task' ? 'What needs to be done?' : 'Add a quick note...'}
				value={subject}
				onChange={(e) => setSubject(e.target.value)}
				fullWidth
				size="small"
				sx={{ mb: 1.5 }}
			/>

			<TextField
				placeholder="Details (optional)"
				value={description}
				onChange={(e) => setDescription(e.target.value)}
				fullWidth
				multiline
				minRows={2}
				size="small"
				sx={{ mb: 1.5 }}
			/>

			<Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
				{(type === 'task' || type === 'meeting' || type === 'call') ? (
					<TextField
						type="datetime-local"
						label="Due"
						value={dueDate}
						onChange={(e) => setDueDate(e.target.value)}
						size="small"
						InputLabelProps={{ shrink: true }}
					/>
				) : <Box />}

				<Button
					variant="contained"
					size="small"
					disabled={!subject.trim() || submitting}
					onClick={handleSubmit}
					sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
				>
					{submitting ? <CircularProgress size={18} color="inherit" /> : 'Log Activity'}
				</Button>
			</Stack>
		</Box>
	);
};

export default ActivityComposer;
