import React from 'react';
import { Box, Typography, Stack, TextField, InputAdornment, alpha } from '@mui/material';
import {
	WorkOutline as DesignationIcon,
	BadgeOutlined as PersonalInfoIcon,
} from '@mui/icons-material';
import { MuiTelInput, type MuiTelInputCountry } from 'mui-tel-input';
import { DatePicker } from '../../common/form';

interface PersonalInfoFormProps {
	designationName: string | null;
	originalEmail: string;
	phone: string;
	handlePhoneChange: (value: string, info: any) => void;
	countryCode: string;
	dob: string | null;
	setDob: (v: string | null) => void;
	cardBg: string;
	cardBorder: string;
	isDark: boolean;
	iconColor: string;
	labelColor: string;
	TODAY: string;
	fieldSx: (readOnly?: boolean) => any;
	fieldLabelSx: any;
}

export const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
	designationName,
	originalEmail,
	phone,
	handlePhoneChange,
	countryCode,
	dob,
	setDob,
	cardBg,
	cardBorder,
	isDark,
	iconColor,
	TODAY,
	fieldSx,
	fieldLabelSx,
}) => {
	const SectionHeader = ({ icon, title, color = '#8B7CF6' }: { icon: React.ReactNode; title: string; color?: string }) => (
		<Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2.5 }}>
			<Box sx={{ bgcolor: alpha(color, isDark ? 0.15 : 0.1), color, p: 0.7, borderRadius: '8px', display: 'flex' }}>
				{icon}
			</Box>
			<Typography variant="body2" sx={{ fontWeight: 700, color: isDark ? '#F4F5F7' : '#1e293b' }}>
				{title}
			</Typography>
		</Stack>
	);

	return (
		<Box
			sx={{
				flex: 1.2,
				bgcolor: cardBg,
				border: `1px solid ${cardBorder}`,
				borderRadius: 4,
				boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.25)' : '0 8px 32px rgba(15,23,42,0.06)',
				p: { xs: 3, sm: 4 },
			}}
		>
			<SectionHeader icon={<PersonalInfoIcon sx={{ fontSize: 16 }} />} title="Personal Information" />

			<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
				<Box>
					<Typography variant="caption" sx={fieldLabelSx}>Designation (Read-only)</Typography>
					<TextField
						fullWidth
						size="small"
						value={designationName || '—'}
						disabled
						InputProps={{ startAdornment: <InputAdornment position="start"><DesignationIcon sx={{ fontSize: 18, color: iconColor }} /></InputAdornment> }}
						sx={fieldSx(true)}
					/>
				</Box>
				<Box>
					<Typography variant="caption" sx={fieldLabelSx}>Corporate Email (Read-only)</Typography>
					<TextField fullWidth size="small" value={originalEmail} disabled sx={fieldSx(true)} />
				</Box>
				<Box>
					<Typography variant="caption" sx={fieldLabelSx}>Phone Number</Typography>
					<MuiTelInput
						fullWidth
						size="small"
						value={phone}
						onChange={handlePhoneChange}
						defaultCountry={countryCode as MuiTelInputCountry}
						forceCallingCode
						sx={fieldSx()}
					/>
				</Box>
				<Box>
					<Typography variant="caption" sx={fieldLabelSx}>Date of Birth</Typography>
					<DatePicker
						label=""
						value={dob}
						onChange={(v) => setDob(v || null)}
						maxDate={TODAY}
						textFieldProps={{ sx: fieldSx() }}
					/>
				</Box>
			</Box>
		</Box>
	);
};

export default PersonalInfoForm;
