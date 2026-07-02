import React, { useEffect, useState } from 'react';
import {
	Box, Stack, Typography, IconButton, Button, ToggleButtonGroup, ToggleButton,
	TextField, useTheme, alpha, Chip, CircularProgress, Tooltip,
} from '@mui/material';
import { DeleteOutline, NotificationsActiveOutlined } from '@mui/icons-material';
import { BaseDialog } from '../../common/dialogbox';
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
			onClose();
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

	const labelSx = {
		fontWeight: 700,
		color: 'text.secondary',
		textTransform: 'uppercase' as const,
		fontSize: '0.65rem',
		letterSpacing: '0.07em',
		display: 'block' as const,
		mb: 0.75,
	};

	const actions = (
		<>
			<Button
				onClick={onClose}
				disabled={reminderMutating}
				sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 600, borderRadius: '10px' }}
			>
				Close
			</Button>
			<Button
				variant="contained"
				disabled={!canSubmit}
				onClick={handleSubmit}
				sx={{
					color: 'white',
					textTransform: 'none',
					fontWeight: 700,
					px: 4,
					minWidth: 140,
					borderRadius: '10px',
					boxShadow: 'none',
					background: 'linear-gradient(90deg, #8B7CF6 0%, #4EA8FF 100%)',
					'&:hover': { boxShadow: '0 4px 12px rgba(139,124,246,0.3)' },
					'&.Mui-disabled': { background: theme.palette.action.disabledBackground },
				}}
			>
				{reminderMutating ? <CircularProgress size={18} color="inherit" /> : 'Set Reminder'}
			</Button>
		</>
	);

	return (
		<BaseDialog
			open={open}
			onClose={onClose}
			title="Set Reminder"
			subtitle={entityLabel}
			maxWidth="xs"
			loading={reminderMutating}
			actions={actions}
		>
			<Stack spacing={2.5}>
				<Box
					sx={{
						borderRadius: '16px',
						bgcolor: alpha(theme.palette.warning.main, isDark ? 0.08 : 0.06),
						border: '1px solid',
						borderColor: alpha(theme.palette.warning.main, 0.25),
						p: 2,
					}}
				>
					<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
						<NotificationsActiveOutlined sx={{ fontSize: 16, color: 'warning.main' }} />
						<Typography variant="caption" sx={labelSx}>When</Typography>
					</Stack>
					<ToggleButtonGroup
						value={preset}
						exclusive
						onChange={(_e, value) => { if (value) setPreset(value); }}
						size="small"
						sx={{ flexWrap: 'wrap', gap: 0.5, mb: 1.5, '& .MuiToggleButtonGroup-grouped': { border: '1px solid', borderColor: 'divider', borderRadius: '10px !important' } }}
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
				</Box>

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

				<Box>
					<Typography variant="caption" sx={labelSx}>Existing Reminders</Typography>
					{remindersLoading ? (
						<Stack alignItems="center" sx={{ py: 2 }}><CircularProgress size={20} /></Stack>
					) : reminders.length > 0 ? (
						<Stack spacing={1} sx={{ mt: 0.5 }}>
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
											borderRadius: '10px',
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
						<Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', mt: 0.5 }}>
							No reminders set yet.
						</Typography>
					)}
				</Box>
			</Stack>
		</BaseDialog>
	);
};

export default SetReminderDialog;
