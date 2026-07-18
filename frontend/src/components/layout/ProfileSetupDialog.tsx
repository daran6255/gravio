import React, { useState } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Box,
	Typography,
	Autocomplete,
	TextField,
	InputAdornment,
	Button,
	CircularProgress,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
	Public as PublicIcon,
	AccessTimeOutlined as TimezoneIcon,
	PaidOutlined as CurrencyIcon,
} from '@mui/icons-material';
import { useAppDispatch } from '../../store/hooks';
import { updateProfile } from '../../store/slices/authSlice';
import useToast from '../../hooks/useToast';
import { getWorldCurrencies } from '../../utils/currency';
import { BROWSER_TIMEZONE, getTimezoneOptions } from '../../utils/timezone';

interface ProfileSetupDialogProps {
	open: boolean;
}

/**
 * Blocking first-login prompt: a brand-new account has no timezone/currency
 * set yet, so this collects both before the rest of the app becomes usable.
 * There is deliberately no skip/close affordance — see User.onboarding_completed
 * on the backend for how this is gated.
 */
const ProfileSetupDialog: React.FC<ProfileSetupDialogProps> = ({ open }) => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const toast = useToast();

	const [timezone, setTimezone] = useState<string | null>(BROWSER_TIMEZONE);
	const [currency, setCurrency] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	const timezoneOptions = getTimezoneOptions();
	const selectedTimezoneOption = timezoneOptions.find((o) => o.tz === timezone) || null;

	const currencyOptions = getWorldCurrencies();
	const selectedCurrencyOption = currencyOptions.find((c) => c.code === currency) || null;

	const canSubmit = !!timezone && !!currency;

	const fieldSx = {
		'& .MuiOutlinedInput-root': {
			borderRadius: theme.layout.radius.button,
		},
	};

	const handleSubmit = async () => {
		if (!canSubmit || saving) return;
		setSaving(true);
		try {
			await dispatch(updateProfile({ timezone, currency, onboarding_completed: true })).unwrap();
			toast.success('Workspace set up — welcome aboard!');
		} catch (err: any) {
			toast.error(err || 'Failed to save your preferences');
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog
			open={open}
			disableEscapeKeyDown
			maxWidth="xs"
			fullWidth
			PaperProps={{ sx: { borderRadius: theme.layout.radius.card } }}
		>
			<DialogTitle sx={{ pb: 0.5 }}>
				<Box
					sx={{
						width: 44,
						height: 44,
						borderRadius: theme.layout.radius.button,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						mb: 1.5,
						background: theme.gradients.brandDiagonal,
						color: theme.palette.primary.contrastText,
					}}
				>
					<PublicIcon />
				</Box>
				<Typography variant="h6" sx={{ fontWeight: 800 }}>
					Welcome to Gravit
				</Typography>
			</DialogTitle>
			<DialogContent>
				<Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
					Let's set up your workspace. Confirm your timezone and preferred display currency to get started — you can change these later in Settings.
				</Typography>

				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
					<Box>
						<Typography variant="caption" sx={{ ...theme.typography.footerLink, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary', display: 'block', mb: 0.75 }}>
							Timezone
						</Typography>
						<Autocomplete
							options={timezoneOptions}
							getOptionLabel={(o) => o.label}
							value={selectedTimezoneOption}
							onChange={(_e, value) => setTimezone(value?.tz || null)}
							isOptionEqualToValue={(o, v) => o.tz === v.tz}
							renderInput={(params) => (
								<TextField
									{...params}
									size="small"
									InputProps={{
										...params.InputProps,
										startAdornment: (
											<InputAdornment position="start">
												<TimezoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
											</InputAdornment>
										),
									}}
									sx={fieldSx}
								/>
							)}
						/>
					</Box>
					<Box>
						<Typography variant="caption" sx={{ ...theme.typography.footerLink, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary', display: 'block', mb: 0.75 }}>
							Display Currency
						</Typography>
						<Autocomplete
							options={currencyOptions}
							getOptionLabel={(o) => `${o.code} — ${o.name}`}
							value={selectedCurrencyOption}
							onChange={(_e, value) => setCurrency(value?.code || null)}
							isOptionEqualToValue={(o, v) => o.code === v.code}
							renderInput={(params) => (
								<TextField
									{...params}
									size="small"
									placeholder="Select a currency"
									InputProps={{
										...params.InputProps,
										startAdornment: (
											<InputAdornment position="start">
												<CurrencyIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
											</InputAdornment>
										),
									}}
									sx={fieldSx}
								/>
							)}
						/>
					</Box>
				</Box>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
				<Button
					fullWidth
					disabled={!canSubmit || saving}
					onClick={handleSubmit}
					sx={{
						textTransform: 'none',
						fontWeight: 700,
						borderRadius: theme.layout.radius.button,
						py: 1.1,
						color: theme.palette.primary.contrastText,
						background: theme.gradients.brandDiagonal,
						boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.4)}`,
						'&:hover': {
							background: theme.gradients.brandDiagonalHover,
						},
						'&.Mui-disabled': {
							color: alpha(theme.palette.primary.contrastText, 0.6),
							background: alpha(theme.palette.primary.main, 0.4),
						},
					}}
				>
					{saving ? <CircularProgress size={20} sx={{ color: theme.palette.primary.contrastText }} /> : 'Save & Continue'}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default ProfileSetupDialog;
