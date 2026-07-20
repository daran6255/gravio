import React, { useState } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Box,
	Typography,
	TextField,
	MenuItem,
	CircularProgress,
	Alert,
	Autocomplete,
	InputAdornment,
	useTheme,
} from '@mui/material';
import {
	GroupsOutlined as TeamIcon,
	BusinessOutlined as BusinessIcon,
	RoomOutlined as RoomIcon,
	PeopleAltOutlined as PeopleIcon,
	WorkOutline as WorkIcon,
} from '@mui/icons-material';
import { useAppDispatch } from '../../../store/hooks';
import { fetchCurrentUser } from '../../../store/slices/authSlice';
import userService from '../../../services/userService';
import useToast from '../../../hooks/useToast';
import useLocationSearch from '../../../hooks/useLocationSearch';
import { SubmitButton, CancelButton } from '../../common/button';

interface ConvertToTeamDialogProps {
	open: boolean;
	onClose: () => void;
	/** Current (auto-generated) workspace name, offered as a starting point. */
	defaultName?: string;
}

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];
const INDUSTRIES = [
	'Technology',
	'Healthcare',
	'Finance',
	'Education',
	'Non-Profit',
	'Professional Services',
	'Manufacturing',
	'Retail',
	'Other',
];

const ConvertToTeamDialog: React.FC<ConvertToTeamDialogProps> = ({ open, onClose, defaultName }) => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const toast = useToast();

	const [name, setName] = useState(defaultName || '');
	const [location, setLocation] = useState('');
	const [companySize, setCompanySize] = useState('');
	const [industry, setIndustry] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const { locationOptions, locationLoading, locationInputValue, setLocationInputValue } = useLocationSearch();

	const handleClose = () => {
		if (submitting) return;
		onClose();
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (name.trim().length < 2) {
			toast.error('Organization name must be at least 2 characters.');
			return;
		}
		setSubmitting(true);
		try {
			await userService.convertToOrganization({
				name: name.trim(),
				location: location.trim() || undefined,
				company_size: companySize || undefined,
				industry: industry || undefined,
			});
			toast.success('Your account has been converted to a team organization!');
			await dispatch(fetchCurrentUser());
			onClose();
		} catch (error: any) {
			toast.error(
				error?.response?.data?.error?.message ||
				error?.response?.data?.detail ||
				'Failed to convert your account. Please try again.'
			);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Dialog
			open={open}
			onClose={handleClose}
			maxWidth="sm"
			fullWidth
			PaperProps={{
				sx: {
					borderRadius: 3,
					overflow: 'hidden',
					bgcolor: theme.palette.background.paper,
					border: `1px solid ${theme.palette.divider}`,
					boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
				},
			}}
		>
			<DialogTitle
				sx={{
					background: theme.gradients?.brand ?? 'linear-gradient(135deg, #8B7CF6 0%, #6052d9 100%)',
					color: '#ffffff',
					fontWeight: 800,
					py: 2.5,
					display: 'flex',
					alignItems: 'center',
					gap: 1.5,
				}}
			>
				<TeamIcon /> Convert to Team Organization
			</DialogTitle>

			<form onSubmit={handleSubmit}>
				<DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
					<Alert severity="info" sx={{ borderRadius: 2 }}>
						Tell us a bit about your organization. Once converted, you'll be able to invite
						teammates and use Team, Timesheets, and HR Administration — your current plan and
						trial period carry over unchanged.
					</Alert>

					<Box>
						<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.75 }}>
							Organization Name *
						</Typography>
						<TextField
							required
							fullWidth
							autoFocus
							placeholder="e.g. Acme Corporation"
							value={name}
							onChange={(e) => setName(e.target.value)}
							disabled={submitting}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<BusinessIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
									</InputAdornment>
								),
							}}
						/>
					</Box>

					<Box>
						<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.75 }}>
							Location
						</Typography>
						<Autocomplete
							freeSolo
							options={locationOptions}
							loading={locationLoading}
							value={location}
							onChange={(_, newValue) => setLocation(newValue || '')}
							inputValue={locationInputValue}
							onInputChange={(_, newInputValue) => setLocationInputValue(newInputValue)}
							disabled={submitting}
							// Options already come pre-filtered by the geocoding API for the typed
							// text — MUI's default client-side filter re-matches the input against
							// the option label, which hides results whenever the search term is a
							// misspelling/alias of the returned name. Disable it so server results
							// always show.
							filterOptions={(options) => options}
							renderInput={(params) => (
								<TextField
									{...params}
									placeholder="Search location (e.g. Bangalore, Karnataka)"
									InputProps={{
										...params.InputProps,
										startAdornment: (
											<InputAdornment position="start">
												<RoomIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
											</InputAdornment>
										),
										endAdornment: (
											<>
												{locationLoading ? <CircularProgress color="inherit" size={16} /> : null}
												{params.InputProps.endAdornment}
											</>
										),
									}}
								/>
							)}
						/>
					</Box>

					<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
						<Box>
							<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.75 }}>
								Company Size
							</Typography>
							<TextField
								select
								fullWidth
								value={companySize}
								onChange={(e) => setCompanySize(e.target.value)}
								disabled={submitting}
								SelectProps={{ displayEmpty: true }}
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<PeopleIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
										</InputAdornment>
									),
								}}
							>
								<MenuItem value="">Select company size</MenuItem>
								{COMPANY_SIZES.map((size) => (
									<MenuItem key={size} value={size}>{size} employees</MenuItem>
								))}
							</TextField>
						</Box>
						<Box>
							<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.75 }}>
								Industry
							</Typography>
							<TextField
								select
								fullWidth
								value={industry}
								onChange={(e) => setIndustry(e.target.value)}
								disabled={submitting}
								SelectProps={{ displayEmpty: true }}
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<WorkIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
										</InputAdornment>
									),
								}}
							>
								<MenuItem value="">Select industry</MenuItem>
								{INDUSTRIES.map((ind) => (
									<MenuItem key={ind} value={ind}>{ind}</MenuItem>
								))}
							</TextField>
						</Box>
					</Box>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 3, pt: 0, justifyContent: 'space-between' }}>
					<CancelButton
						variant="text"
						onClick={handleClose}
						disabled={submitting}
						sx={{ fontWeight: 700 }}
					/>
					<SubmitButton
						type="submit"
						loading={submitting}
						startIcon={submitting ? undefined : <TeamIcon />}
						sx={{
							px: 3,
							borderRadius: 2.5,
							background: theme.gradients?.brand ?? 'linear-gradient(135deg, #8B7CF6 0%, #6052d9 100%)',
							boxShadow: 'none',
							'&:hover': { boxShadow: 'none' },
						}}
					>
						Convert Account
					</SubmitButton>
				</DialogActions>
			</form>
		</Dialog>
	);
};

export default ConvertToTeamDialog;
