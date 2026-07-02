import React, { useMemo, useState } from 'react';
import {
	Box,
	Container,
	Card,
	CardContent,
	Stack,
	Avatar,
	Typography,
	Chip,
	Autocomplete,
	TextField,
	Button,
	Divider,
	CircularProgress,
	InputAdornment,
	alpha,
	useTheme,
} from '@mui/material';
import { Save } from '@mui/icons-material';
import PageHeader from '../../components/common/page-header';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { updateProfile } from '../../store/slices/authSlice';
import { getWorldCurrencies, type CurrencyOption } from '../../utils/currency';
import useToast from '../../hooks/useToast';

const BROWSER_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

/** Common representations for a timezone: IANA identifier (given), UTC offset (±HH:MM), and abbreviation (e.g. IST). */
const getTimezoneMeta = (tz: string): { offset: string; abbreviation: string } => {
	const now = new Date();
	try {
		const offsetPart = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'shortOffset' })
			.formatToParts(now)
			.find((p) => p.type === 'timeZoneName')?.value || '';
		const abbrPart = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'short' })
			.formatToParts(now)
			.find((p) => p.type === 'timeZoneName')?.value || '';
		return { offset: offsetPart.replace('GMT', 'UTC'), abbreviation: abbrPart };
	} catch {
		return { offset: '', abbreviation: '' };
	}
};

const getTimezoneLabel = (tz: string): string => {
	const { offset, abbreviation } = getTimezoneMeta(tz);
	const showAbbr = abbreviation && abbreviation !== offset;
	return `${tz} (${offset}${showAbbr ? `, ${abbreviation}` : ''})`;
};

const AccountSettings: React.FC = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const dispatch = useAppDispatch();
	const toast = useToast();
	const user = useAppSelector((state) => state.auth.user);

	const [timezone, setTimezone] = useState<string | null>(user?.timezone || null);
	const [currency, setCurrency] = useState<string | null>(user?.currency || null);
	const [saving, setSaving] = useState(false);

	const timezoneOptions = useMemo(() => {
		let zones: string[];
		try {
			zones = Intl.supportedValuesOf('timeZone');
		} catch {
			zones = [BROWSER_TIMEZONE];
		}
		return zones.map((tz) => ({ tz, label: getTimezoneLabel(tz) }));
	}, []);
	const selectedTimezone = timezoneOptions.find((o) => o.tz === timezone) || null;

	const currencyOptions = useMemo(() => getWorldCurrencies(), []);
	const selectedCurrency = currencyOptions.find((c) => c.code === currency) || null;

	const hasChanges = timezone !== (user?.timezone || null) || currency !== (user?.currency || null);

	const handleSave = async () => {
		setSaving(true);
		try {
			await dispatch(updateProfile({ timezone, currency })).unwrap();
			toast.success('Preferences saved');
		} catch (err: any) {
			toast.error(err || 'Failed to save preferences');
		} finally {
			setSaving(false);
		}
	};

	const cardSx = {
		borderRadius: 3,
		boxShadow: 'none',
		border: '1px solid',
		borderColor: 'divider',
	};

	if (!user) return null;

	const initial = (user.full_name || user.username || user.email).charAt(0).toUpperCase();

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh', py: { xs: 2, sm: 4 } }}>
			<Container maxWidth="md">
				<PageHeader
					title="Account Settings"
					subtitle="Manage your personal display preferences"
				/>

				<Card sx={{ ...cardSx, mb: 3 }}>
					<CardContent sx={{ p: 3 }}>
						<Stack direction="row" spacing={2} alignItems="center">
							<Avatar
								sx={{
									width: 56,
									height: 56,
									bgcolor: alpha(theme.palette.primary.main, isDark ? 0.22 : 0.12),
									color: 'primary.main',
									fontWeight: 800,
									fontSize: '1.25rem',
								}}
							>
								{initial}
							</Avatar>
							<Box sx={{ minWidth: 0 }}>
								<Typography variant="h6" sx={{ fontWeight: 700 }} noWrap>
									{user.full_name || user.username}
								</Typography>
								<Typography variant="body2" color="text.secondary" noWrap>
									{user.email}
								</Typography>
							</Box>
							<Box sx={{ flexGrow: 1 }} />
							<Chip
								label={user.role}
								size="small"
								color="primary"
								variant="outlined"
								sx={{ fontWeight: 700, textTransform: 'capitalize' }}
							/>
						</Stack>
					</CardContent>
				</Card>

				<Card sx={cardSx}>
					<CardContent sx={{ p: 3 }}>
						<Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
							Display Preferences
						</Typography>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
							These only change how dates and monetary totals are displayed to you — they don't affect other users or the underlying data.
						</Typography>

						<Stack spacing={3}>
							<Box>
								<Autocomplete
									options={timezoneOptions}
									getOptionLabel={(o) => o.label}
									value={selectedTimezone}
									onChange={(_e, value) => setTimezone(value?.tz || null)}
									isOptionEqualToValue={(o, v) => o.tz === v.tz}
									renderInput={(params) => (
										<TextField
											{...params}
											label="Timezone"
											placeholder={`System Default (${BROWSER_TIMEZONE})`}
										/>
									)}
								/>
								<Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
									Shown as Region/City (IANA identifier) with its current UTC offset and abbreviation, e.g. Asia/Kolkata (UTC+05:30, IST). Leave blank to use your browser's local timezone ({BROWSER_TIMEZONE}).
								</Typography>
							</Box>

							<Box>
								<Autocomplete
									options={currencyOptions}
									getOptionLabel={(o) => `${o.code} — ${o.name}`}
									value={selectedCurrency}
									onChange={(_e, value) => setCurrency(value?.code || null)}
									isOptionEqualToValue={(o, v) => o.code === v.code}
									renderOption={(props, option: CurrencyOption) => (
										<Box component="li" {...props} key={option.code} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
											<Box
												sx={{
													width: 28,
													height: 28,
													borderRadius: '50%',
													flexShrink: 0,
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													bgcolor: alpha(theme.palette.primary.main, isDark ? 0.18 : 0.1),
													color: 'primary.main',
													fontWeight: 800,
													fontSize: '0.8rem',
												}}
											>
												{option.symbol}
											</Box>
											<span>{option.code} — {option.name}</span>
										</Box>
									)}
									renderInput={(params) => (
										<TextField
											{...params}
											label="Preferred Display Currency"
											placeholder="USD — US Dollar"
											InputProps={{
												...params.InputProps,
												startAdornment: selectedCurrency ? (
													<InputAdornment position="start">
														<Box
															sx={{
																width: 22,
																height: 22,
																borderRadius: '50%',
																display: 'flex',
																alignItems: 'center',
																justifyContent: 'center',
																bgcolor: alpha(theme.palette.primary.main, isDark ? 0.18 : 0.1),
																color: 'primary.main',
																fontWeight: 800,
																fontSize: '0.7rem',
															}}
														>
															{selectedCurrency.symbol}
														</Box>
													</InputAdornment>
												) : undefined,
											}}
										/>
									)}
								/>
								<Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
									Changes the currency symbol shown on aggregate totals (e.g. pipeline stat cards), and is used to convert individual deal/lead values recorded in a different currency for display.
								</Typography>
							</Box>
						</Stack>

						<Divider sx={{ my: 3 }} />

						<Stack direction="row" justifyContent="flex-end">
							<Button
								variant="contained"
								startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
								disabled={!hasChanges || saving}
								onClick={handleSave}
								sx={{
									textTransform: 'none',
									fontWeight: 700,
									borderRadius: '10px',
									px: 3,
									background: 'linear-gradient(135deg, #8B7CF6 0%, #6052d9 100%)',
									boxShadow: '0 2px 8px rgba(139, 124, 246, 0.25)',
								}}
							>
								{saving ? 'Saving...' : 'Save Preferences'}
							</Button>
						</Stack>
					</CardContent>
				</Card>
			</Container>
		</Box>
	);
};

export default AccountSettings;
