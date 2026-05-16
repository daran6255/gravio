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
	Slider,
	Divider
} from '@mui/material';
import {
	Close as CloseIcon,
	Info as InfoIcon,
	Business as BusinessIcon,
	TrendingUp as ProbabilityIcon
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { fetchUsers } from '../../../store/slices/userSlice';
import { fetchCompanies } from '../../../store/slices/companySlice';
import { fetchContacts } from '../../../store/slices/contactSlice';
import { fetchLeads } from '../../../store/slices/leadSlice';
import type { Deal, DealCreate, DealUpdate, DealStage, DealType } from '../../../models/deal';

interface DealFormDialogProps {
	open: boolean;
	onClose: () => void;
	onSubmit: (data: DealCreate | DealUpdate) => void;
	deal?: Deal | null;
	loading?: boolean;
}

const DEAL_STAGES: { value: DealStage; label: string }[] = [
	{ value: 'discovery', label: 'Discovery' },
	{ value: 'qualification', label: 'Qualification' },
	{ value: 'proposal', label: 'Proposal' },
	{ value: 'negotiation', label: 'Negotiation' },
	{ value: 'closed_won', label: 'Closed Won' },
	{ value: 'closed_lost', label: 'Closed Lost' }
];

const DEAL_TYPES: { value: DealType; label: string }[] = [
	{ value: 'new_business', label: 'New Business' },
	{ value: 'upsell', label: 'Upsell' },
	{ value: 'renewal', label: 'Renewal' },
	{ value: 'cross_sell', label: 'Cross Sell' }
];

const DealFormDialog: React.FC<DealFormDialogProps> = ({
	open,
	onClose,
	onSubmit,
	deal,
	loading = false
}) => {
	const dispatch = useAppDispatch();
	const { users } = useAppSelector(state => state.users);
	const { list: companies } = useAppSelector(state => state.companies);
	const { list: contacts } = useAppSelector(state => state.contacts);
	const { list: leads } = useAppSelector(state => state.leads);

	const [formData, setFormData] = useState<Partial<Deal>>({
		title: '',
		description: '',
		deal_stage: 'discovery',
		deal_type: 'new_business',
		win_probability: 20,
		deal_value: 0,
		currency: 'INR',
		expected_close_date: '',
		assigned_to: 0,
		company_id: undefined,
		contact_id: undefined,
		original_lead_id: undefined
	});

	useEffect(() => {
		if (open) {
			dispatch(fetchUsers());
			dispatch(fetchCompanies());
			dispatch(fetchContacts());
			dispatch(fetchLeads());
		}
	}, [dispatch, open]);

	useEffect(() => {
		const timer = setTimeout(() => {
			if (deal) {
				setFormData({
					...deal,
					expected_close_date: deal.expected_close_date ? deal.expected_close_date.split('T')[0] : ''
				});
			} else {
				setFormData({
					title: '',
					description: '',
					deal_stage: 'discovery',
					deal_type: 'new_business',
					win_probability: 20,
					deal_value: 0,
					currency: 'INR',
					expected_close_date: '',
					assigned_to: 0,
					company_id: undefined,
					contact_id: undefined,
					original_lead_id: undefined
				});
			}
		}, 0);
		return () => clearTimeout(timer);
	}, [deal, open]);

	const handleChange = (field: string, value: unknown) => {
		setFormData(prev => ({ ...prev, [field]: value }));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.title || !formData.assigned_to || !formData.deal_value || !formData.expected_close_date) return;

		const data = { ...formData } as DealCreate;
		onSubmit(data);
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
						{deal ? 'Edit Deal' : 'New Deal'}
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
									<Typography sx={sectionTitleStyle}>General Information</Typography>
								</Stack>
								<Grid container spacing={3}>
									<Grid size={{ xs: 12 }}>
										<TextField
											required
											fullWidth
											label="Deal Title"
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
									<Grid size={{ xs: 12, md: 6 }}>
										<FormControl fullWidth size="small">
											<InputLabel>Deal Stage</InputLabel>
											<Select
												value={formData.deal_stage}
												label="Deal Stage"
												onChange={(e) => handleChange('deal_stage', e.target.value)}
												sx={{ borderRadius: '2px' }}
											>
												{DEAL_STAGES.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
											</Select>
										</FormControl>
									</Grid>
									<Grid size={{ xs: 12, md: 6 }}>
										<FormControl fullWidth size="small">
											<InputLabel>Deal Type</InputLabel>
											<Select
												value={formData.deal_type}
												label="Deal Type"
												onChange={(e) => handleChange('deal_type', e.target.value)}
												sx={{ borderRadius: '2px' }}
											>
												{DEAL_TYPES.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
											</Select>
										</FormControl>
									</Grid>
								</Grid>
							</Paper>

							<Paper elevation={0} sx={awsPanelStyle}>
								<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
									<ProbabilityIcon sx={{ color: '#545b64', fontSize: 20 }} />
									<Typography sx={sectionTitleStyle}>Value & Probability</Typography>
								</Stack>
								<Grid container spacing={3}>
									<Grid size={{ xs: 12, md: 6 }}>
										<TextField
											required
											fullWidth
											type="number"
											label="Deal Value"
											value={formData.deal_value}
											onChange={(e) => handleChange('deal_value', parseFloat(e.target.value))}
											size="small"
											sx={{ '& .MuiOutlinedInput-root': { borderRadius: '2px' } }}
										/>
									</Grid>
									<Grid size={{ xs: 12, md: 6 }}>
										<TextField
											fullWidth
											label="Currency"
											value={formData.currency}
											onChange={(e) => handleChange('currency', e.target.value)}
											size="small"
											sx={{ '& .MuiOutlinedInput-root': { borderRadius: '2px' } }}
										/>
									</Grid>
									<Grid size={{ xs: 12 }}>
										<Typography variant="caption" sx={{ color: '#545b64', fontWeight: 600, display: 'block', mb: 1 }}>
											WIN PROBABILITY ({formData.win_probability}%)
										</Typography>
										<Slider
											value={formData.win_probability}
											onChange={(_, v) => handleChange('win_probability', v)}
											valueLabelDisplay="auto"
											marks={[
												{ value: 0, label: '0%' },
												{ value: 50, label: '50%' },
												{ value: 100, label: '100%' },
											]}
											sx={{ color: '#ec7211' }}
										/>
									</Grid>
									<Grid size={{ xs: 12, md: 6 }}>
										<TextField
											required
											fullWidth
											type="date"
											label="Expected Close Date"
											value={formData.expected_close_date}
											onChange={(e) => handleChange('expected_close_date', e.target.value)}
											size="small"
											InputLabelProps={{ shrink: true }}
											sx={{ '& .MuiOutlinedInput-root': { borderRadius: '2px' } }}
										/>
									</Grid>
								</Grid>
							</Paper>

							<Paper elevation={0} sx={awsPanelStyle}>
								<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
									<BusinessIcon sx={{ color: '#545b64', fontSize: 20 }} />
									<Typography sx={sectionTitleStyle}>Associations & Ownership</Typography>
								</Stack>
								<Grid container spacing={3}>
									<Grid size={{ xs: 12, md: 6 }}>
										<Autocomplete
											options={companies}
											getOptionLabel={(option) => option.name}
											value={companies.find(c => c.id === formData.company_id) || null}
											onChange={(_, value) => handleChange('company_id', value?.id)}
											renderInput={(params) => (
												<TextField {...params} label="Company" size="small" />
											)}
											sx={{ '& .MuiOutlinedInput-root': { borderRadius: '2px' } }}
										/>
									</Grid>
									<Grid size={{ xs: 12, md: 6 }}>
										<Autocomplete
											options={contacts}
											getOptionLabel={(option) => `${option.first_name} ${option.last_name}`}
											value={contacts.find(c => c.id === formData.contact_id) || null}
											onChange={(_, value) => handleChange('contact_id', value?.id)}
											renderInput={(params) => (
												<TextField {...params} label="Primary Contact" size="small" />
											)}
											sx={{ '& .MuiOutlinedInput-root': { borderRadius: '2px' } }}
										/>
									</Grid>
									<Grid size={{ xs: 12, md: 6 }}>
										<Autocomplete
											options={leads}
											getOptionLabel={(option) => option.title}
											value={leads.find(l => l.id === formData.original_lead_id) || null}
											onChange={(_, value) => handleChange('original_lead_id', value?.id)}
											renderInput={(params) => (
												<TextField {...params} label="Related Lead" size="small" />
											)}
											sx={{ '& .MuiOutlinedInput-root': { borderRadius: '2px' } }}
										/>
									</Grid>
									<Grid size={{ xs: 12, md: 6 }}>
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
						disabled={loading || !formData.title || !formData.assigned_to || !formData.deal_value || !formData.expected_close_date}
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
						{loading ? 'Saving...' : (deal ? 'Update Deal' : 'Save Deal')}
					</Button>
				</DialogActions>
			</Box>
		</Dialog>
	);
};

export default DealFormDialog;
