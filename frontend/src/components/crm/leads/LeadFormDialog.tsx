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
	AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { fetchUsers } from '../../../store/slices/userSlice';
import { fetchCompanies } from '../../../store/slices/companySlice';
import { fetchContacts } from '../../../store/slices/contactSlice';
import type { Lead, LeadCreate, LeadUpdate, LeadStatus, LeadSource } from '../../../models/lead';

interface LeadFormDialogProps {
	open: boolean;
	onClose: () => void;
	onSubmit: (data: LeadCreate | LeadUpdate) => void;
	lead?: Lead | null;
	loading?: boolean;
}

const LEAD_SOURCES: { value: LeadSource; label: string }[] = [
	{ value: 'website', label: 'Website' },
	{ value: 'referral', label: 'Referral' },
	{ value: 'campaign', label: 'Campaign' },
	{ value: 'event', label: 'Event' },
	{ value: 'cold_call', label: 'Cold Call' },
	{ value: 'social_media', label: 'Social Media' },
	{ value: 'partner', label: 'Partner' }
];

const LEAD_STATUSES: { value: LeadStatus; label: string }[] = [
	{ value: 'new', label: 'New' },
	{ value: 'contacted', label: 'Contacted' },
	{ value: 'qualified', label: 'Qualified' },
	{ value: 'unqualified', label: 'Unqualified' },
	{ value: 'lost', label: 'Lost' }
];

const LeadFormDialog: React.FC<LeadFormDialogProps> = ({
	open,
	onClose,
	onSubmit,
	lead,
	loading = false
}) => {
	const dispatch = useAppDispatch();
	const { users } = useAppSelector(state => state.users);
	const { list: companies } = useAppSelector(state => state.companies);
	const { list: contacts } = useAppSelector(state => state.contacts);

	const [formData, setFormData] = useState<Partial<Lead>>({
		title: '',
		description: '',
		lead_source: 'website',
		lead_status: 'new',
		lead_score: 50,
		estimated_value: undefined,
		currency: 'INR',
		expected_close_date: '',
		assigned_to: undefined,
		company_id: undefined,
		contact_id: undefined
	});

	useEffect(() => {
		if (open) {
			dispatch(fetchUsers());
			dispatch(fetchCompanies());
			dispatch(fetchContacts());
		}
	}, [dispatch, open]);

	useEffect(() => {
		const timer = setTimeout(() => {
			if (lead) {
				setFormData({
					...lead,
					expected_close_date: lead.expected_close_date ? lead.expected_close_date.split('T')[0] : ''
				});
			} else {
				setFormData({
					title: '',
					description: '',
					lead_source: 'website',
					lead_status: 'new',
					lead_score: 50,
					estimated_value: undefined,
					currency: 'INR',
					expected_close_date: '',
					assigned_to: undefined,
					company_id: undefined,
					contact_id: undefined
				});
			}
		}, 0);
		return () => clearTimeout(timer);
	}, [lead, open]);

	const handleChange = (field: string, value: unknown) => {
		setFormData(prev => ({ ...prev, [field]: value }));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.title || !formData.assigned_to || !formData.lead_source) return;

		// If creating, ensure we have all required fields for LeadCreate
		const data = { ...formData } as LeadCreate;
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
						{lead ? 'Edit Lead' : 'New Lead'}
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
									<Typography sx={sectionTitleStyle}>Basic Information</Typography>
								</Stack>
								<Grid container spacing={3}>
									<Grid size={{ xs: 12 }}>
										<TextField
											required
											fullWidth
											label="Lead Title"
											placeholder="e.g. Enterprise Software License for ABC Corp"
											value={formData.title}
											onChange={(e) => handleChange('title', e.target.value)}
											variant="outlined"
											size="small"
											sx={{ '& .MuiOutlinedInput-root': { borderRadius: '2px' } }}
										/>
									</Grid>
									<Grid size={{ xs: 12 }}>
										<TextField
											fullWidth
											multiline
											rows={3}
											label="Description"
											value={formData.description}
											onChange={(e) => handleChange('description', e.target.value)}
											variant="outlined"
											size="small"
											sx={{ '& .MuiOutlinedInput-root': { borderRadius: '2px' } }}
										/>
									</Grid>
									<Grid size={{ xs: 12, md: 6 }}>
										<FormControl fullWidth size="small">
											<InputLabel>Lead Source</InputLabel>
											<Select
												value={formData.lead_source}
												label="Lead Source"
												onChange={(e) => handleChange('lead_source', e.target.value)}
												sx={{ borderRadius: '2px' }}
											>
												{LEAD_SOURCES.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
											</Select>
										</FormControl>
									</Grid>
									<Grid size={{ xs: 12, md: 6 }}>
										<FormControl fullWidth size="small">
											<InputLabel>Lead Status</InputLabel>
											<Select
												value={formData.lead_status}
												label="Lead Status"
												onChange={(e) => handleChange('lead_status', e.target.value)}
												sx={{ borderRadius: '2px' }}
											>
												{LEAD_STATUSES.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
											</Select>
										</FormControl>
									</Grid>
									<Grid size={{ xs: 12 }}>
										<Typography variant="caption" sx={{ color: '#545b64', fontWeight: 600, display: 'block', mb: 1 }}>
											LEAD SCORE ({formData.lead_score}%)
										</Typography>
										<Slider
											value={formData.lead_score}
											onChange={(_, v) => handleChange('lead_score', v)}
											valueLabelDisplay="auto"
											marks={[
												{ value: 0, label: '0%' },
												{ value: 50, label: '50%' },
												{ value: 100, label: '100%' },
											]}
											sx={{ color: '#ec7211' }}
										/>
									</Grid>
								</Grid>
							</Paper>

							<Paper elevation={0} sx={awsPanelStyle}>
								<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
									<MoneyIcon sx={{ color: '#545b64', fontSize: 20 }} />
									<Typography sx={sectionTitleStyle}>Value & Timeline</Typography>
								</Stack>
								<Grid container spacing={3}>
									<Grid size={{ xs: 12, md: 6 }}>
										<TextField
											fullWidth
											label="Estimated Value"
											type="number"
											value={formData.estimated_value}
											onChange={(e) => handleChange('estimated_value', e.target.value === '' ? undefined : parseFloat(e.target.value))}
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
									<Grid size={{ xs: 12, md: 6 }}>
										<TextField
											fullWidth
											label="Expected Close Date"
											type="date"
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
												<TextField {...params} label="Account / Company" size="small" />
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
									<Grid size={{ xs: 12 }}>
										<Autocomplete
											options={users}
											getOptionLabel={(option) => option.full_name || option.username}
											value={users.find(u => u.id === formData.assigned_to) || null}
											onChange={(_, value) => handleChange('assigned_to', value?.id)}
											renderInput={(params) => (
												<TextField {...params} required label="Lead Owner / Assigned To" size="small" />
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
						disabled={loading || !formData.title || !formData.assigned_to}
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
						{loading ? 'Saving...' : (lead ? 'Update Lead' : 'Save Lead')}
					</Button>
				</DialogActions>
			</Box>
		</Dialog>
	);
};

export default LeadFormDialog;
