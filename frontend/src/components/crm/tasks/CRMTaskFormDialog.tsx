import React, { useState, useEffect } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	TextField,
	Typography,
	Stack,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Grid,
	Box,
	IconButton,
	Paper,
	Autocomplete,
	Divider
} from '@mui/material';
import {
	Close as CloseIcon,
	Info as InfoIcon,
	Link as LinkIcon
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { fetchUsers } from '../../../store/slices/userSlice';
import { fetchCompanies } from '../../../store/slices/companySlice';
import { fetchContacts } from '../../../store/slices/contactSlice';
import { fetchLeads } from '../../../store/slices/leadSlice';
import { fetchDeals } from '../../../store/slices/dealSlice';
import type { CRMTask, CRMTaskCreate, CRMTaskUpdate, CRMTaskType, CRMTaskPriority, CRMTaskStatus, CRMRelatedToType } from '../../../models/crmTask';
import type { Company } from '../../../models/company';
import type { Contact } from '../../../models/contact';
import type { Lead } from '../../../models/lead';
import type { Deal } from '../../../models/deal';

interface CRMTaskFormDialogProps {
	open: boolean;
	onClose: () => void;
	onSubmit: (data: CRMTaskCreate | CRMTaskUpdate) => void;
	task?: CRMTask | null;
	initialData?: Partial<CRMTaskCreate>;
	loading?: boolean;
}

const TASK_TYPES: { value: CRMTaskType; label: string }[] = [
	{ value: 'call', label: 'Call' },
	{ value: 'email', label: 'Email' },
	{ value: 'meeting', label: 'Meeting' },
	{ value: 'follow_up', label: 'Follow Up' },
	{ value: 'demo', label: 'Demo' },
	{ value: 'proposal', label: 'Proposal' },
	{ value: 'other', label: 'Other' }
];

const TASK_PRIORITIES: { value: CRMTaskPriority; label: string }[] = [
	{ value: 'low', label: 'Low' },
	{ value: 'medium', label: 'Medium' },
	{ value: 'high', label: 'High' },
	{ value: 'urgent', label: 'Urgent' }
];

const TASK_STATUSES: { value: CRMTaskStatus; label: string }[] = [
	{ value: 'pending', label: 'Pending' },
	{ value: 'in_progress', label: 'In Progress' },
	{ value: 'completed', label: 'Completed' },
	{ value: 'cancelled', label: 'Cancelled' }
];

const RELATED_TO_TYPES: { value: CRMRelatedToType; label: string }[] = [
	{ value: 'lead', label: 'Lead' },
	{ value: 'deal', label: 'Deal' },
	{ value: 'company', label: 'Company' },
	{ value: 'contact', label: 'Contact' }
];

const CRMTaskFormDialog: React.FC<CRMTaskFormDialogProps> = ({
	open,
	onClose,
	onSubmit,
	task,
	initialData,
	loading = false
}) => {
	const dispatch = useAppDispatch();
	const { users } = useAppSelector(state => state.users);
	const { list: companies } = useAppSelector(state => state.companies);
	const { list: contacts } = useAppSelector(state => state.contacts);
	const { list: leads } = useAppSelector(state => state.leads);
	const { list: deals } = useAppSelector(state => state.deals);

	const [formData, setFormData] = useState<Partial<CRMTask>>({
		title: '',
		description: '',
		task_type: 'follow_up',
		priority: 'medium',
		status: 'pending',
		assigned_to: 0,
		due_date: '',
		related_to_type: undefined,
		related_to_id: undefined,
		reminder_before_minutes: 30
	});

	useEffect(() => {
		if (open) {
			dispatch(fetchUsers());
			dispatch(fetchCompanies());
			dispatch(fetchContacts());
			dispatch(fetchLeads({ skip: 0, limit: 100 }));
			dispatch(fetchDeals({ skip: 0, limit: 100 }));
		}
	}, [dispatch, open]);

	useEffect(() => {
		const timer = setTimeout(() => {
			if (task) {
				setFormData({
					...task,
					due_date: task.due_date ? task.due_date.replace('Z', '').replace(' ', 'T').slice(0, 16) : ''
				});
			} else if (initialData) {
				setFormData({
					title: '',
					description: '',
					task_type: 'follow_up',
					priority: 'medium',
					status: 'pending',
					assigned_to: 0,
					due_date: '',
					reminder_before_minutes: 30,
					...initialData
				});
			} else {
				setFormData({
					title: '',
					description: '',
					task_type: 'follow_up',
					priority: 'medium',
					status: 'pending',
					assigned_to: 0,
					due_date: '',
					related_to_type: undefined,
					related_to_id: undefined,
					reminder_before_minutes: 30
				});
			}
		}, 0);
		return () => clearTimeout(timer);
	}, [task, initialData, open]);

	const handleChange = (field: string, value: unknown) => {
		setFormData(prev => ({ ...prev, [field]: value }));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.title || !formData.assigned_to || !formData.due_date || !formData.task_type) return;

		const data = {
			...formData,
			due_date: new Date(formData.due_date!).toISOString()
		} as CRMTaskCreate;
		onSubmit(data);
	};

	const getRelatedOptions = () => {
		switch (formData.related_to_type) {
			case 'lead': return leads;
			case 'deal': return deals;
			case 'company': return companies;
			case 'contact': return contacts;
			default: return [];
		}
	};

	const getRelatedLabel = (option: Company | Contact | Lead | Deal) => {
		if (!option) return '';
		const opt = option as { first_name?: string; last_name?: string; title?: string; name?: string };
		if (formData.related_to_type === 'contact') return `${opt.first_name || ''} ${opt.last_name || ''}`.trim();
		return opt.title || opt.name || '';
	};

	const sectionTitleStyle = {
		fontWeight: 700,
		fontSize: '0.875rem',
		color: '#545b64',
		mb: 2,
		textTransform: 'uppercase' as const,
		letterSpacing: '0.025em'
	};

	const awsPanelStyle = {
		border: '1px solid #d5dbdb',
		borderRadius: '2px',
		p: 3,
		bgcolor: '#ffffff'
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="md"
			fullWidth
			PaperProps={{
				sx: { borderRadius: 0, boxShadow: 'none', border: '1px solid #d5dbdb' }
			}}
		>
			<DialogTitle sx={{ bgcolor: '#232f3e', color: '#ffffff', py: 2 }}>
				<Stack direction="row" justifyContent="space-between" alignItems="center">
					<Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 700 }}>
						{task ? 'Edit Task' : 'New Task'}
					</Typography>
					<IconButton onClick={onClose} sx={{ color: '#ffffff' }}>
						<CloseIcon />
					</IconButton>
				</Stack>
			</DialogTitle>

			<Box component="form" onSubmit={handleSubmit}>
				<DialogContent sx={{ p: 0, bgcolor: '#f2f3f3' }}>
					<Box sx={{ px: 4, py: 4 }}>
						<Stack spacing={3}>
							<Paper elevation={0} sx={awsPanelStyle}>
								<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
									<InfoIcon sx={{ color: '#545b64', fontSize: 20 }} />
									<Typography sx={sectionTitleStyle}>Task Details</Typography>
								</Stack>
								<Grid container spacing={3}>
									<Grid size={{ xs: 12 }}>
										<TextField
											required
											fullWidth
											label="Task Title"
											value={formData.title}
											onChange={(e) => handleChange('title', e.target.value)}
											size="small"
											sx={{ '& .MuiOutlinedInput-root': { borderRadius: '2px' } }}
										/>
									</Grid>
									<Grid size={{ xs: 12 }}>
										<TextField
											fullWidth
											multiline
											rows={2}
											label="Description"
											value={formData.description}
											onChange={(e) => handleChange('description', e.target.value)}
											size="small"
											sx={{ '& .MuiOutlinedInput-root': { borderRadius: '2px' } }}
										/>
									</Grid>
									<Grid size={{ xs: 12, md: 4 }}>
										<FormControl fullWidth size="small">
											<InputLabel>Task Type</InputLabel>
											<Select
												value={formData.task_type}
												label="Task Type"
												onChange={(e) => handleChange('task_type', e.target.value)}
												sx={{ borderRadius: '2px' }}
											>
												{TASK_TYPES.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
											</Select>
										</FormControl>
									</Grid>
									<Grid size={{ xs: 12, md: 4 }}>
										<FormControl fullWidth size="small">
											<InputLabel>Priority</InputLabel>
											<Select
												value={formData.priority}
												label="Priority"
												onChange={(e) => handleChange('priority', e.target.value)}
												sx={{ borderRadius: '2px' }}
											>
												{TASK_PRIORITIES.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
											</Select>
										</FormControl>
									</Grid>
									<Grid size={{ xs: 12, md: 4 }}>
										<FormControl fullWidth size="small">
											<InputLabel>Status</InputLabel>
											<Select
												value={formData.status}
												label="Status"
												onChange={(e) => handleChange('status', e.target.value)}
												sx={{ borderRadius: '2px' }}
											>
												{TASK_STATUSES.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
											</Select>
										</FormControl>
									</Grid>
									<Grid size={{ xs: 12, md: 6 }}>
										<TextField
											required
											fullWidth
											type="datetime-local"
											label="Due Date"
											value={formData.due_date}
											onChange={(e) => handleChange('due_date', e.target.value)}
											size="small"
											InputLabelProps={{ shrink: true }}
											sx={{ '& .MuiOutlinedInput-root': { borderRadius: '2px' } }}
										/>
									</Grid>
								</Grid>
							</Paper>

							<Paper elevation={0} sx={awsPanelStyle}>
								<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
									<LinkIcon sx={{ color: '#545b64', fontSize: 20 }} />
									<Typography sx={sectionTitleStyle}>Associations & Ownership</Typography>
								</Stack>
								<Grid container spacing={3}>
									<Grid size={{ xs: 12, md: 4 }}>
										<FormControl fullWidth size="small">
											<InputLabel>Related To Type</InputLabel>
											<Select
												value={formData.related_to_type || ''}
												label="Related To Type"
												onChange={(e) => {
													handleChange('related_to_type', e.target.value);
													handleChange('related_to_id', undefined);
												}}
												sx={{ borderRadius: '2px' }}
											>
												<MenuItem value="">None</MenuItem>
												{RELATED_TO_TYPES.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
											</Select>
										</FormControl>
									</Grid>
									<Grid size={{ xs: 12, md: 8 }}>
										<Autocomplete
											disabled={!formData.related_to_type}
											options={getRelatedOptions()}
											getOptionLabel={getRelatedLabel}
											value={getRelatedOptions().find(o => o.id === formData.related_to_id) || null}
											onChange={(_, value) => handleChange('related_to_id', value?.id)}
											renderInput={(params) => (
												<TextField {...params} label={`Related ${formData.related_to_type || 'Entity'}`} size="small" />
											)}
											sx={{ '& .MuiOutlinedInput-root': { borderRadius: '2px' } }}
										/>
									</Grid>
									<Grid size={{ xs: 12 }}>
										<Autocomplete
											options={users}
											getOptionLabel={(option) => option.full_name || option.username}
											value={users.find(u => u.id === formData.assigned_to) || null}
											onChange={(_, value) => handleChange('assigned_to', value?.id)}
											renderInput={(params) => (
												<TextField {...params} required label="Assigned To" size="small" />
											)}
											sx={{ '& .MuiOutlinedInput-root': { borderRadius: '2px' } }}
										/>
									</Grid>
								</Grid>
							</Paper>
						</Stack>
					</Box>
				</DialogContent>

				<Divider sx={{ borderColor: '#d5dbdb' }} />
				<DialogActions sx={{ p: 3, bgcolor: '#ffffff' }}>
					<Button
						onClick={onClose}
						variant="text"
						sx={{ color: '#545b64', fontWeight: 700, px: 3, textTransform: 'none' }}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						variant="contained"
						disabled={loading || !formData.title || !formData.assigned_to || !formData.due_date || !formData.task_type}
						sx={{
							bgcolor: '#ec7211',
							color: '#ffffff',
							px: 4,
							py: 1,
							fontWeight: 700,
							borderRadius: '2px',
							textTransform: 'none',
							border: '1px solid #ec7211',
							'&:hover': { bgcolor: '#eb5f07', borderColor: '#eb5f07' },
							boxShadow: 'none'
						}}
					>
						{loading ? 'Saving...' : (task ? 'Update Task' : 'Save Task')}
					</Button>
				</DialogActions>
			</Box>
		</Dialog>
	);
};

export default CRMTaskFormDialog;
