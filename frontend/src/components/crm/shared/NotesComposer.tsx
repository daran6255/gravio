import React, { useState } from 'react';
import { Box, TextField, Button, Stack, Divider, CircularProgress, ToggleButtonGroup, ToggleButton, Tabs, Tab, IconButton, Tooltip, MenuItem } from '@mui/material';
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

const NOTE_MAX_WORDS = 250;

interface NotesComposerProps {
	entityType: CRMActivityEntityType;
	entityId: number;
	onCreated?: () => void;
	/** 'compact' renders an underlined-tab type selector and a single note field, for use in tighter detail panels. */
	variant?: 'standard' | 'compact';
}

export const NotesComposer: React.FC<NotesComposerProps> = ({ entityType, entityId, onCreated, variant = 'standard' }) => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const [type, setType] = useState<CRMActivityType>('note');
	const [subject, setSubject] = useState('');
	const [description, setDescription] = useState('');
	const [dueDate, setDueDate] = useState('');
	const [isCompleted, setIsCompleted] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [direction, setDirection] = useState<string>('Outbound');
	const [outcome, setOutcome] = useState('Connected');
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
			setDueDate('');
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

				{type === 'note' ? (
					<Box sx={{ mb: 1.5 }}>
						<RichTextEditor
							value={description}
							onChange={setDescription}
							placeholder="Write your note here..."
							minHeight={90}
							variant="simple"
							maxWords={NOTE_MAX_WORDS}
						/>
					</Box>
				) : type === 'call' ? (
					<Box sx={{ mb: 1.5 }}>
						<Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
							<ToggleButtonGroup
								value={direction}
								exclusive
								onChange={(_e, val) => val && setDirection(val)}
								size="small"
								sx={{
									flexShrink: 0,
									height: 36,
									'& .MuiToggleButtonGroup-grouped': {
										border: '1px solid',
										borderColor: 'divider',
										borderRadius: '8px !important',
										textTransform: 'none',
										px: 1.25,
										fontSize: '0.78rem',
										fontWeight: 600,
									}
								}}
							>
								<ToggleButton value="Outbound">Outbound</ToggleButton>
								<ToggleButton value="Inbound">Inbound</ToggleButton>
							</ToggleButtonGroup>

							<TextField
								select
								value={outcome}
								onChange={(e) => setOutcome(e.target.value)}
								size="small"
								sx={{
									flexGrow: 1,
									'& .MuiOutlinedInput-root': {
										borderRadius: '8px',
										height: 36,
										fontSize: '0.78rem',
									}
								}}
							>
								<MenuItem value="Connected" sx={{ fontSize: '0.78rem' }}>Connected</MenuItem>
								<MenuItem value="Busy" sx={{ fontSize: '0.78rem' }}>Busy</MenuItem>
								<MenuItem value="No Answer" sx={{ fontSize: '0.78rem' }}>No Answer</MenuItem>
								<MenuItem value="Left Voicemail" sx={{ fontSize: '0.78rem' }}>Left Voicemail</MenuItem>
								<MenuItem value="Wrong Number" sx={{ fontSize: '0.78rem' }}>Wrong Number</MenuItem>
							</TextField>
						</Stack>

						<TextField
							variant="standard"
							placeholder="Subject/Purpose (optional, e.g. Discuss onboarding)"
							value={subject}
							onChange={(e) => setSubject(e.target.value)}
							fullWidth
							InputProps={{ disableUnderline: true, style: { fontSize: '0.82rem' } }}
							sx={{ mb: 1 }}
						/>

						<TextField
							variant="outlined"
							placeholder="Write call notes or record a summary..."
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							fullWidth
							multiline
							minRows={3}
							sx={{
								mb: 0.5,
								'& .MuiOutlinedInput-root': {
									borderRadius: '8px',
									fontSize: '0.82rem',
									p: 1.25,
								}
							}}
						/>
					</Box>
				) : type === 'email' ? (
					<Box sx={{ mb: 1.5 }}>
						<Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
							<ToggleButtonGroup
								value={direction}
								exclusive
								onChange={(_e, val) => {
									if (val) {
										setDirection(val);
										setOutcome(val === 'Sent' ? 'Sent' : 'Received');
									}
								}}
								size="small"
								sx={{
									flexShrink: 0,
									height: 36,
									'& .MuiToggleButtonGroup-grouped': {
										border: '1px solid',
										borderColor: 'divider',
										borderRadius: '8px !important',
										textTransform: 'none',
										px: 1.25,
										fontSize: '0.78rem',
										fontWeight: 600,
									}
								}}
							>
								<ToggleButton value="Sent">Sent</ToggleButton>
								<ToggleButton value="Received">Received</ToggleButton>
							</ToggleButtonGroup>

							<TextField
								select
								value={outcome}
								onChange={(e) => setOutcome(e.target.value)}
								size="small"
								sx={{
									flexGrow: 1,
									'& .MuiOutlinedInput-root': {
										borderRadius: '8px',
										height: 36,
										fontSize: '0.78rem',
									}
								}}
							>
								{direction === 'Sent' ? [
									<MenuItem key="Sent" value="Sent" sx={{ fontSize: '0.78rem' }}>Sent</MenuItem>,
									<MenuItem key="Opened" value="Opened" sx={{ fontSize: '0.78rem' }}>Opened</MenuItem>,
									<MenuItem key="Replied" value="Replied" sx={{ fontSize: '0.78rem' }}>Replied</MenuItem>
								] : [
									<MenuItem key="Received" value="Received" sx={{ fontSize: '0.78rem' }}>Received</MenuItem>,
									<MenuItem key="Read" value="Read" sx={{ fontSize: '0.78rem' }}>Read</MenuItem>,
									<MenuItem key="Replied" value="Replied" sx={{ fontSize: '0.78rem' }}>Replied</MenuItem>
								]}
							</TextField>
						</Stack>

						<TextField
							variant="standard"
							placeholder="Subject/Purpose (optional, e.g. Contract review)"
							value={subject}
							onChange={(e) => setSubject(e.target.value)}
							fullWidth
							InputProps={{ disableUnderline: true, style: { fontSize: '0.82rem' } }}
							sx={{ mb: 1 }}
						/>

						<Box sx={{ mb: 0.5 }}>
							<RichTextEditor
								value={description}
								onChange={setDescription}
								placeholder="Write email body here..."
								minHeight={90}
								variant="simple"
							/>
						</Box>
					</Box>
				) : type === 'meeting' ? (
					<Box sx={{ mb: 1.5 }}>
						<Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
							<ToggleButtonGroup
								value={direction}
								exclusive
								onChange={(_e, val) => val && setDirection(val)}
								size="small"
								sx={{
									flexShrink: 0,
									height: 36,
									'& .MuiToggleButtonGroup-grouped': {
										border: '1px solid',
										borderColor: 'divider',
										borderRadius: '8px !important',
										textTransform: 'none',
										px: 1,
										fontSize: '0.76rem',
										fontWeight: 600,
									}
								}}
							>
								<ToggleButton value="Online">Online</ToggleButton>
								<ToggleButton value="In-Person">In-Person</ToggleButton>
								<ToggleButton value="Phone">Phone</ToggleButton>
							</ToggleButtonGroup>

							<TextField
								select
								value={outcome}
								onChange={(e) => {
									const val = e.target.value;
									setOutcome(val);
									setIsCompleted(val !== 'Scheduled');
								}}
								size="small"
								sx={{
									flexGrow: 1,
									'& .MuiOutlinedInput-root': {
										borderRadius: '8px',
										height: 36,
										fontSize: '0.78rem',
									}
								}}
							>
								<MenuItem value="Scheduled" sx={{ fontSize: '0.78rem' }}>Scheduled</MenuItem>
								<MenuItem value="Completed" sx={{ fontSize: '0.78rem' }}>Completed</MenuItem>
								<MenuItem value="No Show" sx={{ fontSize: '0.78rem' }}>No Show</MenuItem>
								<MenuItem value="Canceled" sx={{ fontSize: '0.78rem' }}>Canceled</MenuItem>
							</TextField>
						</Stack>

						<TextField
							variant="standard"
							placeholder="Meeting Subject (optional, e.g. Project onboarding)"
							value={subject}
							onChange={(e) => setSubject(e.target.value)}
							fullWidth
							InputProps={{ disableUnderline: true, style: { fontSize: '0.82rem' } }}
							sx={{ mb: 1 }}
						/>

						<Box sx={{ mb: 0.5 }}>
							<RichTextEditor
								value={description}
								onChange={setDescription}
								placeholder="Write meeting agenda or notes..."
								minHeight={90}
								variant="simple"
							/>
						</Box>
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
						label={type === 'call' ? 'Call Time' : 'Due'}
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
						sx={{ mb: 1.5, '& .MuiToggleButtonGroup-grouped': { border: '1px solid', borderColor: 'divider', borderRadius: '8px !important', textTransform: 'none', px: 1.25 } }}
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

			{type === 'call' && (
				<Stack direction="row" spacing={1.5} sx={{ mb: 1.5 }}>
					<ToggleButtonGroup
						value={direction}
						exclusive
						onChange={(_e, val) => val && setDirection(val)}
						size="small"
						sx={{
							flexShrink: 0,
							height: 40,
							'& .MuiToggleButtonGroup-grouped': {
								border: '1px solid',
								borderColor: 'divider',
								borderRadius: '8px !important',
								textTransform: 'none',
								px: 2,
								fontWeight: 600,
							}
						}}
					>
						<ToggleButton value="Outbound">Outbound</ToggleButton>
						<ToggleButton value="Inbound">Inbound</ToggleButton>
					</ToggleButtonGroup>

					<TextField
						select
						label="Call Outcome"
						value={outcome}
						onChange={(e) => setOutcome(e.target.value)}
						size="small"
						sx={{
							flexGrow: 1,
							'& .MuiOutlinedInput-root': {
								borderRadius: '8px',
								height: 40,
							}
						}}
					>
						<MenuItem value="Connected">Connected</MenuItem>
						<MenuItem value="Busy">Busy</MenuItem>
						<MenuItem value="No Answer">No Answer</MenuItem>
						<MenuItem value="Left Voicemail">Left Voicemail</MenuItem>
						<MenuItem value="Wrong Number">Wrong Number</MenuItem>
					</TextField>
				</Stack>
			)}

			{type === 'email' && (
				<Stack direction="row" spacing={1.5} sx={{ mb: 1.5 }}>
					<ToggleButtonGroup
						value={direction}
						exclusive
						onChange={(_e, val) => {
							if (val) {
								setDirection(val);
								setOutcome(val === 'Sent' ? 'Sent' : 'Received');
							}
						}}
						size="small"
						sx={{
							flexShrink: 0,
							height: 40,
							'& .MuiToggleButtonGroup-grouped': {
								border: '1px solid',
								borderColor: 'divider',
								borderRadius: '8px !important',
								textTransform: 'none',
								px: 2,
								fontWeight: 600,
							}
						}}
					>
						<ToggleButton value="Sent">Sent</ToggleButton>
						<ToggleButton value="Received">Received</ToggleButton>
					</ToggleButtonGroup>

					<TextField
						select
						label="Email Status"
						value={outcome}
						onChange={(e) => setOutcome(e.target.value)}
						size="small"
						sx={{
							flexGrow: 1,
							'& .MuiOutlinedInput-root': {
								borderRadius: '8px',
								height: 40,
							}
						}}
					>
						{direction === 'Sent' ? [
							<MenuItem key="Sent" value="Sent">Sent</MenuItem>,
							<MenuItem key="Opened" value="Opened">Opened</MenuItem>,
							<MenuItem key="Replied" value="Replied">Replied</MenuItem>
						] : [
							<MenuItem key="Received" value="Received">Received</MenuItem>,
							<MenuItem key="Read" value="Read">Read</MenuItem>,
							<MenuItem key="Replied" value="Replied">Replied</MenuItem>
						]}
					</TextField>
				</Stack>
			)}

			{type === 'meeting' && (
				<Stack direction="row" spacing={1.5} sx={{ mb: 1.5 }}>
					<ToggleButtonGroup
						value={direction}
						exclusive
						onChange={(_e, val) => val && setDirection(val)}
						size="small"
						sx={{
							flexShrink: 0,
							height: 40,
							'& .MuiToggleButtonGroup-grouped': {
								border: '1px solid',
								borderColor: 'divider',
								borderRadius: '8px !important',
								textTransform: 'none',
								px: 2,
								fontWeight: 600,
							}
						}}
					>
						<ToggleButton value="Online">Online</ToggleButton>
						<ToggleButton value="In-Person">In-Person</ToggleButton>
						<ToggleButton value="Phone">Phone</ToggleButton>
					</ToggleButtonGroup>

					<TextField
						select
						label="Meeting Status"
						value={outcome}
						onChange={(e) => {
							const val = e.target.value;
							setOutcome(val);
							setIsCompleted(val !== 'Scheduled');
						}}
						size="small"
						sx={{
							flexGrow: 1,
							'& .MuiOutlinedInput-root': {
								borderRadius: '8px',
								height: 40,
							}
						}}
					>
						<MenuItem value="Scheduled">Scheduled</MenuItem>
						<MenuItem value="Completed">Completed</MenuItem>
						<MenuItem value="No Show">No Show</MenuItem>
						<MenuItem value="Canceled">Canceled</MenuItem>
					</TextField>
				</Stack>
			)}

			{type !== 'note' && (
				<TextField
					placeholder={type === 'task' ? 'What needs to be done?' : type === 'call' ? 'Subject/Purpose (optional)' : type === 'email' ? 'Subject/Purpose (optional, e.g. Contract review)' : type === 'meeting' ? 'Subject/Purpose (optional, e.g. Project onboarding)' : 'Add a quick note...'}
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
					placeholder={type === 'note' ? 'Write your note here...' : type === 'call' ? 'Write call notes or record a summary...' : type === 'email' ? 'Write email body here...' : type === 'meeting' ? 'Write meeting agenda or notes...' : 'Details (optional)'}
					minHeight={100}
					variant="simple"
					maxWords={type === 'note' ? NOTE_MAX_WORDS : undefined}
				/>
			</Box>

			<Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
				<Stack direction="row" spacing={1.5} alignItems="center">
					{(type === 'task' || type === 'meeting' || type === 'call' || type === 'email') && (
						<TextField
							type="datetime-local"
							label={type === 'call' ? 'Call Time' : type === 'email' ? 'Email Time' : type === 'meeting' ? 'Meeting Time' : 'Due'}
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
