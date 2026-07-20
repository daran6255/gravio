import React from 'react';
import { Button, CircularProgress, type ButtonProps } from '@mui/material';

export interface SubmitButtonProps extends ButtonProps {
	/** Swaps the label for a spinner and disables the button while a save/submit is in flight. */
	loading?: boolean;
}

/**
 * Primary confirm action for dialogs and forms -- Submit / Save / Create / Update.
 * Pairs with `CancelButton` in a dialog's `actions`.
 */
export const SubmitButton: React.FC<SubmitButtonProps> = ({ loading, disabled, children, sx, ...props }) => (
	<Button
		variant="contained"
		disabled={disabled || loading}
		sx={[
			{ borderRadius: 3, fontWeight: 700, textTransform: 'none' },
			...(Array.isArray(sx) ? sx : [sx ?? {}])
		]}
		{...props}
	>
		{loading ? <CircularProgress size={20} color="inherit" /> : children}
	</Button>
);

export default SubmitButton;
