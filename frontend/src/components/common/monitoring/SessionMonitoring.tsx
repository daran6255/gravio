import React from 'react';
import { 
	Snackbar, 
	Alert, 
	Button, 
	alpha,
	useTheme,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Typography,
	Box
} from '@mui/material';
import { 
	Timer as TimerIcon, 
	Warning as WarningIcon 
} from '@mui/icons-material';

interface SessionMonitoringProps {
	showStartReminder: boolean;
	showInactivityAlert: boolean;
	showTimeRunningAlert: boolean;
	onStart: () => void;
	onResume: () => void;
	onCloseInactivity: () => void;
}

/**
 * SessionMonitoring Component.
 * Encapsulates enterprise-grade session reminders and inactivity alerts.
 * Features brand-aligned colors (Enterprise Brand Orange) and glassmorphism aesthetics.
 */
const SessionMonitoring: React.FC<SessionMonitoringProps> = ({
	showStartReminder,
	showInactivityAlert,
	showTimeRunningAlert,
	onStart,
	onResume,
	onCloseInactivity
}) => {
	const theme = useTheme();

	return (
		<>
			{/* Time Running Warning (2 Minutes Inactivity) */}
			<Snackbar 
				open={showTimeRunningAlert} 
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
				sx={{ mt: 12 }}
			>
				<Alert 
					severity="info" 
					variant="standard"
					icon={<TimerIcon sx={{ color: 'primary.main' }} />}
					sx={{ 
						borderRadius: '4px',
						border: '1px solid',
						borderColor: 'primary.light',
						bgcolor: 'background.paper',
						color: 'text.primary',
						fontWeight: 600,
						boxShadow: theme.shadows[4],
						'& .MuiAlert-message': {
							fontSize: '0.875rem'
						}
					}}
				>
					Reminder: The interview timer is still running.
				</Alert>
			</Snackbar>

			{/* Start Reminder Prompt */}
			<Snackbar 
				open={showStartReminder} 
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
				sx={{ mt: 12 }}
			>
				<Alert 
					severity="info" 
					icon={<TimerIcon sx={{ color: 'primary.main' }} />}
					action={
						<Button 
							variant="contained" 
							size="small" 
							onClick={onStart} 
							sx={{ 
								bgcolor: 'primary.main',
								color: 'white',
								fontWeight: 800,
								px: 2,
								'&:hover': {
									bgcolor: 'primary.dark',
								}
							}}
						>
							START NOW
						</Button>
					}
					sx={{ 
						borderRadius: '4px',
						border: '1px solid',
						borderColor: 'primary.light',
						bgcolor: 'background.paper',
						color: 'text.primary',
						boxShadow: theme.shadows[8],
						fontWeight: 600,
						py: 1,
						px: 2,
						'& .MuiAlert-icon': { 
							animation: 'pulse 2s infinite',
							opacity: 1
						},
						'& .MuiAlert-message': {
							fontSize: '0.95rem',
							letterSpacing: '-0.01em'
						}
					}}
				>
					You have started filling the form. Please start the stopwatch to track interview duration.
				</Alert>
			</Snackbar>

			{/* Inactivity Alert Modal (3 Minutes Inactivity) */}
			<Dialog
				open={showInactivityAlert}
				disableEscapeKeyDown
				onClose={(_, reason) => {
					if (reason === 'backdropClick') return;
					onCloseInactivity();
				}}
				PaperProps={{
					sx: {
						borderRadius: 2,
						border: '2px solid',
						borderColor: 'error.light',
						p: 1
					}
				}}
			>
				<DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
					<WarningIcon color="error" />
					<Typography variant="h6" sx={{ fontWeight: 800, color: 'error.main' }}>
						Session Paused Due to Inactivity
					</Typography>
				</DialogTitle>
				<DialogContent>
					<Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
						You have been inactive for 3 minutes. The interview timer has been paused automatically to ensure accurate session tracking.
					</Typography>
					<Box sx={{ 
						mt: 2, 
						p: 2, 
						bgcolor: alpha(theme.palette.error.main, 0.05), 
						borderRadius: 1, 
						border: '1px dashed', 
						borderColor: 'error.main',
						textAlign: 'center'
					}}>
						<Typography variant="caption" sx={{ color: 'error.main', fontWeight: 900, letterSpacing: '0.05em' }}>
							SYSTEM STATUS: TIMER SUSPENDED
						</Typography>
					</Box>
				</DialogContent>
				<DialogActions sx={{ p: 2.5, pt: 1 }}>
					<Button 
						fullWidth
						variant="contained" 
						color="error"
						size="large" 
						onClick={onResume} 
						sx={{ 
							fontWeight: 800, 
							py: 1.5,
							boxShadow: theme.shadows[4],
							'&:hover': {
								boxShadow: theme.shadows[8]
							}
						}}
					>
						STILL HERE (RESUME SESSION)
					</Button>
				</DialogActions>
			</Dialog>

			<style>
				{`
					@keyframes pulse {
						0% { opacity: 1; transform: scale(1); }
						50% { opacity: 0.5; transform: scale(1.2); }
						100% { opacity: 1; transform: scale(1); }
					}
				`}
			</style>
		</>
	);
};

export default SessionMonitoring;
