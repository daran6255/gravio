import React from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Typography,
	IconButton,
	Box,
	alpha,
	useTheme,
	Fade
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import type { BaseDialogProps } from './types';

const BaseDialog: React.FC<BaseDialogProps> = ({
	open,
	onClose,
	title,
	subtitle,
	children,
	actions,
	maxWidth = 'sm',
	fullWidth = true,
	loading = false,
	showCloseButton = true
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	return (
		<Dialog
			open={open}
			onClose={loading ? undefined : onClose}
			maxWidth={maxWidth}
			fullWidth={fullWidth}
			TransitionComponent={Fade}
			TransitionProps={{ timeout: 400 }}
			PaperProps={{
				sx: {
					borderRadius: '20px',
					boxShadow: isDark
						? '0 24px 60px rgba(0, 0, 0, 0.55), 0 2px 8px rgba(0,0,0,0.4)'
						: '0 24px 60px rgba(15, 23, 42, 0.14), 0 2px 8px rgba(15,23,42,0.06)',
					border: '1px solid',
					borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
					backgroundImage: isDark
						? 'linear-gradient(135deg, rgba(20, 24, 34, 0.6) 0%, rgba(11, 13, 18, 0.4) 100%)'
						: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(248, 250, 252, 0.3) 100%)',
					overflow: 'hidden'
				}
			}}
		>
			<DialogTitle sx={{
				p: 3,
				pb: subtitle ? 1.5 : 2,
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'flex-start'
			}}>
				<Box sx={{ pr: 2 }}>
					<Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.01em', color: 'text.primary', lineHeight: 1.2 }}>
						{title}
					</Typography>
					{subtitle && (
						<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, mt: 0.5, display: 'block' }}>
							{subtitle}
						</Typography>
					)}
				</Box>
				{showCloseButton && (
					<IconButton
						onClick={onClose}
						disabled={loading}
						size="small"
						sx={{
							bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
							color: 'text.secondary',
							transition: 'all 0.2s',
							'&:hover': { color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.08) }
						}}
					>
						<CloseIcon fontSize="small" />
					</IconButton>
				)}
			</DialogTitle>

			<DialogContent sx={{ p: 3, py: 1 }}>
				<Box sx={{ py: 2 }}>
					{children}
				</Box>
			</DialogContent>

			{actions && (
				<DialogActions sx={{
					p: 3,
					pt: 1.5,
					borderTop: '1px solid',
					borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'
				}}>
					{actions}
				</DialogActions>
			)}
		</Dialog>
	);
};

export default BaseDialog;
