import React from 'react';
import { Box, Typography, Switch, TextField, MenuItem, Fade } from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

interface LeaveSectionProps {
	isLeave: boolean;
	setIsLeave: (isLeave: boolean) => void;
	leaveType: string;
	onLeaveTypeChange: (type: string) => void;
	readOnly?: boolean;
	entryId?: string | null;
}

const LeaveTypes = [
	'Sick Leave',
	'Earned Leave',
	'Casual Leave',
	'Comp Off',
	'Other'
];

const LeaveSection: React.FC<LeaveSectionProps> = ({
	isLeave,
	setIsLeave,
	leaveType,
	onLeaveTypeChange,
	readOnly,
	entryId
}) => {
	return (
		<Box sx={{
			mb: 3,
			p: 2,
			bgcolor: isLeave ? '#fffbeb' : 'white',
			borderRadius: '8px',
			border: '1px solid',
			borderColor: isLeave ? '#fbbf24' : '#e5e7eb',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'space-between',
			flexWrap: 'wrap',
			gap: 2,
			transition: 'all 0.2s ease',
			boxShadow: isLeave ? '0 4px 6px -1px rgba(251,191,36,0.1)' : '0 1px 2px rgba(0,0,0,0.05)'
		}}>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
				<Box sx={{
					width: 36,
					height: 36,
					borderRadius: '50%',
					bgcolor: isLeave ? '#fbbf24' : '#f3f4f6',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					color: isLeave ? 'white' : '#9ca3af',
					transition: 'all 0.2s ease'
				}}>
					<WarningIcon fontSize="small" />
				</Box>
				<Box>
					<Typography sx={{ fontWeight: 700, color: '#111827', fontSize: '0.95rem' }}>
						{isLeave ? 'Date Marked as Leave' : 'Mark this day as Leave'}
					</Typography>
					<Typography variant="caption" color="text.secondary">
						{isLeave ? 'No activities will be logged for this date' : 'Toggle this if you were on leave today'}
					</Typography>
				</Box>
			</Box>

			<Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
				{isLeave && (
					<Fade in>
						<Box sx={{ width: 220 }}>
							<TextField
								select
								fullWidth
								size="small"
								label="Leave Type"
								value={leaveType}
								onChange={(e) => onLeaveTypeChange(e.target.value)}
								disabled={readOnly}
								required
								sx={{
									bgcolor: 'white',
									'& .MuiInputBase-root': { borderRadius: '6px' },
									'& .MuiInputLabel-root': { fontSize: '0.85rem' }
								}}
							>
								{LeaveTypes.map((type) => (
									<MenuItem key={type} value={type} sx={{ fontSize: '0.85rem' }}>
										{type}
									</MenuItem>
								))}
							</TextField>
						</Box>
					</Fade>
				)}
				<Switch
					checked={isLeave}
					onChange={(e) => setIsLeave(e.target.checked)}
					disabled={readOnly || !!entryId}
					color="warning"
				/>
			</Box>
		</Box>
	);
};

export default LeaveSection;
