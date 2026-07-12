import React from 'react';
import { Box, Typography, Stack, TextField, alpha } from '@mui/material';
import { LocationOnOutlined as BillingIcon } from '@mui/icons-material';
import type { BillingAddress } from '../../../models/auth';

interface BillingAddressFormProps {
	billingAddress: BillingAddress;
	setAddressField: (field: keyof BillingAddress) => (e: React.ChangeEvent<HTMLInputElement>) => void;
	cardBg: string;
	cardBorder: string;
	isDark: boolean;
	mutedColor: string;
	fieldSx: (readOnly?: boolean) => any;
	fieldLabelSx: any;
}

export const BillingAddressForm: React.FC<BillingAddressFormProps> = ({
	billingAddress,
	setAddressField,
	cardBg,
	cardBorder,
	isDark,
	mutedColor,
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
				flex: 1,
				bgcolor: cardBg,
				border: `1px solid ${cardBorder}`,
				borderRadius: 4,
				boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.25)' : '0 8px 32px rgba(15,23,42,0.06)',
				p: { xs: 3, sm: 3.5 },
			}}
		>
			<SectionHeader icon={<BillingIcon sx={{ fontSize: 16 }} />} title="Billing Address" />
			<Typography variant="caption" sx={{ color: mutedColor, display: 'block', mb: 2.5, mt: -1.5 }}>
				Used for invoices if you upgrade your plan.
			</Typography>
			<Stack spacing={2.5}>
				<Box>
					<Typography variant="caption" sx={fieldLabelSx}>Address Line 1</Typography>
					<TextField
						fullWidth
						size="small"
						value={billingAddress.line1 || ''}
						onChange={setAddressField('line1')}
						placeholder="Street address"
						sx={fieldSx()}
					/>
				</Box>
				<Box>
					<Typography variant="caption" sx={fieldLabelSx}>Address Line 2</Typography>
					<TextField
						fullWidth
						size="small"
						value={billingAddress.line2 || ''}
						onChange={setAddressField('line2')}
						placeholder="Apartment, suite, etc. (optional)"
						sx={fieldSx()}
					/>
				</Box>
				<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
					<Box>
						<Typography variant="caption" sx={fieldLabelSx}>City</Typography>
						<TextField
							fullWidth
							size="small"
							value={billingAddress.city || ''}
							onChange={setAddressField('city')}
							sx={fieldSx()}
						/>
					</Box>
					<Box>
						<Typography variant="caption" sx={fieldLabelSx}>State / Province</Typography>
						<TextField
							fullWidth
							size="small"
							value={billingAddress.state || ''}
							onChange={setAddressField('state')}
							sx={fieldSx()}
						/>
					</Box>
				</Box>
				<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
					<Box>
						<Typography variant="caption" sx={fieldLabelSx}>Postal Code</Typography>
						<TextField
							fullWidth
							size="small"
							value={billingAddress.postal_code || ''}
							onChange={setAddressField('postal_code')}
							sx={fieldSx()}
						/>
					</Box>
					<Box>
						<Typography variant="caption" sx={fieldLabelSx}>Country</Typography>
						<TextField
							fullWidth
							size="small"
							value={billingAddress.country || ''}
							onChange={setAddressField('country')}
							sx={fieldSx()}
						/>
					</Box>
				</Box>
			</Stack>
		</Box>
	);
};

export default BillingAddressForm;
