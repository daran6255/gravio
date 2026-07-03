import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
	Box,
	Typography,
	Stack,
	Autocomplete,
	TextField,
	alpha,
} from '@mui/material';
import {
	DarkMode as DarkModeIcon,
	LightMode as LightModeIcon,
	SettingsBrightness as SystemSyncIcon,
	CalendarMonth as CalendarIcon,
	PaidOutlined as CurrencyIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material';
import { useColorMode } from '../../theme/ThemeContext';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { updateProfile } from '../../store/slices/authSlice';
import { useSettingsContext } from '../../context/SettingsContext';
import useToast from '../../hooks/useToast';
import { getWorldCurrencies, formatMoney } from '../../utils/currency';

const BROWSER_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

const getTimezoneMeta = (tz: string): { offset: string; abbreviation: string } => {
	const now = new Date();
	try {
		const offsetPart =
			new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'shortOffset' })
				.formatToParts(now)
				.find((p) => p.type === 'timeZoneName')?.value || '';
		const abbrPart =
			new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'short' })
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
	return `(${offset}) ${tz.replace(/_/g, ' ')}${showAbbr ? ` — ${abbreviation}` : ''}`;
};

type ThemeOption = 'dark' | 'light' | 'system';

const PreferencesTab: React.FC = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const { mode, toggleColorMode } = useColorMode();
	const dispatch = useAppDispatch();
	const toast = useToast();
	const user = useAppSelector((state) => state.auth.user);
	const { markDirty, markClean, registerSaveHandler, registerDiscardHandler } = useSettingsContext();

	// Theme selection
	const [selectedTheme, setSelectedTheme] = useState<ThemeOption>(mode as ThemeOption);
	const originalTheme = mode as ThemeOption;

	// Timezone
	const originalTimezone = user?.timezone || null;
	const [timezone, setTimezone] = useState<string | null>(originalTimezone);

	// Currency
	const originalCurrency = user?.currency || null;
	const [currency, setCurrency] = useState<string | null>(originalCurrency);

	// Language (UI-only for now)
	const [language] = useState('English (United States)');

	const timezoneOptions = useMemo(() => {
		let zones: string[];
		try {
			zones = Intl.supportedValuesOf('timeZone');
		} catch {
			zones = [BROWSER_TIMEZONE];
		}
		return zones.map((tz) => ({ tz, label: getTimezoneLabel(tz) }));
	}, []);

	const selectedTimezoneOption = timezoneOptions.find((o) => o.tz === timezone) || null;

	const currencyOptions = useMemo(() => getWorldCurrencies(), []);
	const selectedCurrencyOption = currencyOptions.find((c) => c.code === currency) || null;

	// Live preview of how the selected timezone/currency will render elsewhere
	// in the app — recomputed every render so it always reflects the in-progress
	// (possibly unsaved) selection, not just what's already persisted.
	const previewTimezone = timezone || BROWSER_TIMEZONE;
	const previewDateTime = useMemo(() => {
		try {
			return new Intl.DateTimeFormat('en', {
				timeZone: previewTimezone,
				dateStyle: 'medium',
				timeStyle: 'short',
			}).format(new Date());
		} catch {
			return new Date().toLocaleString();
		}
	}, [previewTimezone]);
	const previewAmount = formatMoney(1284.5, currency || 'USD');

	// Track dirty
	useEffect(() => {
		if (selectedTheme !== originalTheme) {
			markDirty('preferences.theme');
		} else {
			markClean('preferences.theme');
		}
	}, [selectedTheme, originalTheme, markDirty, markClean]);

	useEffect(() => {
		if (timezone !== originalTimezone) {
			markDirty('preferences.timezone');
		} else {
			markClean('preferences.timezone');
		}
	}, [timezone, originalTimezone, markDirty, markClean]);

	useEffect(() => {
		if (currency !== originalCurrency) {
			markDirty('preferences.currency');
		} else {
			markClean('preferences.currency');
		}
	}, [currency, originalCurrency, markDirty, markClean]);

	// Save handler
	const handleSave = useCallback(async () => {
		// Apply theme change
		if (selectedTheme !== mode) {
			toggleColorMode();
		}
		// Save timezone & currency to backend
		if (timezone !== originalTimezone || currency !== originalCurrency) {
			try {
				await dispatch(updateProfile({ timezone, currency })).unwrap();
				toast.success('Preferences saved');
			} catch (err: any) {
				toast.error(err || 'Failed to save preferences');
				throw err;
			}
		}
	}, [selectedTheme, mode, toggleColorMode, timezone, originalTimezone, currency, originalCurrency, dispatch, toast]);

	const handleDiscard = useCallback(() => {
		setSelectedTheme(originalTheme);
		setTimezone(originalTimezone);
		setCurrency(originalCurrency);
	}, [originalTheme, originalTimezone, originalCurrency]);

	useEffect(() => {
		registerSaveHandler('preferences', handleSave);
		registerDiscardHandler('preferences', handleDiscard);
	}, [registerSaveHandler, registerDiscardHandler, handleSave, handleDiscard]);

	const cardBg = isDark ? '#141822' : '#ffffff';
	const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
	const labelColor = isDark ? '#94A3B8' : '#64748b';

	const themeOptions: { key: ThemeOption; label: string; description: string; icon: React.ReactElement }[] = [
		{
			key: 'dark',
			label: 'Dark Theme',
			description: 'Maximum focus for deep work sessions.',
			icon: <DarkModeIcon sx={{ fontSize: '1.5rem' }} />,
		},
		{
			key: 'light',
			label: 'Light Theme',
			description: 'High clarity for daytime environments.',
			icon: <LightModeIcon sx={{ fontSize: '1.5rem' }} />,
		},
		{
			key: 'system',
			label: 'System Sync',
			description: 'Follow OS level lighting settings.',
			icon: <SystemSyncIcon sx={{ fontSize: '1.5rem' }} />,
		},
	];

	return (
		<Box>
			{/* Section Header */}
			<Typography
				variant="subtitle1"
				sx={{
					fontWeight: 800,
					fontSize: '0.9rem',
					textTransform: 'uppercase',
					letterSpacing: '0.08em',
					color: isDark ? '#F4F5F7' : '#1e293b',
					mb: 0.5,
				}}
			>
				Environment Preferences
			</Typography>
			<Typography variant="body2" sx={{ color: labelColor, mb: 4 }}>
				Customize your workspace appearance and regional parameters.
			</Typography>

			{/* Theme Selector */}
			<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
				{themeOptions.map((opt) => {
					const isSelected = selectedTheme === opt.key;
					return (
						<Box
							key={opt.key}
							onClick={() => setSelectedTheme(opt.key)}
							sx={{
								flex: 1,
								p: 2.5,
								bgcolor: cardBg,
								border: `1px solid ${isSelected ? '#8B7CF6' : cardBorder}`,
								borderRadius: 3,
								cursor: 'pointer',
								transition: 'all 0.2s ease',
								position: 'relative',
								'&:hover': {
									borderColor: isSelected ? '#8B7CF6' : alpha('#8B7CF6', 0.4),
									bgcolor: isSelected ? cardBg : alpha('#8B7CF6', 0.04),
								},
							}}
						>
							{/* Radio indicator */}
							{isSelected && (
								<Box
									sx={{
										position: 'absolute',
										top: 12,
										right: 12,
										width: 18,
										height: 18,
										borderRadius: '50%',
										border: '2px solid #8B7CF6',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									<Box
										sx={{
											width: 10,
											height: 10,
											borderRadius: '50%',
											bgcolor: '#8B7CF6',
										}}
									/>
								</Box>
							)}
							<Box sx={{ color: isSelected ? '#8B7CF6' : (isDark ? '#94A3B8' : '#64748b'), mb: 1.5 }}>
								{opt.icon}
							</Box>
							<Typography
								variant="body2"
								sx={{ fontWeight: 700, color: isDark ? '#F4F5F7' : '#1e293b', mb: 0.5 }}
							>
								{opt.label}
							</Typography>
							<Typography variant="caption" sx={{ color: labelColor, lineHeight: 1.4 }}>
								{opt.description}
							</Typography>
						</Box>
					);
				})}
			</Stack>

			{/* Language, Timezone & Currency */}
			<Box
				sx={{
					bgcolor: cardBg,
					border: `1px solid ${cardBorder}`,
					borderRadius: 4,
					boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.25)' : '0 8px 32px rgba(15,23,42,0.06)',
					p: 3,
					mb: 3,
				}}
			>
				<Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
					<Box sx={{ flex: 1 }}>
						<Typography
							variant="caption"
							sx={{
								fontWeight: 700,
								color: isDark ? '#94A3B8' : '#64748b',
								display: 'block',
								mb: 0.75,
								fontSize: '0.75rem',
								fontStyle: 'italic',
							}}
						>
							Interface Language
						</Typography>
						<TextField
							fullWidth
							size="small"
							value={language}
							disabled
							select={false}
							sx={{
								'& .MuiOutlinedInput-root': {
									bgcolor: isDark ? '#1a1e28' : '#f8fafc',
									borderRadius: 2,
									'& fieldset': {
										borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
									},
								},
								'& .MuiInputBase-input': {
									color: isDark ? '#F4F5F7' : '#1e293b',
									fontWeight: 500,
								},
							}}
						/>
					</Box>
					<Box sx={{ flex: 1 }}>
						<Typography
							variant="caption"
							sx={{
								fontWeight: 700,
								color: isDark ? '#94A3B8' : '#64748b',
								display: 'block',
								mb: 0.75,
								fontSize: '0.75rem',
								fontStyle: 'italic',
							}}
						>
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
									placeholder={`System Default (${BROWSER_TIMEZONE})`}
									sx={{
										'& .MuiOutlinedInput-root': {
											bgcolor: isDark ? '#1a1e28' : '#f8fafc',
											borderRadius: 2,
											'& fieldset': {
												borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
											},
										},
										'& .MuiInputBase-input': {
											color: isDark ? '#F4F5F7' : '#1e293b',
											fontWeight: 500,
										},
									}}
								/>
							)}
						/>
					</Box>
					<Box sx={{ flex: 1 }}>
						<Typography
							variant="caption"
							sx={{
								fontWeight: 700,
								color: isDark ? '#94A3B8' : '#64748b',
								display: 'block',
								mb: 0.75,
								fontSize: '0.75rem',
								fontStyle: 'italic',
							}}
						>
							Preferred Display Currency
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
									placeholder="System Default (USD)"
									sx={{
										'& .MuiOutlinedInput-root': {
											bgcolor: isDark ? '#1a1e28' : '#f8fafc',
											borderRadius: 2,
											'& fieldset': {
												borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
											},
										},
										'& .MuiInputBase-input': {
											color: isDark ? '#F4F5F7' : '#1e293b',
											fontWeight: 500,
										},
									}}
								/>
							)}
						/>
					</Box>
				</Stack>
			</Box>

			{/* Live Regional Preview — shows what the selection above actually
			    looks like elsewhere in the app, using the space with something
			    concrete instead of leaving it blank */}
			<Box
				sx={{
					bgcolor: cardBg,
					border: `1px solid ${cardBorder}`,
					borderRadius: 4,
					boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.25)' : '0 8px 32px rgba(15,23,42,0.06)',
					p: 3,
					mb: 5,
				}}
			>
				<Typography
					variant="body2"
					sx={{ fontWeight: 700, color: isDark ? '#F4F5F7' : '#1e293b', mb: 2 }}
				>
					Regional Preview
				</Typography>
				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
					<Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
						<Box
							sx={{
								width: 36,
								height: 36,
								borderRadius: 2,
								bgcolor: alpha('#8B7CF6', isDark ? 0.12 : 0.08),
								color: '#8B7CF6',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								flexShrink: 0,
							}}
						>
							<CalendarIcon sx={{ fontSize: 18 }} />
						</Box>
						<Box sx={{ minWidth: 0 }}>
							<Typography variant="caption" sx={{ color: labelColor, display: 'block' }}>
								Date & Time now, in this timezone
							</Typography>
							<Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#F4F5F7' : '#1e293b' }}>
								{previewDateTime}
							</Typography>
						</Box>
					</Stack>
					<Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
						<Box
							sx={{
								width: 36,
								height: 36,
								borderRadius: 2,
								bgcolor: alpha('#8B7CF6', isDark ? 0.12 : 0.08),
								color: '#8B7CF6',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								flexShrink: 0,
							}}
						>
							<CurrencyIcon sx={{ fontSize: 18 }} />
						</Box>
						<Box sx={{ minWidth: 0 }}>
							<Typography variant="caption" sx={{ color: labelColor, display: 'block' }}>
								Sample deal value in this currency
							</Typography>
							<Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#F4F5F7' : '#1e293b' }}>
								{previewAmount}
							</Typography>
						</Box>
					</Stack>
				</Stack>
			</Box>
		</Box>
	);
};

export default PreferencesTab;
