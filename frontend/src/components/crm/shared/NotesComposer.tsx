import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Stack, Divider, CircularProgress, ToggleButtonGroup, ToggleButton, Tabs, Tab, IconButton, Tooltip } from '@mui/material';
import { Notes, Call, Email, Groups, AttachFile, AlternateEmail } from '@mui/icons-material';
import { useAppDispatch } from '../../../store/hooks';
import { createActivity } from '../../../store/slices/crmSlice';
import type { CRMActivityType, CRMActivityEntityType } from '../../../models/crm/crmActivity';
import useToast from '../../../hooks/useToast';
import { NoteTab, CallTab, EmailTab, MeetingTab } from './tabs';

const TYPE_OPTIONS: { value: CRMActivityType; label: string; icon: React.ReactElement }[] = [
	{ value: 'note', label: 'Note', icon: <Notes fontSize="small" /> },
	{ value: 'call', label: 'Call', icon: <Call fontSize="small" /> },
	{ value: 'email', label: 'Email', icon: <Email fontSize="small" /> },
	{ value: 'meeting', label: 'Meeting', icon: <Groups fontSize="small" /> },
];

const COMPACT_TYPE_OPTIONS = TYPE_OPTIONS;

const SAVE_LABEL: Record<CRMActivityType, string> = {
	note: 'Save Note',
	call: 'Log Call',
	email: 'Log Email',
	meeting: 'Log Meeting',
	task: 'Log Task',
	whatsapp: 'Log WhatsApp',
};

interface NotesComposerProps {
	entityType: CRMActivityEntityType;
	entityId: number;
	onCreated?: () => void;
	/** 'compact' renders an underlined-tab type selector and a single note field, for use in tighter detail panels. */
	variant?: 'standard' | 'compact';
	defaultType?: CRMActivityType;
}

export const NotesComposer: React.FC<NotesComposerProps> = ({ entityType, entityId, onCreated, variant = 'standard', defaultType }) => {
	const getLocalDateTimeString = () => {
		const now = new Date();
		const offset = now.getTimezoneOffset();
		const localDate = new Date(now.getTime() - offset * 60 * 1000);
		return localDate.toISOString().slice(0, 16);
	};

	const dispatch = useAppDispatch();
	const toast = useToast();
	const [type, setType] = useState<CRMActivityType>(defaultType || 'note');
	const [subject, setSubject] = useState('');
	const [description, setDescription] = useState('');
	const [dueDate, setDueDate] = useState(getLocalDateTimeString());
	const [isCompleted, setIsCompleted] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [direction, setDirection] = useState<string>('Outbound');
	const [outcome, setOutcome] = useState('Connected');
	const compact = variant === 'compact';

	// Auto-draft preservation
	useEffect(() => {
		const key = `crm_composer_draft_${entityType}_${entityId}_${type}`;
		const saved = sessionStorage.getItem(key);
		if (saved) {
			try {
				const { subject: s, description: d } = JSON.parse(saved);
				setSubject(s || '');
				setDescription(d || '');
			} catch (e) {
				// ignore parse errors
			}
		} else {
			setSubject('');
			setDescription('');
		}
	}, [entityType, entityId, type]);

	useEffect(() => {
		const key = `crm_composer_draft_${entityType}_${entityId}_${type}`;
		if (subject || description) {
			sessionStorage.setItem(key, JSON.stringify({ subject, description }));
		} else {
			sessionStorage.removeItem(key);
		}
	}, [entityType, entityId, type, subject, description]);

	const getDateLabel = () => {
		if (type === 'task') return 'Due Date';
		if (isCompleted) {
			switch (type) {
				case 'call': return 'Call Time';
				case 'email': return 'Email Time';
				case 'meeting': return 'Meeting Time';
				default: return 'Occurrence Time';
			}
		} else {
			switch (type) {
				case 'call': return 'Scheduled Call / Follow-up';
				case 'email': return 'Scheduled Send Time';
				case 'meeting': return 'Scheduled Meeting Time';
				default: return 'Due Date';
			}
		}
	};

	const getPlainText = (htmlStr: string) => {
		if (typeof document === 'undefined') return '';
		const temp = document.createElement('div');
		temp.innerHTML = htmlStr;
		return (temp.textContent || temp.innerText || '').trim();
	};

	const hasDescriptionContent = getPlainText(description).length > 0;
	const isButtonDisabled = type === 'note'
		? !hasDescriptionContent
		: ['call', 'email', 'meeting'].includes(type)
			? false // Call, Email & Meeting subjects are auto-generated if empty, details optional
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
		} else if (type === 'call') {
			finalSubject = subject.trim() || `${direction} Call - ${outcome}`;
		} else if (type === 'email') {
			const displayDirection = direction === 'Sent' ? 'Outbound' : 'Inbound';
			finalSubject = subject.trim() || `${displayDirection} Email - ${outcome}`;
		} else if (type === 'meeting') {
			finalSubject = subject.trim() || `Meeting (${direction}) - ${outcome}`;
		} else {
			finalSubject = subject.trim();
		}

		if (!finalSubject) return;

		setSubmitting(true);
		try {
			await dispatch(createActivity({
				type,
				subject: finalSubject,
				description: (['call', 'email', 'meeting'].includes(type) ? description.trim() : hasDescriptionContent ? description : undefined),
				entity_type: entityType,
				entity_id: entityId,
				due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
				is_completed: type !== 'note' ? isCompleted : undefined,
				outcome: ['call', 'email', 'meeting'].includes(type) ? outcome : undefined,
				custom_fields: ['call', 'email', 'meeting'].includes(type) ? { direction } : undefined,
			})).unwrap();
			setSubject('');
			setDescription('');
			setDueDate(getLocalDateTimeString());
			setIsCompleted(false);
			setDirection(type === 'email' ? 'Sent' : type === 'meeting' ? 'Online' : 'Outbound');
			setOutcome(type === 'email' ? 'Sent' : type === 'meeting' ? 'Scheduled' : 'Connected');
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
						setIsCompleted(value === 'call' || value === 'email');
						setDirection(value === 'email' ? 'Sent' : value === 'meeting' ? 'Online' : 'Outbound');
						setOutcome(value === 'email' ? 'Sent' : value === 'meeting' ? 'Scheduled' : 'Connected');
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

				{type === 'note' && (
					<NoteTab description={description} setDescription={setDescription} compact={compact} />
				)}
				{type === 'call' && (
					<CallTab
						subject={subject}
						setSubject={setSubject}
						description={description}
						setDescription={setDescription}
						direction={direction}
						setDirection={setDirection}
						outcome={outcome}
						setOutcome={setOutcome}
						compact={compact}
					/>
				)}
				{type === 'email' && (
					<EmailTab
						subject={subject}
						setSubject={setSubject}
						description={description}
						setDescription={setDescription}
						direction={direction}
						setDirection={setDirection}
						outcome={outcome}
						setOutcome={setOutcome}
						compact={compact}
					/>
				)}
				{type === 'meeting' && (
					<MeetingTab
						subject={subject}
						setSubject={setSubject}
						description={description}
						setDescription={setDescription}
						direction={direction}
						setDirection={setDirection}
						outcome={outcome}
						setOutcome={setOutcome}
						setIsCompleted={setIsCompleted}
						compact={compact}
					/>
				)}
				{(type === 'meeting' || type === 'call' || type === 'email') && (
					<TextField
						type="datetime-local"
						label={getDateLabel()}
						value={dueDate}
						onChange={(e) => setDueDate(e.target.value)}
						size="small"
						fullWidth
						InputLabelProps={{ shrink: true }}
						sx={{ mb: 1.5 }}
					/>
				)}

				{type !== 'note' && (
					<ToggleButtonGroup
						value={isCompleted}
						exclusive
						onChange={(_e, value) => {
							if (value !== null) setIsCompleted(value);
						}}
						size="small"
						sx={{
							mb: 1.5,
							gap: 1,
							'& .MuiToggleButtonGroup-grouped': {
								border: '1px solid !important',
								borderColor: 'divider',
								borderRadius: '8px !important',
								marginLeft: '0px !important',
								textTransform: 'none',
								px: 2,
								fontWeight: 600,
								color: 'text.secondary',
								backgroundColor: 'background.paper',
								transition: 'all 0.2s ease',
								'&.Mui-selected': {
									backgroundColor: 'primary.main',
									color: '#ffffff',
									borderColor: 'primary.main',
									'&:hover': {
										backgroundColor: 'primary.dark',
									}
								},
								'&:hover': {
									backgroundColor: 'action.hover',
								}
							}
						}}
					>
						<ToggleButton value={false}>Pending</ToggleButton>
						<ToggleButton value={true}>Completed</ToggleButton>
					</ToggleButtonGroup>
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
						setIsCompleted(value === 'call' || value === 'email');
						setDirection(value === 'email' ? 'Sent' : value === 'meeting' ? 'Online' : 'Outbound');
						setOutcome(value === 'email' ? 'Sent' : value === 'meeting' ? 'Scheduled' : 'Connected');
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

			{type === 'note' && (
				<NoteTab description={description} setDescription={setDescription} compact={compact} />
			)}
			{type === 'call' && (
				<CallTab
					subject={subject}
					setSubject={setSubject}
					description={description}
					setDescription={setDescription}
					direction={direction}
					setDirection={setDirection}
					outcome={outcome}
					setOutcome={setOutcome}
					compact={compact}
				/>
			)}
			{type === 'email' && (
				<EmailTab
					subject={subject}
					setSubject={setSubject}
					description={description}
					setDescription={setDescription}
					direction={direction}
					setDirection={setDirection}
					outcome={outcome}
					setOutcome={setOutcome}
					compact={compact}
				/>
			)}
			{type === 'meeting' && (
				<MeetingTab
					subject={subject}
					setSubject={setSubject}
					description={description}
					setDescription={setDescription}
					direction={direction}
					setDirection={setDirection}
					outcome={outcome}
					setOutcome={setOutcome}
					setIsCompleted={setIsCompleted}
					compact={compact}
				/>
			)}
			<Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
				<Stack direction="row" spacing={1.5} alignItems="center">
					{(type === 'meeting' || type === 'call' || type === 'email') && (
						<TextField
							type="datetime-local"
							label={getDateLabel()}
							value={dueDate}
							onChange={(e) => setDueDate(e.target.value)}
							size="small"
							InputLabelProps={{ shrink: true }}
						/>
					)}

					{type !== 'note' && (
						<ToggleButtonGroup
							value={isCompleted}
							exclusive
							onChange={(_e, value) => {
								if (value !== null) setIsCompleted(value);
							}}
							size="small"
							sx={{ '& .MuiToggleButtonGroup-grouped': { border: '1px solid', borderColor: 'divider', borderRadius: '8px !important', textTransform: 'none', px: 1.25 } }}
						>
							<ToggleButton value={false}>Pending</ToggleButton>
							<ToggleButton value={true}>Completed</ToggleButton>
						</ToggleButtonGroup>
					)}
				</Stack>

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

export default NotesComposer;
