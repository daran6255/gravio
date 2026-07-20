import React from 'react';
import { Button, alpha, type ButtonProps } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

export interface AddButtonProps extends ButtonProps {
	/** Hides the leading "+" icon, for labels that already imply the action. */
	hideIcon?: boolean;
}

/**
 * Primary "create" call-to-action -- the gradient-diagonal, glow-shadow button used
 * across the app for actions like "New Project", "Add Row", "Apply Leave". Renders a
 * `+` icon by default; pass `startIcon` to override it or `hideIcon` to drop it.
 */
export const AddButton: React.FC<AddButtonProps> = ({ hideIcon, startIcon, sx, children, ...props }) => (
	<Button
		variant="contained"
		startIcon={hideIcon ? undefined : (startIcon ?? <AddIcon />)}
		sx={[
			(theme) => ({
				borderRadius: '10px',
				px: 3,
				py: 1,
				fontWeight: 700,
				textTransform: 'none',
				color: '#fff',
				background: theme.gradients.brandDiagonal,
				boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.4)}`,
				border: 'none',
				transition: 'all 0.2s ease',
				'&:hover': {
					background: theme.gradients.brandDiagonalHover,
					boxShadow: `0 6px 20px 0 ${alpha(theme.palette.primary.main, 0.6)}`,
					transform: 'translateY(-1px)'
				},
				'&.Mui-disabled': {
					background: 'none'
				}
			}),
			...(Array.isArray(sx) ? sx : [sx ?? {}])
		]}
		{...props}
	>
		{children}
	</Button>
);

export default AddButton;
