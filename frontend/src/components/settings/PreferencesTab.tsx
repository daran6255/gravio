import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
	Box,
	Typography,
	Stack,
	Autocomplete,
	TextField,
	InputAdornment,
	alpha,
} from '@mui/material';
import {
	DarkMode as DarkModeIcon,
	LightMode as LightModeIcon,
	SettingsBrightness as SystemSyncIcon,
	CalendarMonth as CalendarIcon,
	PaidOutlined as CurrencyIcon,
	PaletteOutlined as AppearanceIcon,
	PublicOutlined as RegionalIcon,
	VisibilityOutlined as PreviewIcon,
	TranslateOutlined as LanguageIcon,
	AccessTimeOutlined as TimezoneIcon,
	CheckCircleRounded as CheckIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material';
import { useColorMode } from '../../theme/ThemeContext';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { updateProfile } from '../../store/slices/authSlice';
import { useSettingsContext } from '../../context/SettingsContext';
import useToast from '../../hooks/useToast';
import { getWorldCurrencies, formatMoney } from '../../utils/currency';
import { BROWSER_TIMEZONE, getTimezoneOptions } from '../../utils/timezone';

type ThemeOption = 'dark' | 'light' | 'system';

interface SectionHeaderProps {
	icon: React.ReactNode;
	title: string;
	subtitle?: string;
	color?: string;
	isDark: boolean;
	textColor: string;
	labelColor: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ icon, title, subtitle, color = '#8B7CF6', isDark, textColor, labelColor }) => (
	<Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2.5 }}>
		<Box sx={{ bgcolor: alpha(color, isDark ? 0.15 : 0.1), color, p: 0.7, borderRadius: '8px', display: 'flex' }}>
			{icon}
		</Box>
		<Box>
			<Typography variant="body2" sx={{ fontWeight: 700, color: textColor, lineHeight: 1.3 }}>
				{title}
			</Typography>
			{subtitle && (
				<Typography variant="caption" sx={{ color: labelColor }}>
					{subtitle}
				</Typography>
			)}
		</Box>
	</Stack>
);

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

	const timezoneOptions = useMemo(() => getTimezoneOptions(), []);

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
	const textColor = isDark ? '#F4F5F7' : '#1e293b';

	const fieldSx = {
		'& .MuiOutlinedInput-root': {
			bgcolor: isDark ? '#1a1e28' : '#f8fafc',
			borderRadius: 2,
			'& fieldset': {
				borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
			},
			'&.Mui-focused fieldset': {
				borderColor: '#8B7CF6',
			},
		},
		'& .MuiInputBase-input': {
			color: textColor,
			fontWeight: 500,
		},
	};

	const fieldLabelSx = {
		fontWeight: 700,
		color: labelColor,
		display: 'block' as const,
		mb: 0.75,
		fontSize: '0.75rem',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.04em',
	};

	const themeOptions: { key: ThemeOption; label: string; description: string; icon: React.ReactElement; accent: string }[] = [
		{
			key: 'dark',
			label: 'Dark Theme',
			description: 'Maximum focus for deep work sessions.',
			icon: <DarkModeIcon sx={{ fontSize: '1.4rem' }} />,
			accent: '#8B7CF6',
		},
		{
			key: 'light',
			label: 'Light Theme',
			description: 'High clarity for daytime environments.',
			icon: <LightModeIcon sx={{ fontSize: '1.4rem' }} />,
			accent: '#F5A623',
		},
		{
			key: 'system',
			label: 'System Sync',
			description: 'Follow OS level lighting settings.',
			icon: <SystemSyncIcon sx={{ fontSize: '1.4rem' }} />,
			accent: '#4EA8FF',
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
					color: textColor,
					mb: 0.5,
				}}
			>
				Environment Preferences
			</Typography>
			<Typography variant="body2" sx={{ color: labelColor, mb: 4 }}>
				Customize your workspace appearance and regional parameters.
			</Typography>

			<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, alignItems: 'start', mb: 3 }}>
			{/* Theme Selector */}
			<Box
				sx={{
					bgcolor: cardBg,
					border: `1px solid ${cardBorder}`,
					borderRadius: 4,
					boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.25)' : '0 8px 32px rgba(15,23,42,0.06)',
					p: 3,
				}}
			>
				<SectionHeader icon={<AppearanceIcon sx={{ fontSize: 16 }} />} title="Appearance" subtitle="Choose how Gravit looks on this device" isDark={isDark} textColor={textColor} labelColor={labelColor} />
				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
					{themeOptions.map((opt) => {
						const isSelected = selectedTheme === opt.key;
						return (
							<Box
								key={opt.key}
								onClick={() => setSelectedTheme(opt.key)}
								sx={{
									flex: 1,
									p: 2.5,
									bgcolor: isSelected ? alpha(opt.accent, isDark ? 0.12 : 0.07) : (isDark ? 'rgba(255,255,255,0.02)' : '#fafbfc'),
									border: '1px solid',
									borderColor: isSelected ? alpha(opt.accent, 0.5) : cardBorder,
									borderRadius: 3,
									cursor: 'pointer',
									position: 'relative',
									transition: 'transform 0.18s ease, border-color 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease',
									boxShadow: isSelected ? `0 6px 20px ${alpha(opt.accent, isDark ? 0.2 : 0.14)}` : 'none',
									'&:hover': {
										transform: 'translateY(-2px)',
										borderColor: alpha(opt.accent, 0.5),
										bgcolor: isSelected ? alpha(opt.accent, isDark ? 0.12 : 0.07) : alpha(opt.accent, isDark ? 0.06 : 0.04),
									},
								}}
							>
								{isSelected && (
									<CheckIcon
										sx={{
											position: 'absolute',
											top: 10,
											right: 10,
											fontSize: 18,
											color: opt.accent,
										}}
									/>
								)}
								<Box
									sx={{
										width: 40,
										height: 40,
										borderRadius: '10px',
										bgcolor: alpha(opt.accent, isDark ? 0.16 : 0.1),
										color: opt.accent,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										mb: 1.5,
									}}
								>
									{opt.icon}
								</Box>
								<Typography
									variant="body2"
									sx={{ fontWeight: 700, color: textColor, mb: 0.5 }}
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
			</Box>

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
				<SectionHeader icon={<RegionalIcon sx={{ fontSize: 16 }} />} title="Regional Settings" subtitle="Language, timezone, and currency used across your account" color="#4EA8FF" isDark={isDark} textColor={textColor} labelColor={labelColor} />
				<Stack spacing={2.5}>
					<Box sx={{ flex: 1 }}>
						<Typography variant="caption" sx={fieldLabelSx}>Interface Language</Typography>
						<TextField
							fullWidth
							size="small"
							value={language}
							disabled
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<LanguageIcon sx={{ fontSize: 18, color: labelColor }} />
									</InputAdornment>
								),
							}}
							sx={fieldSx}
						/>
					</Box>
					<Box sx={{ flex: 1 }}>
						<Typography variant="caption" sx={fieldLabelSx}>Timezone</Typography>
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
									InputProps={{
										...params.InputProps,
										startAdornment: (
											<InputAdornment position="start">
												<TimezoneIcon sx={{ fontSize: 18, color: labelColor }} />
											</InputAdornment>
										),
									}}
									sx={fieldSx}
								/>
							)}
						/>
					</Box>
					<Box sx={{ flex: 1 }}>
						<Typography variant="caption" sx={fieldLabelSx}>Preferred Display Currency</Typography>
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
									InputProps={{
										...params.InputProps,
										startAdornment: (
											<InputAdornment position="start">
												<CurrencyIcon sx={{ fontSize: 18, color: labelColor }} />
											</InputAdornment>
										),
									}}
									sx={fieldSx}
								/>
							)}
						/>
					</Box>
				</Stack>
			</Box>
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
				<SectionHeader icon={<PreviewIcon sx={{ fontSize: 16 }} />} title="Live Preview" subtitle="How these choices render elsewhere in the app" color="#10b981" isDark={isDark} textColor={textColor} labelColor={labelColor} />
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
