import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Stack, Divider, CircularProgress, ToggleButtonGroup, ToggleButton, Tabs, Tab, IconButton, Tooltip, useTheme, alpha } from '@mui/material';
import { Notes, Call, Email, Groups, AttachFile, AlternateEmail, RadioButtonUnchecked, CheckCircle } from '@mui/icons-material';
import { useAppDispatch } from '../../../store/hooks';
import { createActivity } from '../../../store/slices/crmSlice';
import type { CRMActivityType, CRMActivityEntityType } from '../../../models/crm/crmActivity';
import useToast from '../../../hooks/useToast';
import { DateTimePicker } from '../../common/form';
import { NoteTab, CallTab, EmailTab, MeetingTab } from './tabs';

type ComposableType = 'note' | 'call' | 'email' | 'meeting';

const TYPE_META: Record<ComposableType, { icon: React.ReactElement; label: string; color: string; subtitle: string }> = {
	note: { icon: <Notes fontSize="small" />, label: 'Note', color: '#10B981', subtitle: 'Capture context, a summary, or an internal remark.' },
	call: { icon: <Call fontSize="small" />, label: 'Call', color: '#8B5CF6', subtitle: 'Record the outcome of a phone conversation.' },
	email: { icon: <Email fontSize="small" />, label: 'Email', color: '#3B82F6', subtitle: 'Track an email that was sent or received.' },
	meeting: { icon: <Groups fontSize="small" />, label: 'Meeting', color: '#EC4899', subtitle: 'Capture the agenda, notes, and outcome.' },
};

const TYPE_OPTIONS = (Object.keys(TYPE_META) as ComposableType[]).map((value) => ({ value, ...TYPE_META[value] }));

const SAVE_LABEL: Record<CRMActivityType, string> = {
	note: 'Save Note',
	call: 'Log Call',
	email: 'Log Email',
	meeting: 'Log Meeting',
	task: 'Log Task',
	whatsapp: 'Log WhatsApp',
};

const GRADIENT_BUTTON_SX = {
	borderRadius: '8px',
	textTransform: 'none' as const,
	fontWeight: 700,
	py: 0.5,
	px: 1.5,
	fontSize: '0.75rem',
	background: 'linear-gradient(135deg, #8B7CF6 0%, #6052d9 100%)',
	boxShadow: '0 2px 8px rgba(139, 124, 246, 0.25)',
	'&:hover': {
		background: 'linear-gradient(135deg, #7c6cf0 0%, #5548c9 100%)',
		boxShadow: '0 4px 12px rgba(139, 124, 246, 0.35)',
	},
	'&.Mui-disabled': {
		background: 'none',
		boxShadow: 'none',
	},
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
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const dispatch = useAppDispatch();
	const toast = useToast();
	const [type, setType] = useState<CRMActivityType>(defaultType || 'note');
	const [subject, setSubject] = useState('');
	const [description, setDescription] = useState('');
	const [dueDate, setDueDate] = useState(new Date().toISOString());
	const [isCompleted, setIsCompleted] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [direction, setDirection] = useState<string>('Outbound');
	const [outcome, setOutcome] = useState('Connected');
	const compact = variant === 'compact';
	const activeMeta = TYPE_META[type as ComposableType] ?? TYPE_META.note;
	const labelCaptionSx = {
		display: 'block',
		mb: 0.75,
		fontSize: '0.65rem',
		fontWeight: 700,
		textTransform: 'uppercase' as const,
		letterSpacing: '0.06em',
		color: 'text.secondary',
	};

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
				due_date: dueDate || undefined,
				is_completed: type !== 'note' ? isCompleted : undefined,
				outcome: ['call', 'email', 'meeting'].includes(type) ? outcome : undefined,
				custom_fields: ['call', 'email', 'meeting'].includes(type) ? { direction } : undefined,
			})).unwrap();
			setSubject('');
			setDescription('');
			setDueDate(new Date().toISOString());
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

	const segmentedTypeSelectorSx = {
		p: 0.5,
		bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
		borderRadius: '12px',
		gap: 0.5,
		flexWrap: 'wrap' as const,
		'& .MuiToggleButtonGroup-grouped': {
			border: 'none !important',
			borderRadius: '9px !important',
			marginLeft: '0px !important',
			textTransform: 'none',
			px: 1.75,
			py: 0.75,
			fontWeight: 700,
			fontSize: '0.8rem',
			color: 'text.secondary',
			gap: 0.75,
			transition: 'all 0.2s ease',
			'&:hover': {
				bgcolor: alpha(theme.palette.text.primary, 0.05),
			},
		},
	};

	const renderStatusToggle = (mb?: number) => (
		<ToggleButtonGroup
			value={isCompleted}
			exclusive
			onChange={(_e, value) => {
				if (value !== null) setIsCompleted(value);
			}}
			size="small"
			sx={{
				mb,
				height: 36,
				bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
				p: 0.5,
				borderRadius: '10px',
				'& .MuiToggleButtonGroup-grouped': {
					border: 'none !important',
					borderRadius: '8px !important',
					textTransform: 'none',
					px: 2,
					fontWeight: 700,
					fontSize: '0.75rem',
					color: 'text.secondary',
					transition: 'all 0.2s ease',
					gap: 0.5,
					'&.Mui-selected': {
						backgroundColor: isCompleted 
							? (isDark ? alpha(theme.palette.success.main, 0.22) : theme.palette.success.main)
							: (isDark ? alpha(theme.palette.warning.main, 0.22) : theme.palette.warning.main),
						color: isCompleted
							? (isDark ? '#a5d6a7' : '#ffffff')
							: (isDark ? '#ffe082' : '#ffffff'),
						boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
					},
					'&:hover': {
						backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
					}
				}
			}}
		>
			<ToggleButton value={false}>
				<RadioButtonUnchecked sx={{ fontSize: 13 }} />
				Pending
			</ToggleButton>
			<ToggleButton value={true}>
				<CheckCircle sx={{ fontSize: 13 }} />
				Completed
			</ToggleButton>
		</ToggleButtonGroup>
	);

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
					{TYPE_OPTIONS.map((opt) => (
						<Tab key={opt.value} value={opt.value} icon={opt.icon} iconPosition="start" label={opt.label} />
					))}
				</Tabs>

				{(type === 'meeting' || type === 'call' || type === 'email') && (
					<Box sx={{ mb: 2 }}>
						<Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
							<Box sx={{ flexGrow: 1, minWidth: 160 }}>
								<Typography sx={labelCaptionSx}>{getDateLabel()}</Typography>
								<DateTimePicker
									label=""
									value={dueDate || null}
									onChange={setDueDate}
									size="small"
									fullWidth
									textFieldProps={{
										sx: {
											'& .MuiOutlinedInput-root': {
												borderRadius: '10px',
												bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff',
												height: 36,
												fontSize: '0.78rem',
												'& fieldset': {
													borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
												},
												'&:hover fieldset': {
													borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
												},
												'&.Mui-focused fieldset': {
													borderColor: 'primary.main',
													borderWidth: '1.5px',
												},
											}
										}
									}}
								/>
							</Box>
							<Box sx={{ flexShrink: 0 }}>
								<Typography sx={labelCaptionSx}>Status</Typography>
								{renderStatusToggle()}
							</Box>
						</Stack>
					</Box>
				)}

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
						accentColor={TYPE_META.call.color}
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
						accentColor={TYPE_META.email.color}
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
						accentColor={TYPE_META.meeting.color}
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
						sx={GRADIENT_BUTTON_SX}
					>
						{submitting ? <CircularProgress size={18} color="inherit" /> : SAVE_LABEL[type]}
					</Button>
				</Stack>
			</Box>
		);
	}

	return (
		<Box sx={{
			p: 2.5,
			borderRadius: '16px',
			border: '1px solid',
			borderColor: 'divider',
			bgcolor: 'background.default',
			boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.04)',
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
				sx={segmentedTypeSelectorSx}
			>
				{TYPE_OPTIONS.map((opt) => (
					<ToggleButton
						key={opt.value}
						value={opt.value}
						sx={{
							'&.Mui-selected': {
								bgcolor: alpha(opt.color, isDark ? 0.18 : 0.1),
								color: opt.color,
								boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.06)',
								'&:hover': {
									bgcolor: alpha(opt.color, isDark ? 0.24 : 0.14),
								},
							},
						}}
					>
						{opt.icon}
						{opt.label}
					</ToggleButton>
				))}
			</ToggleButtonGroup>

			<Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 1.25, mb: 2 }}>
				{activeMeta.subtitle}
			</Typography>

			{type !== 'note' && (
				<Box sx={{ mb: 2.5 }}>
					<Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
						<Box sx={{ flexGrow: 1, minWidth: 200 }}>
							<Typography sx={labelCaptionSx}>{getDateLabel()}</Typography>
							<DateTimePicker
								label=""
								value={dueDate || null}
								onChange={setDueDate}
								size="small"
								fullWidth
								textFieldProps={{
									sx: {
										'& .MuiOutlinedInput-root': {
											borderRadius: '10px',
											bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff',
											height: 38,
											fontSize: '0.8rem',
											'& fieldset': {
												borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
											},
											'&:hover fieldset': {
												borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
											},
											'&.Mui-focused fieldset': {
												borderColor: 'primary.main',
												borderWidth: '1.5px',
											},
										}
									}
								}}
							/>
						</Box>
						<Box sx={{ flexShrink: 0 }}>
							<Typography sx={labelCaptionSx}>Status</Typography>
							{renderStatusToggle()}
						</Box>
					</Stack>
				</Box>
			)}

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
					accentColor={TYPE_META.call.color}
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
					accentColor={TYPE_META.email.color}
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
					accentColor={TYPE_META.meeting.color}
				/>
			)}
			<Stack
				direction="row"
				justifyContent="flex-end"
				sx={{ pt: 2, mt: 0.5, borderTop: '1px solid', borderColor: 'divider' }}
			>
				<Button
					variant="contained"
					size="small"
					disabled={isButtonDisabled || submitting}
					onClick={handleSubmit}
					sx={GRADIENT_BUTTON_SX}
				>
					{submitting ? <CircularProgress size={18} color="inherit" /> : SAVE_LABEL[type]}
				</Button>
			</Stack>
		</Box>
	);
};

export default NotesComposer;
