import React from 'react';
import { Button, IconButton, Tooltip, type ButtonProps } from '@mui/material';
import { HelpOutline as HelpIcon } from '@mui/icons-material';

export interface HelpGuideButtonProps extends ButtonProps {
	/** Renders as a bordered icon-only button with a tooltip, for tight header spaces. */
	compact?: boolean;
}

/** Opens a module's Help Guide drawer -- the "Help Guide" trigger repeated across page headers. */
export const HelpGuideButton: React.FC<HelpGuideButtonProps> = ({
	compact,
	children = 'Help Guide',
	sx,
	onClick,
	disabled,
	...props
}) => {
	if (compact) {
		return (
			<Tooltip title={typeof children === 'string' ? children : 'Help Guide'}>
				<IconButton
					onClick={onClick}
					disabled={disabled}
					sx={[
						{ border: '1px solid', borderColor: 'divider', borderRadius: 3 },
						...(Array.isArray(sx) ? sx : [sx ?? {}])
					]}
				>
					<HelpIcon />
				</IconButton>
			</Tooltip>
		);
	}

	return (
		<Button
			variant="outlined"
			size="small"
			startIcon={<HelpIcon />}
			onClick={onClick}
			disabled={disabled}
			sx={[
				{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 },
				...(Array.isArray(sx) ? sx : [sx ?? {}])
			]}
			{...props}
		>
			{children}
		</Button>
	);
};

export default HelpGuideButton;
