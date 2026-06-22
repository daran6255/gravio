import React from 'react';
import {
	Box,
	Button,
	Typography,
	useTheme,
	alpha,
	CircularProgress
} from '@mui/material';
import { NavigateBefore, NavigateNext, Save, Delete as DeleteIcon } from '@mui/icons-material';

interface EnterpriseFormFooterProps {
	activeStep: number;
	totalSteps: number;
	onBack: () => void;
	onNext: () => void;
	onSave: () => void;
	onCancel: () => void;
	isSubmitting?: boolean;
	saveDisabled?: boolean;
	saveButtonText?: string;
	mode: 'create' | 'edit' | 'view';
	onDelete?: () => void;
}

/**
 * Standard Footer for EnterpriseForm.
 * Features theme-synced navigation and professional console interactions.
 */
const EnterpriseFormFooter: React.FC<EnterpriseFormFooterProps> = ({
	activeStep,
	totalSteps,
	onBack,
	onNext,
	onSave,
	onCancel,
	isSubmitting = false,
	saveDisabled = false,
	saveButtonText = 'Save Changes',
	mode,
	onDelete
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const isLastStep = activeStep === totalSteps - 1;

	return (
		<Box sx={{
			p: { xs: 2, md: 2.5 },
			px: { xs: 3, md: 4 },
			borderTop: '1px solid',
			borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
			bgcolor: alpha(theme.palette.background.paper, 0.95),
			backdropFilter: 'blur(8px)',
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'center',
			position: 'sticky',
			bottom: 0,
			zIndex: 10
		}}>
			<Box sx={{ display: 'flex', gap: 1.5 }}>
				<Button
					variant="outlined"
					onClick={onCancel}
					sx={{
						textTransform: 'none',
						fontWeight: 600,
						px: 3,
						borderRadius: '10px',
						color: theme.palette.text.secondary,
						borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
						'&:hover': {
							borderColor: theme.palette.text.primary,
							bgcolor: alpha(theme.palette.text.primary, 0.05)
						}
					}}
				>
					{mode === 'view' ? 'Close' : 'Cancel'}
				</Button>

				{mode === 'edit' && onDelete && (
					<Button
						variant="outlined"
						color="error"
						startIcon={<DeleteIcon />}
						onClick={onDelete}
						sx={{
							textTransform: 'none',
							fontWeight: 600,
							px: 2,
							borderRadius: '10px',
							borderColor: alpha(theme.palette.error.main, 0.3),
							'&:hover': {
								borderColor: theme.palette.error.main,
								bgcolor: alpha(theme.palette.error.main, 0.06)
							}
						}}
					>
						Delete
					</Button>
				)}
			</Box>

			<Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
				{totalSteps > 1 && (
					<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.02em' }}>
						STEP {activeStep + 1} OF {totalSteps}
					</Typography>
				)}

				<Box sx={{ display: 'flex', gap: 1.5 }}>
					{activeStep > 0 && (
						<Button
							variant="outlined"
							startIcon={<NavigateBefore />}
							onClick={onBack}
							sx={{
								textTransform: 'none',
								fontWeight: 600,
								borderRadius: '10px',
								px: 2,
								color: theme.palette.text.primary,
								borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
							}}
						>
							Back
						</Button>
					)}

					{mode !== 'view' && (
						isLastStep ? (
							<Button
								variant="contained"
								startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <Save />}
								onClick={onSave}
								disabled={isSubmitting || saveDisabled}
								sx={{
									textTransform: 'none',
									fontWeight: 700,
									borderRadius: '10px',
									px: 4,
									color: '#fff',
									background: 'linear-gradient(90deg, #8B7CF6 0%, #4EA8FF 100%)',
									boxShadow: 'none',
									'&:hover': {
										boxShadow: '0 4px 12px rgba(139,124,246,0.3)'
									},
									'&.Mui-disabled': {
										background: theme.palette.action.disabledBackground,
										color: alpha('#fff', 0.8)
									}
								}}
							>
								{isSubmitting ? 'Saving...' : (mode === 'create' ? 'Create' : saveButtonText)}
							</Button>
						) : (
							<Button
								variant="contained"
								endIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <NavigateNext />}
								onClick={onNext}
								disabled={isSubmitting || saveDisabled}
								sx={{
									textTransform: 'none',
									fontWeight: 700,
									borderRadius: '10px',
									px: 3,
									color: '#fff',
									background: 'linear-gradient(90deg, #8B7CF6 0%, #4EA8FF 100%)',
									boxShadow: 'none',
									'&:hover': {
										boxShadow: '0 4px 12px rgba(139,124,246,0.3)'
									},
									'&.Mui-disabled': {
										background: theme.palette.action.disabledBackground,
										color: alpha('#fff', 0.8)
									}
								}}
							>
								{isSubmitting ? 'Processing...' : 'Next Step'}
							</Button>
						)
					)}
				</Box>
			</Box>
		</Box>
	);
};

export default EnterpriseFormFooter;
