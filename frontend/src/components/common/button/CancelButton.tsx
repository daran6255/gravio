import React from 'react';
import { Button, type ButtonProps } from '@mui/material';

export type CancelButtonProps = ButtonProps;

/** Neutral dismiss action paired with `SubmitButton` in dialog/form actions. */
export const CancelButton: React.FC<CancelButtonProps> = ({ children = 'Cancel', sx, ...props }) => (
	<Button
		sx={[{ borderRadius: 3, textTransform: 'none' }, ...(Array.isArray(sx) ? sx : [sx ?? {}])]}
		{...props}
	>
		{children}
	</Button>
);

export default CancelButton;
