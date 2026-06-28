import { Tooltip, tooltipClasses } from '@mui/material';
import type { TooltipProps } from '@mui/material';
import { styled } from '@mui/material/styles';

export const PremiumTooltip = styled(({ className, ...props }: TooltipProps) => (
	<Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
	[`& .${tooltipClasses.tooltip}`]: {
		backgroundColor: theme.palette.mode === 'dark' ? '#111b27' : '#ffffff',
		color: theme.palette.text.primary,
		boxShadow: theme.palette.mode === 'dark'
			? '0px 8px 24px rgba(0, 0, 0, 0.4), inset 0px 0px 0px 1px rgba(255, 255, 255, 0.08)'
			: '0px 8px 24px rgba(139, 124, 246, 0.08), inset 0px 0px 0px 1px rgba(0, 0, 0, 0.08)',
		padding: '10px 14px',
		borderRadius: '8px',
		fontSize: '0.78rem',
		fontWeight: 500,
		lineHeight: 1.4,
		maxWidth: 260,
	},
	[`& .${tooltipClasses.arrow}`]: {
		color: theme.palette.mode === 'dark' ? '#111b27' : '#ffffff',
	},
}));

export default PremiumTooltip;
