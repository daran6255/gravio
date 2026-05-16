import React from 'react';
import {
	Dialog,
	DialogContent,
	DialogActions,
	Button,
	Box,
	Alert,
	Fade,
	CircularProgress,
	Typography
} from '@mui/material';
import { useDSRSubmission } from '../hooks/useDSRSubmission';
import SubmissionForm from './SubmissionForm';
import DSRDialogHeader from './DSRDialogHeader';
import ReportingHeader from './ReportingHeader';
import PermissionRequestDialog from './PermissionRequestDialog';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

interface DSRSubmissionDialogProps {
	open: boolean;
	onClose: () => void;
	onSuccess?: () => void;
	entryId?: string | null;
	readOnly?: boolean;
}

const DSRSubmissionDialog: React.FC<DSRSubmissionDialogProps> = ({ 
	open, 
	onClose, 
	onSuccess,
	entryId, 
	readOnly = false 
}) => {
	const [permissionDialogOpen, setPermissionDialogOpen] = React.useState(false);

	const {
		projects,
		activitiesByProject,
		activityTypes,
		loading,
		reportDate,
		setReportDate,
		dateStatuses,
		items,
		isLeave,
		leaveType,
		totalHours,
		submitting,
		permissionError,
		isDateAllowed,
		isValid,
		isDirty,
		handleRowChange,
		addRow,
		removeRow,
		handleSaveDraft,
		handleSubmit
	} = useDSRSubmission({
		onSubmitted: onClose,
		onSuccess: onSuccess,
		externalEntryId: entryId
	});

	const getTitle = () => {
		if (readOnly) return 'View Timesheet';
		return entryId ? 'Edit Timesheet' : 'New Timesheet Submission';
	};

	const getSubtitle = () => {
		return readOnly ? 'Detailed review of activities' : 'Timesheet and activity logging';
	};

	return (
		<LocalizationProvider dateAdapter={AdapterDayjs}>
			<Dialog
				open={open}
				onClose={onClose}
				maxWidth="xl"
				fullWidth
				TransitionComponent={Fade}
				PaperProps={{
					sx: { borderRadius: '4px', minHeight: '80vh', overflow: 'hidden' }
				}}
			>
				<DSRDialogHeader
					title={getTitle()}
					subtitle={getSubtitle()}
					onClose={onClose}
				/>

				<DialogContent sx={{ p: 0, bgcolor: '#f9fafb' }}>
					<Box sx={{ p: 3 }}>
						{!readOnly && (permissionError || !isDateAllowed) && (
							<Fade in>
								<Alert
									severity={permissionError ? "error" : "warning"}
									action={
										!isDateAllowed && (
											<Button
												color="inherit"
												size="small"
												variant="outlined"
												onClick={() => setPermissionDialogOpen(true)}
												sx={{ fontWeight: 700, textTransform: 'none' }}
											>
												Request Permission
											</Button>
										)
									}
									sx={{
										mb: 3,
										borderRadius: '6px',
										border: '1px solid',
										bgcolor: permissionError ? '#fff5f5' : '#fff9f2',
										borderColor: permissionError ? '#feb2b2' : '#ffebcc',
										'& .MuiAlert-icon': { color: permissionError ? '#dc2626' : '#d97706' },
										'& .MuiAlert-action': { alignItems: 'center', pt: 0 }
									}}
								>
									{permissionError || "You do not have permission to submit for this past date. Please raise a request first."}
								</Alert>
							</Fade>
						)}

						<ReportingHeader
							reportDate={reportDate}
							onDateChange={setReportDate}
							dateStatuses={dateStatuses}
							entryId={entryId}
							readOnly={readOnly}
							totalHours={totalHours}
							isLeave={isLeave}
						/>

						{!isLeave ? (
							<Box sx={{
								bgcolor: 'white',
								borderRadius: '8px',
								border: '1px solid #e5e7eb',
								boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
								overflow: 'hidden'
							}}>
								<Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f3f4f6', bgcolor: '#f9fafb' }}>
									<Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.025em', fontSize: '0.75rem' }}>
										Activity Work Logs
									</Typography>
								</Box>
								<Box sx={{ p: 2 }}>
									<SubmissionForm
										items={items}
										projects={projects}
										activitiesByProject={activitiesByProject}
										activityTypes={activityTypes}
										loading={loading}
										onRowChange={handleRowChange}
										onAddRow={addRow}
										onRemoveRow={removeRow}
										showTitle={false}
										readOnly={readOnly}
										reportDate={reportDate}
									/>
								</Box>
							</Box>
						) : (
							<Fade in>
								<Box sx={{
									py: 10,
									textAlign: 'center',
									bgcolor: 'white',
									borderRadius: '8px',
									border: '1px dashed #fbbf24',
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									gap: 2
								}}>
									<Typography variant="h5" sx={{ color: '#d97706', fontWeight: 500 }}>
										{leaveType || 'Select Leave Type'}
									</Typography>
									<Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 400 }}>
										You have marked this day as on leave. No work activities will be processed for {dayjs(reportDate).format('DD-MMM-YYYY')}.
									</Typography>
								</Box>
							</Fade>
						)}
					</Box>
				</DialogContent>

				<DialogActions sx={{ 
					p: { xs: 2, sm: 3 }, 
					borderTop: '1px solid #e5e7eb', 
					bgcolor: '#f9fafb',
					flexDirection: { xs: 'column-reverse', sm: 'row' },
					gap: { xs: 1.5, sm: 2 }
				}}>
					<Button 
						onClick={onClose} 
						sx={{ 
							color: '#64748b', 
							textTransform: 'none', 
							fontWeight: 700,
							px: 3,
							'&:hover': { bgcolor: 'rgba(100,116,139,0.05)' },
							width: { xs: '100%', sm: 'auto' }
						}}
					>
						{readOnly ? 'Close' : 'Cancel'}
					</Button>
					
					<Box sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }} />

					{!readOnly && (
						<Box sx={{ 
							display: 'flex', 
							flexDirection: { xs: 'column', sm: 'row' }, 
							gap: { xs: 1.5, sm: 2 },
							width: { xs: '100%', sm: 'auto' }
						}}>
							<Button
								variant="outlined"
								onClick={handleSaveDraft}
								disabled={submitting || !isDateAllowed || !isValid || (!!entryId && !isDirty)}
								startIcon={submitting ? <CircularProgress size={16} /> : null}
								sx={{
									color: '#1e293b',
									borderColor: '#cbd5e1',
									bgcolor: 'white',
									px: 4,
									py: 1,
									textTransform: 'none',
									fontWeight: 700,
									boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
									'&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' },
									'&:disabled': { bgcolor: '#f1f5f9', borderColor: '#e2e8f0', color: '#94a3b8' },
									width: { xs: '100%', sm: 'auto' }
								}}
							>
								{submitting ? 'Saving...' : 'Save as Draft'}
							</Button>
							<Button
								variant="contained"
								onClick={handleSubmit}
								disabled={submitting || !isDateAllowed || !isValid || (!!entryId && !isDirty)}
								startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
								sx={{
									bgcolor: '#ec7211',
									color: 'white',
									px: 4,
									py: 1,
									textTransform: 'none',
									fontWeight: 700,
									boxShadow: '0 1px 3px rgba(236,114,17,0.3)',
									'&:hover': { bgcolor: '#eb5f07', boxShadow: '0 4px 6px rgba(236,114,17,0.4)' },
									'&:disabled': { bgcolor: '#fca5a5', color: 'rgba(255,255,255,0.7)' },
									width: { xs: '100%', sm: 'auto' }
								}}
							>
								{submitting ? 'Submitting...' : 'Submit Timesheet'}
							</Button>
						</Box>
					)}
				</DialogActions>

				<PermissionRequestDialog
					open={permissionDialogOpen}
					onClose={() => setPermissionDialogOpen(false)}
					initialDate={reportDate}
				/>
			</Dialog>
		</LocalizationProvider>
	);
};

export default DSRSubmissionDialog;
