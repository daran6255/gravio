import React, { useState } from 'react';
import { Box, TextField, Button, Stack, Divider, CircularProgress, ToggleButtonGroup, ToggleButton, Tabs, Tab, IconButton, Tooltip } from '@mui/material';
import { Notes, Call, Email, Groups, CheckCircleOutline, WhatsApp, AttachFile, AlternateEmail } from '@mui/icons-material';
import { useAppDispatch } from '../../../store/hooks';
import { createActivity } from '../../../store/slices/crmSlice';
import type { CRMActivityType, CRMActivityEntityType } from '../../../models/crm/crmActivity';
import useToast from '../../../hooks/useToast';
import RichTextEditor from '../../common/form/RichTextEditor';

const TYPE_OPTIONS: { value: CRMActivityType; label: string; icon: React.ReactElement }[] = [
	{ value: 'note', label: 'Note', icon: <Notes fontSize="small" /> },
	{ value: 'call', label: 'Call', icon: <Call fontSize="small" /> },
	{ value: 'email', label: 'Email', icon: <Email fontSize="small" /> },
	{ value: 'meeting', label: 'Meeting', icon: <Groups fontSize="small" /> },
	{ value: 'task', label: 'Task', icon: <CheckCircleOutline fontSize="small" /> },
	{ value: 'whatsapp', label: 'WhatsApp', icon: <WhatsApp fontSize="small" /> },
];

const COMPACT_TYPE_OPTIONS = TYPE_OPTIONS.filter((opt) =>
	['note', 'call', 'email', 'meeting'].includes(opt.value)
);

const SAVE_LABEL: Record<CRMActivityType, string> = {
	note: 'Save Note',
	call: 'Log Call',
	email: 'Log Email',
	meeting: 'Log Meeting',
	task: 'Log Task',
	whatsapp: 'Log WhatsApp',
};

interface ActivityComposerProps {
	entityType: CRMActivityEntityType;
	entityId: number;
	onCreated?: () => void;
	/** 'compact' renders an underlined-tab type selector and a single note field, for use in tighter detail panels. */
	variant?: 'standard' | 'compact';
}

export const ActivityComposer: React.FC<ActivityComposerProps> = ({ entityType, entityId, onCreated, variant = 'standard' }) => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const [type, setType] = useState<CRMActivityType>('note');
	const [subject, setSubject] = useState('');
	const [description, setDescription] = useState('');
	const [dueDate, setDueDate] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const compact = variant === 'compact';

	const getPlainText = (htmlStr: string) => {
		if (typeof document === 'undefined') return '';
		const temp = document.createElement('div');
		temp.innerHTML = htmlStr;
		return (temp.textContent || temp.innerText || '').trim();
	};

	const hasDescriptionContent = getPlainText(description).length > 0;
	const isButtonDisabled = type === 'note'
		? !hasDescriptionContent
		: !subject.trim();

	const handleSubmit = async () => {
		let finalSubject = '';
		if (type === 'note') {
			// Extract plain text and decode HTML entities dynamically using the browser DOM parser
			const plainText = getPlainText(description);
			if (plainText.length > 60) {
				finalSubject = plainText.substring(0, 60) + '...';
			} else {
				finalSubject = plainText || 'Note';
			}
		} else {
			finalSubject = subject.trim();
		}

		if (!finalSubject) return;

		setSubmitting(true);
		try {
			await dispatch(createActivity({
				type,
				subject: finalSubject,
				description: hasDescriptionContent ? description : undefined,
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

	if (compact) {
		return (
			<Box>
				<Tabs
					value={type}
					onChange={(_e, value) => {
						setType(value);
						setSubject('');
						setDescription('');
					}}
					variant="scrollable"
					scrollButtons={false}
					sx={{
						mb: 1.5,
						minHeight: 32,
						borderBottom: '1px solid',
						borderColor: 'divider',
						'& .MuiTabs-indicator': { height: 2, bgcolor: 'primary.main' },
						'& .MuiTab-root': {
							textTransform: 'none',
							fontWeight: 700,
							minHeight: 32,
							minWidth: 'auto',
							px: 1.25,
							gap: 0.5,
							fontSize: '0.8rem',
							color: 'text.secondary',
							'&.Mui-selected': { color: 'primary.main' },
						},
					}}
				>
					{COMPACT_TYPE_OPTIONS.map((opt) => (
						<Tab key={opt.value} value={opt.value} icon={opt.icon} iconPosition="start" label={opt.label} />
					))}
				</Tabs>

				{type === 'note' ? (
					<Box sx={{ mb: 1.5 }}>
						<RichTextEditor
							value={description}
							onChange={setDescription}
							placeholder="Write your note here..."
							minHeight={90}
							variant="simple"
						/>
					</Box>
				) : (
					<TextField
						variant="standard"
						placeholder={type === 'task' ? 'What needs to be done?' : 'Type a note or record a summary...'}
						value={subject}
						onChange={(e) => setSubject(e.target.value)}
						fullWidth
						multiline
						minRows={2}
						InputProps={{ disableUnderline: true }}
						sx={{ mb: 1 }}
					/>
				)}

				{(type === 'task' || type === 'meeting' || type === 'call') && (
					<TextField
						type="datetime-local"
						label="Due"
						value={dueDate}
						onChange={(e) => setDueDate(e.target.value)}
						size="small"
						fullWidth
						InputLabelProps={{ shrink: true }}
						sx={{ mb: 1.5 }}
					/>
				)}

				<Divider sx={{ mb: 1 }} />

				<Stack direction="row" spacing={0.5} alignItems="center" justifyContent="space-between">
					<Stack direction="row" spacing={0.5}>
						<Tooltip title="Attachments coming soon">
							<IconButton size="small" disabled><AttachFile fontSize="small" /></IconButton>
						</Tooltip>
						<Tooltip title="Mentions coming soon">
							<IconButton size="small" disabled><AlternateEmail fontSize="small" /></IconButton>
						</Tooltip>
					</Stack>

					<Button
						variant="contained"
						size="small"
						disabled={isButtonDisabled || submitting}
						onClick={handleSubmit}
						sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
					>
						{submitting ? <CircularProgress size={18} color="inherit" /> : SAVE_LABEL[type]}
					</Button>
				</Stack>
			</Box>
		);
	}

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
				onChange={(_e, value) => {
					if (value) {
						setType(value);
						setSubject('');
						setDescription('');
					}
				}}
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

			{type !== 'note' && (
				<TextField
					placeholder={type === 'task' ? 'What needs to be done?' : 'Add a quick note...'}
					value={subject}
					onChange={(e) => setSubject(e.target.value)}
					fullWidth
					size="small"
					sx={{ mb: 1.5 }}
				/>
			)}

			<Box sx={{ mb: 1.5 }}>
				<RichTextEditor
					value={description}
					onChange={setDescription}
					placeholder={type === 'note' ? 'Write your note here...' : 'Details (optional)'}
					minHeight={100}
					variant="simple"
				/>
			</Box>

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
					disabled={isButtonDisabled || submitting}
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
