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
	FormControlLabel,
	Switch,
	Divider
} from '@mui/material';
import { Close as CloseIcon, Person as PersonIcon, Work as WorkIcon, Phone as PhoneIcon } from '@mui/icons-material';
import type { Contact, ContactCreate, ContactUpdate, ContactSource } from '../../../models/contact';
import { useAppSelector } from '../../../store/hooks';

interface ContactFormDialogProps {
	open: boolean;
	onClose: () => void;
	onSubmit: (data: ContactCreate | ContactUpdate) => void;
	contact?: Contact | null;
	loading?: boolean;
}

const CONTACT_SOURCES: { value: ContactSource; label: string }[] = [
	{ value: 'linkedin', label: 'LinkedIn' },
	{ value: 'website', label: 'Website' },
	{ value: 'referral', label: 'Referral' },
	{ value: 'cold_call', label: 'Cold Call' },
	{ value: 'event', label: 'Event' },
	{ value: 'other', label: 'Other' }
];

const ContactFormDialog: React.FC<ContactFormDialogProps> = ({
	open,
	onClose,
	onSubmit,
	contact,
	loading = false
}) => {
	const { list: companies } = useAppSelector((state) => state.companies);

	const [formData, setFormData] = useState<Partial<Contact>>({
		first_name: '',
		last_name: '',
		email: '',
		phone: '',
		mobile: '',
		designation: '',
		department: '',
		company_id: undefined,
		is_primary: false,
		is_decision_maker: false,
		contact_source: 'linkedin',
		linkedin_url: ''
	});

	useEffect(() => {
		const timer = setTimeout(() => {
			if (contact) {
				setFormData({
					...contact
				});
			} else {
				setFormData({
					first_name: '',
					last_name: '',
					email: '',
					phone: '',
					mobile: '',
					designation: '',
					department: '',
					company_id: undefined,
					is_primary: false,
					is_decision_maker: false,
					contact_source: 'linkedin',
					linkedin_url: ''
				});
			}
		}, 0);
		return () => clearTimeout(timer);
	}, [contact, open]);

	const handleChange = (field: string, value: unknown) => {
		setFormData(prev => ({ ...prev, [field]: value }));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.first_name || !formData.last_name || !formData.email) return;

		const { public_id, created_at, updated_at, company, ...submitData } = formData as Contact & { public_id?: string; created_at?: string; updated_at?: string; company?: unknown };
		onSubmit(submitData as ContactCreate);
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
						{contact ? 'Edit Contact' : 'New Contact'}
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
									<PersonIcon sx={{ color: '#545b64', fontSize: 20 }} />
									<Typography sx={sectionTitleStyle}>Contact Identity</Typography>
								</Stack>
								<Grid container spacing={3}>
									<Grid size={{ xs: 12, md: 6 }}>
										<TextField
											required
											fullWidth
											label="First Name"
											value={formData.first_name}
											onChange={(e) => handleChange('first_name', e.target.value)}
											size="small"
											variant="outlined"
											sx={{ '& .MuiOutlinedInput-root': { borderRadius: '2px' } }}
										/>
									</Grid>
									<Grid size={{ xs: 12, md: 6 }}>
										<TextField
											required
											fullWidth
											label="Last Name"
											value={formData.last_name}
											onChange={(e) => handleChange('last_name', e.target.value)}
											size="small"
											variant="outlined"
											sx={{ '& .MuiOutlinedInput-root': { borderRadius: '2px' } }}
										/>
									</Grid>
									<Grid size={{ xs: 12, md: 6 }}>
										<TextField
											required
											fullWidth
											label="Email Address"
											type="email"
											value={formData.email}
											onChange={(e) => handleChange('email', e.target.value)}
											placeholder="john.doe@example.com"
											size="small"
											variant="outlined"
											sx={{ '& .MuiOutlinedInput-root': { borderRadius: '2px' } }}
										/>
									</Grid>
									<Grid size={{ xs: 12, md: 6 }}>
										<FormControl fullWidth size="small">
											<InputLabel>Associated Company</InputLabel>
											<Select
												value={formData.company_id || ''}
												label="Associated Company"
												onChange={(e) => handleChange('company_id', e.target.value)}
												sx={{ borderRadius: '2px' }}
											>
												<MenuItem value="">None</MenuItem>
												{companies.map(c => (
													<MenuItem key={c.public_id} value={c.id}>
														{c.name}
													</MenuItem>
												))}
											</Select>
										</FormControl>
									</Grid>
								</Grid>
							</Paper>

							<Paper elevation={0} sx={awsPanelStyle}>
								<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
									<WorkIcon sx={{ color: '#545b64', fontSize: 20 }} />
									<Typography sx={sectionTitleStyle}>Professional Details</Typography>
								</Stack>
								<Grid container spacing={3}>
									<Grid size={{ xs: 12, md: 6 }}>
										<TextField
											fullWidth
											label="Designation"
											value={formData.designation}
											onChange={(e) => handleChange('designation', e.target.value)}
											placeholder="e.g. HR Manager"
											size="small"
											variant="outlined"
											sx={{ '& .MuiOutlinedInput-root': { borderRadius: '2px' } }}
										/>
									</Grid>
									<Grid size={{ xs: 12, md: 6 }}>
										<TextField
											fullWidth
											label="Department"
											value={formData.department}
											onChange={(e) => handleChange('department', e.target.value)}
											placeholder="e.g. Talent Acquisition"
											size="small"
											variant="outlined"
											sx={{ '& .MuiOutlinedInput-root': { borderRadius: '2px' } }}
										/>
									</Grid>
									<Grid size={{ xs: 12 }}>
										<FormControl fullWidth size="small">
											<InputLabel>Source</InputLabel>
											<Select
												value={formData.contact_source}
												label="Source"
												onChange={(e) => handleChange('contact_source', e.target.value)}
												sx={{ borderRadius: '2px' }}
											>
												{CONTACT_SOURCES.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
											</Select>
										</FormControl>
									</Grid>
								</Grid>
								<Stack direction="row" spacing={4} sx={{ mt: 3 }}>
									<FormControlLabel
										control={
											<Switch
												checked={formData.is_primary}
												onChange={(e) => handleChange('is_primary', e.target.checked)}
												sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#ec7211' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#ec7211' } }}
											/>
										}
										label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Primary Contact</Typography>}
									/>
									<FormControlLabel
										control={
											<Switch
												checked={formData.is_decision_maker}
												onChange={(e) => handleChange('is_decision_maker', e.target.checked)}
												sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#ec7211' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#ec7211' } }}
											/>
										}
										label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Decision Maker</Typography>}
									/>
								</Stack>
							</Paper>

							<Paper elevation={0} sx={awsPanelStyle}>
								<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
									<PhoneIcon sx={{ color: '#545b64', fontSize: 20 }} />
									<Typography sx={sectionTitleStyle}>Contact Numbers</Typography>
								</Stack>
								<Grid container spacing={3}>
									<Grid size={{ xs: 12, md: 6 }}>
										<TextField
											fullWidth
											label="Work Phone"
											value={formData.phone}
											onChange={(e) => handleChange('phone', e.target.value)}
											size="small"
											variant="outlined"
											sx={{ '& .MuiOutlinedInput-root': { borderRadius: '2px' } }}
										/>
									</Grid>
									<Grid size={{ xs: 12, md: 6 }}>
										<TextField
											fullWidth
											label="Mobile"
											value={formData.mobile}
											onChange={(e) => handleChange('mobile', e.target.value)}
											size="small"
											variant="outlined"
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
						disabled={loading || !formData.first_name || !formData.last_name || !formData.email}
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
						{loading ? 'Saving...' : (contact ? 'Update Contact' : 'Save Contact')}
					</Button>
				</DialogActions>
			</Box>
		</Dialog>
	);
};

export default ContactFormDialog;
