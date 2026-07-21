import React from 'react';
import { Box, Typography, Stack, alpha } from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import PremiumTooltip from '../common/PremiumTooltip';
import { useBookingCardStyles } from './bookingCardStyles';

interface SectionHeaderProps {
	icon: React.ReactNode;
	title: string;
	/** Short plain-language explanation of what this card controls — shown as an
	 * info icon + tooltip so the purpose is never a mystery, without cluttering
	 * the card with a paragraph of copy. */
	helpText?: string;
	color?: string;
	action?: React.ReactNode;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ icon, title, helpText, color = '#8B7CF6', action }) => {
	const { isDark } = useBookingCardStyles();

	return (
		<Stack direction="row" spacing={1.25} alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
			<Stack direction="row" spacing={1.25} alignItems="center">
				<Box sx={{ bgcolor: alpha(color, isDark ? 0.15 : 0.1), color, p: 0.7, borderRadius: '10px', display: 'flex' }}>
					{icon}
				</Box>
				<Stack direction="row" spacing={0.5} alignItems="center">
					<Typography
						variant="body2"
						sx={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: isDark ? '#F4F5F7' : '#1e293b' }}
					>
						{title}
					</Typography>
					{helpText && (
						<PremiumTooltip title={helpText} arrow placement="top">
							<HelpOutline sx={{ fontSize: 14, color: 'text.secondary', cursor: 'help', opacity: 0.7, '&:hover': { opacity: 1, color: color } }} />
						</PremiumTooltip>
					)}
				</Stack>
			</Stack>
			{action}
		</Stack>
	);
};

export default SectionHeader;
