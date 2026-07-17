import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { useTheme } from '@mui/material';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { updateProfile } from '../../store/slices/authSlice';
import { fetchEmployeeByUserId } from '../../store/slices/hrSlice';
import { useSettingsContext } from '../../context/SettingsContext';
import useDateTime from '../../hooks/useDateTime';
import usePhoneValidation from '../../hooks/usePhoneValidation';
import useToast from '../../hooks/useToast';
import type { BillingAddress } from '../../models/auth';

// Profile Sub-components
import ProfileCard from './profile/ProfileCard';
import PaymentCycleCard from './profile/PaymentCycleCard';
import UpgradeToTeamCard from './profile/UpgradeToTeamCard';
import PersonalInfoForm from './profile/PersonalInfoForm';
import BillingAddressForm from './profile/BillingAddressForm';

const MAX_AVATAR_BYTES = 1.5 * 1024 * 1024; // ~1.5MB raw; base64 stays under the backend's 2MB cap
const TODAY = new Date().toISOString().slice(0, 10);
const EMPTY_ADDRESS: BillingAddress = { line1: '', line2: '', city: '', state: '', postal_code: '', country: '' };

const ProfileTab: React.FC = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const user = useAppSelector((state) => state.auth.user);
	const { currentEmployee } = useAppSelector((state) => state.hr);
	const dispatch = useAppDispatch();
	const toast = useToast();
	const { markDirty, markClean, registerSaveHandler, registerDiscardHandler } = useSettingsContext();
	const { formatDate } = useDateTime();
	const { countryCode, setCountryCode, validatePhoneChange } = usePhoneValidation();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const originalFullName = user?.full_name || '';
	const originalPhone = user?.phone || '';
	const originalDob = user?.dob || null;
	const originalAvatar = user?.avatar || null;
	const originalEmail = user?.email || '';

	const originalBillingAddress: BillingAddress = useMemo(
		() => ({ ...EMPTY_ADDRESS, ...(user?.billing_address || {}) }),
		[user?.billing_address]
	);
	const originalBillingReminder = user?.billing_reminder ?? false;

	const [fullName, setFullName] = useState(originalFullName);
	const [phone, setPhone] = useState(originalPhone);
	const [dob, setDob] = useState<string | null>(originalDob);
	const [avatar, setAvatar] = useState<string | null>(originalAvatar);
	const [avatarSaving, setAvatarSaving] = useState(false);
	const [billingAddress, setBillingAddress] = useState<BillingAddress>(originalBillingAddress);
	const [billingReminder, setBillingReminder] = useState(originalBillingReminder);
	const [reminderSaving, setReminderSaving] = useState(false);

	useEffect(() => {
		if (user?.id) {
			dispatch(fetchEmployeeByUserId(user.id));
		}
	}, [dispatch, user?.id]);

	// The avatar and reminder toggle both save themselves immediately (see
	// below) rather than joining the batched Save/Discard flow, so they must
	// stay in sync with whatever the server actually has.
	useEffect(() => {
		setAvatar(originalAvatar);
	}, [originalAvatar]);

	useEffect(() => {
		setBillingReminder(originalBillingReminder);
	}, [originalBillingReminder]);

	const setAddressField = (field: keyof BillingAddress) => (e: React.ChangeEvent<HTMLInputElement>) => {
		setBillingAddress((prev) => ({ ...prev, [field]: e.target.value }));
	};

	// Track dirty fields
	useEffect(() => {
		fullName !== originalFullName ? markDirty('profile.fullName') : markClean('profile.fullName');
	}, [fullName, originalFullName, markDirty, markClean]);

	useEffect(() => {
		phone !== originalPhone ? markDirty('profile.phone') : markClean('profile.phone');
	}, [phone, originalPhone, markDirty, markClean]);

	useEffect(() => {
		dob !== originalDob ? markDirty('profile.dob') : markClean('profile.dob');
	}, [dob, originalDob, markDirty, markClean]);

	useEffect(() => {
		JSON.stringify(billingAddress) !== JSON.stringify(originalBillingAddress)
			? markDirty('profile.billingAddress')
			: markClean('profile.billingAddress');
	}, [billingAddress, originalBillingAddress, markDirty, markClean]);

	// Register save & discard handlers
	const handleSave = useCallback(async () => {
		try {
			await dispatch(updateProfile({
				full_name: fullName || null,
				phone: phone || null,
				dob: dob || null,
				billing_address: billingAddress,
			})).unwrap();
			toast.success('Profile saved');
		} catch (err: any) {
			toast.error(err || 'Failed to save profile');
			throw err;
		}
	}, [dispatch, fullName, phone, dob, billingAddress, toast]);

	const handleDiscard = useCallback(() => {
		setFullName(originalFullName);
		setPhone(originalPhone);
		setDob(originalDob);
		setBillingAddress(originalBillingAddress);
	}, [originalFullName, originalPhone, originalDob, originalBillingAddress]);

	useEffect(() => {
		registerSaveHandler('profile', handleSave);
		registerDiscardHandler('profile', handleDiscard);
	}, [registerSaveHandler, registerDiscardHandler, handleSave, handleDiscard]);

	const handlePhoneChange = (value: string, info: any) => {
		if (!validatePhoneChange(info)) return;
		if (info.countryCode) setCountryCode(info.countryCode);
		setPhone(value);
	};

	const handleAvatarClick = () => fileInputRef.current?.click();

	const saveAvatar = async (nextAvatar: string | null) => {
		const previous = avatar;
		setAvatar(nextAvatar);
		setAvatarSaving(true);
		try {
			await dispatch(updateProfile({ avatar: nextAvatar })).unwrap();
			toast.success(nextAvatar ? 'Profile photo updated' : 'Profile photo removed');
		} catch (err: any) {
			setAvatar(previous);
			toast.error(err || 'Failed to save profile photo');
		} finally {
			setAvatarSaving(false);
		}
	};

	const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		e.target.value = '';
		if (!file) return;
		if (!file.type.startsWith('image/')) {
			toast.error('Please select an image file.');
			return;
		}
		if (file.size > MAX_AVATAR_BYTES) {
			toast.error('Image must be smaller than 1.5MB.');
			return;
		}
		const reader = new FileReader();
		reader.onload = () => saveAvatar(reader.result as string);
		reader.readAsDataURL(file);
	};

	const handleRemoveAvatar = () => saveAvatar(null);

	const handleReminderToggle = async (checked: boolean) => {
		setBillingReminder(checked);
		setReminderSaving(true);
		try {
			await dispatch(updateProfile({ billing_reminder: checked })).unwrap();
			toast.success(checked ? "You'll be reminded before renewal" : 'Renewal reminder turned off');
		} catch (err: any) {
			setBillingReminder(!checked);
			toast.error(err || 'Failed to save reminder preference');
		} finally {
			setReminderSaving(false);
		}
	};

	const userInitials = user
		? (user.full_name || user.username)
				.split(' ')
				.map((n: string) => n[0])
				.join('')
				.toUpperCase()
				.slice(0, 2)
		: 'U';

	const cardBg = isDark ? '#141822' : '#ffffff';
	const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
	const labelColor = isDark ? '#8B7CF6' : '#7C3AED';
	const mutedColor = isDark ? '#94A3B8' : '#64748b';
	const iconColor = isDark ? '#64748b' : '#94A3B8';

	const fieldSx = (readOnly?: boolean) => ({
		'& .MuiOutlinedInput-root': {
			bgcolor: readOnly ? (isDark ? '#1a1e28' : '#f1f5f9') : (isDark ? '#1a1e28' : '#f8fafc'),
			borderRadius: 2,
			'& fieldset': {
				borderColor: readOnly ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)') : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
			},
		},
		'& .MuiInputBase-input': {
			color: readOnly ? mutedColor : (isDark ? '#F4F5F7' : '#1e293b'),
			fontWeight: readOnly ? 500 : 600,
		},
	});

	const fieldLabelSx = { color: labelColor, fontWeight: 700, display: 'block' as const, mb: 0.75, fontSize: '0.75rem' };

	const org = user?.organization;
	const isIndividualAccount = org?.others?.account_type === 'individual';
	const isTrial = (org?.subscription_status || 'trial').toLowerCase() === 'trial';
	const cycleDate = org?.trial_expires_at;
	const cycleDaysLeft = cycleDate ? Math.ceil((new Date(cycleDate).getTime() - Date.now()) / 86_400_000) : null;
	const planLabel = org?.plan?.name || org?.plan_name || (org?.plan?.tier ? org.plan.tier.charAt(0).toUpperCase() + org.plan.tier.slice(1) : 'Free');

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
				Profile Settings
			</Typography>
			<Typography variant="body2" sx={{ color: mutedColor, mb: 4 }}>
				Update your personal information and public profile identity.
			</Typography>

			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: { xs: '1fr', lg: '300px 1fr' },
					gap: 3,
					alignItems: 'start',
				}}
			>
				{/* Left column — identity + billing cycle at a glance */}
				<Stack spacing={3} sx={{ minWidth: 0 }}>
					<ProfileCard
						avatar={avatar}
						fullName={fullName}
						setFullName={setFullName}
						username={user?.username || ''}
						role={user?.role || ''}
						isVerified={user?.is_verified ?? false}
						employee={currentEmployee}
						avatarSaving={avatarSaving}
						handleAvatarClick={handleAvatarClick}
						handleRemoveAvatar={handleRemoveAvatar}
						fileInputRef={fileInputRef}
						handleAvatarChange={handleAvatarChange}
						userInitials={userInitials}
						cardBg={cardBg}
						cardBorder={cardBorder}
						mutedColor={mutedColor}
						isDark={isDark}
					/>
					<PaymentCycleCard
						cardBg={cardBg}
						cardBorder={cardBorder}
						isDark={isDark}
						mutedColor={mutedColor}
						iconColor={iconColor}
						planLabel={planLabel}
						cycleDate={cycleDate || null}
						isTrial={isTrial}
						cycleDaysLeft={cycleDaysLeft}
						formatDate={formatDate}
						billingReminder={billingReminder}
						reminderSaving={reminderSaving}
						handleReminderToggle={handleReminderToggle}
					/>
					{isIndividualAccount && (
						<UpgradeToTeamCard
							cardBg={cardBg}
							cardBorder={cardBorder}
							isDark={isDark}
							mutedColor={mutedColor}
							orgName={org?.name}
						/>
					)}
				</Stack>

				{/* Right column — Personal Information + Billing Address */}
				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', xl: '1.2fr 1fr' },
						gap: 3,
						alignItems: 'stretch',
					}}
				>
					<PersonalInfoForm
						designationName={currentEmployee?.designation_name || null}
						originalEmail={originalEmail}
						phone={phone}
						handlePhoneChange={handlePhoneChange}
						countryCode={countryCode}
						dob={dob}
						setDob={setDob}
						cardBg={cardBg}
						cardBorder={cardBorder}
						isDark={isDark}
						iconColor={iconColor}
						labelColor={labelColor}
						TODAY={TODAY}
						fieldSx={fieldSx}
						fieldLabelSx={fieldLabelSx}
					/>
					<BillingAddressForm
						billingAddress={billingAddress}
						setAddressField={setAddressField}
						cardBg={cardBg}
						cardBorder={cardBorder}
						isDark={isDark}
						mutedColor={mutedColor}
						fieldSx={fieldSx}
						fieldLabelSx={fieldLabelSx}
					/>
				</Box>
			</Box>
		</Box>
	);
};

export default ProfileTab;
