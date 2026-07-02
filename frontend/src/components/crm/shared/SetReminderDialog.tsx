import React, { useEffect, useState } from 'react';
import {
	Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Stack, Typography,
	ToggleButtonGroup, ToggleButton, TextField, useTheme, Chip, CircularProgress, Tooltip,
} from '@mui/material';
import { Close, DeleteOutline, NotificationsActiveOutlined } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchReminders, createReminder, cancelReminder, clearReminders } from '../../../store/slices/crmSlice';
import useToast from '../../../hooks/useToast';
import { DateTimePicker } from '../../common/form';
import {
	REMINDER_PRESET_OPTIONS, computeRemindAt, formatReminderTime, isReminderOverdue,
	type ReminderPreset,
} from '../../../utils/reminders';
import type { ReminderEntityType } from '../../../models/crm/reminder';

interface SetReminderDialogProps {
	open: boolean;
	onClose: () => void;
	entityType: ReminderEntityType;
	entityId: number;
	entityLabel: string;
	defaultDueDate?: string | null;
}

export const SetReminderDialog: React.FC<SetReminderDialogProps> = ({
	open, onClose, entityType, entityId, entityLabel, defaultDueDate,
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const toast = useToast();
	const dispatch = useAppDispatch();
	const { reminders, remindersLoading, reminderMutating } = useAppSelector((state) => state.crm);

	const [preset, setPreset] = useState<ReminderPreset>(defaultDueDate ? '1_day' : 'custom');
	const [customDateTime, setCustomDateTime] = useState<string>('');
	const [message, setMessage] = useState('');

	// Reset the form whenever the dialog transitions from closed to open,
	// following the same "track previous value, adjust during render" idiom
	// used by the detail drawers (e.g. CompanyDetailDrawer's prevCompanyId)
	// instead of setting state inside an effect.
	const [prevOpen, setPrevOpen] = useState(open);
	if (open !== prevOpen) {
		setPrevOpen(open);
		if (open) {
			setPreset(defaultDueDate ? '1_day' : 'custom');
			setCustomDateTime('');
			setMessage('');
		}
	}

	useEffect(() => {
		if (open) {
			dispatch(fetchReminders({ entityType, entityId }));
		} else {
			dispatch(clearReminders());
		}
	}, [open, entityType, entityId, dispatch]);

	const computedRemindAt = defaultDueDate ? computeRemindAt(preset, defaultDueDate) : null;
	const remindAt = preset === 'custom' ? customDateTime : computedRemindAt;
	const canSubmit = !!remindAt && !reminderMutating;

	const handleSubmit = async () => {
		if (!remindAt) return;
		try {
			await dispatch(createReminder({
				entity_type: entityType,
				entity_id: entityId,
				remind_at: remindAt,
				message: message.trim() || undefined,
			})).unwrap();
			toast.success('Reminder set');
			setMessage('');
			setCustomDateTime('');
			setPreset(defaultDueDate ? '1_day' : 'custom');
		} catch (err: any) {
			toast.error(err || 'Failed to set reminder');
		}
	};

	const handleCancelReminder = async (publicId: string) => {
		try {
			await dispatch(cancelReminder(publicId)).unwrap();
			toast.success('Reminder cancelled');
		} catch (err: any) {
			toast.error(err || 'Failed to cancel reminder');
		}
	};

	const fieldCardSx = {
		borderRadius: '12px',
		border: '1px solid',
		borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
		bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
		p: 1.75,
		borderLeft: '4px solid',
		borderLeftColor: 'warning.main',
	};

	const labelSx = {
		fontWeight: 700,
		color: 'text.secondary',
		textTransform: 'uppercase' as const,
		fontSize: '0.65rem',
		letterSpacing: '0.07em',
		display: 'block' as const,
		mb: 0.75,
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
			<DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
				<Stack direction="row" spacing={1} alignItems="center">
					<NotificationsActiveOutlined sx={{ fontSize: 20, color: 'warning.main' }} />
					<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Set Reminder</Typography>
				</Stack>
				<IconButton size="small" onClick={onClose}><Close fontSize="small" /></IconButton>
			</DialogTitle>
			<DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
				<Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
					{entityLabel}
				</Typography>

				<Stack sx={fieldCardSx} spacing={1.5}>
					<Typography variant="caption" sx={labelSx}>When</Typography>
					<ToggleButtonGroup
						value={preset}
						exclusive
						onChange={(_e, value) => { if (value) setPreset(value); }}
						size="small"
						sx={{ flexWrap: 'wrap', gap: 0.5, '& .MuiToggleButtonGroup-grouped': { border: '1px solid', borderColor: 'divider', borderRadius: '8px !important' } }}
					>
						{REMINDER_PRESET_OPTIONS.filter((opt) => defaultDueDate || opt.value === 'custom').map((opt) => (
							<ToggleButton key={opt.value} value={opt.value} sx={{ textTransform: 'none', px: 1.25, fontSize: '0.78rem' }}>
								{opt.label}
							</ToggleButton>
						))}
					</ToggleButtonGroup>

					{preset === 'custom' ? (
						<DateTimePicker
							label="Reminder date & time"
							value={customDateTime || null}
							onChange={setCustomDateTime}
						/>
					) : computedRemindAt ? (
						<Typography variant="body2" sx={{ fontWeight: 600 }}>
							Reminds you {formatReminderTime(computedRemindAt)}
						</Typography>
					) : null}

					<TextField
						label="Note (optional)"
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						size="small"
						fullWidth
						multiline
						rows={2}
						placeholder="What should this reminder be about?"
					/>
				</Stack>

				{remindersLoading ? (
					<Stack alignItems="center" sx={{ py: 2 }}><CircularProgress size={20} /></Stack>
				) : reminders.length > 0 ? (
					<Stack spacing={1}>
						<Typography variant="caption" sx={labelSx}>Existing Reminders</Typography>
						{reminders.map((r) => {
							const overdue = isReminderOverdue(r.remind_at, r.status);
							return (
								<Stack
									key={r.public_id}
									direction="row"
									alignItems="center"
									justifyContent="space-between"
									sx={{
										p: 1,
										borderRadius: '8px',
										border: '1px solid',
										borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
									}}
								>
									<Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
										<Typography variant="caption" sx={{ fontWeight: 600 }} noWrap>
											{formatReminderTime(r.remind_at)}
										</Typography>
										{r.status !== 'pending' && (
											<Chip
												size="small"
												label={r.status}
												color={r.status === 'sent' ? 'success' : 'default'}
												sx={{ height: 18, fontSize: '0.62rem', textTransform: 'capitalize' }}
											/>
										)}
										{overdue && (
											<Chip size="small" label="Overdue" color="error" sx={{ height: 18, fontSize: '0.62rem' }} />
										)}
									</Stack>
									{r.status === 'pending' && (
										<Tooltip title="Cancel reminder">
											<IconButton size="small" onClick={() => handleCancelReminder(r.public_id)} sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
												<DeleteOutline sx={{ fontSize: 16 }} />
											</IconButton>
										</Tooltip>
									)}
								</Stack>
							);
						})}
					</Stack>
				) : (
					<Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
						No reminders set yet.
					</Typography>
				)}
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2.5 }}>
				<Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 600 }}>Close</Button>
				<Button
					variant="contained"
					disabled={!canSubmit}
					onClick={handleSubmit}
					sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', minWidth: 100 }}
				>
					{reminderMutating ? <CircularProgress size={16} color="inherit" /> : 'Set Reminder'}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default SetReminderDialog;
