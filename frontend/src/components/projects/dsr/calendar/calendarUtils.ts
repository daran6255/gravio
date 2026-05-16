import { alpha } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import { DSRStatusValues } from '../../../../models/dsr';

export interface CalendarStatusTheme {
	bg: string;
	color: string;
	border: string;
	label: string;
}

export const getStatusTheme = (theme: Theme): Record<string, CalendarStatusTheme> => ({
	[DSRStatusValues.APPROVED]: {
		bg: alpha(theme.palette.success.main, 0.1),
		color: theme.palette.success.dark || theme.palette.success.main,
		border: alpha(theme.palette.success.main, 0.3),
		label: 'Approved'
	},
	[DSRStatusValues.SUBMITTED]: {
		bg: alpha(theme.palette.info.main, 0.1),
		color: theme.palette.info.dark || theme.palette.info.main,
		border: alpha(theme.palette.info.main, 0.3),
		label: 'Submitted'
	},
	[DSRStatusValues.REJECTED]: {
		bg: alpha(theme.palette.error.main, 0.1),
		color: theme.palette.error.dark || theme.palette.error.main,
		border: alpha(theme.palette.error.main, 0.3),
		label: 'Revoked (Action Needed)'
	},
	[DSRStatusValues.DRAFT]: {
		bg: alpha(theme.palette.text.secondary, 0.05),
		color: theme.palette.text.secondary,
		border: alpha(theme.palette.text.secondary, 0.1),
		label: 'In Draft'
	},
	leave: {
		bg: alpha(theme.palette.primary.main, 0.1),
		color: theme.palette.primary.main,
		border: alpha(theme.palette.primary.main, 0.3),
		label: 'Approved Leave'
	},
	holiday: {
		bg: alpha(theme.palette.warning.main, 0.1),
		color: theme.palette.warning.dark || theme.palette.warning.main,
		border: alpha(theme.palette.warning.main, 0.3),
		label: 'Holiday / Sunday'
	},
	missing: {
		bg: alpha(theme.palette.text.disabled, 0.05),
		color: theme.palette.text.secondary,
		border: alpha(theme.palette.text.disabled, 0.1),
		label: 'Not Submitted'
	}
});
