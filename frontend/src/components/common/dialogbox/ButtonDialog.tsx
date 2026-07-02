import React, { useState } from 'react';
import { Button } from '@mui/material';
import { Add } from '@mui/icons-material';
import BaseDialog from './BaseDialog';
import type { ButtonDialogProps } from './types';

const ButtonDialog: React.FC<ButtonDialogProps> = ({
	buttonLabel,
	buttonIcon = <Add />,
	buttonVariant = 'contained',
	title,
	subtitle,
	maxWidth = 'sm',
	showCloseButton,
	children,
}) => {
	const [open, setOpen] = useState(false);
	const close = () => setOpen(false);

	return (
		<>
			<Button
				variant={buttonVariant}
				size="small"
				startIcon={buttonIcon}
				onClick={() => setOpen(true)}
				sx={{
					borderRadius: '8px',
					textTransform: 'none',
					fontWeight: 700,
					py: 0.5,
					px: 1.5,
					fontSize: '0.75rem',
					...(buttonVariant === 'contained' && {
						background: 'linear-gradient(135deg, #8B7CF6 0%, #6052d9 100%)',
						boxShadow: '0 2px 8px rgba(139, 124, 246, 0.25)',
					}),
				}}
			>
				{buttonLabel}
			</Button>
			<BaseDialog
				open={open}
				onClose={close}
				title={title}
				subtitle={subtitle}
				maxWidth={maxWidth}
				showCloseButton={showCloseButton}
			>
				{children({ close })}
			</BaseDialog>
		</>
	);
};

export default ButtonDialog;
