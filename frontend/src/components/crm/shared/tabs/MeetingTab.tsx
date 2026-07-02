import React from 'react';
import { Box, Stack, Typography, ToggleButtonGroup, ToggleButton, TextField, MenuItem, useTheme, alpha } from '@mui/material';
import { Videocam, LocationOn, Phone } from '@mui/icons-material';
import RichTextEditor from '../../../common/form/RichTextEditor';

interface MeetingTabProps {
	subject: string;
	setSubject: (val: string) => void;
	description: string;
	setDescription: (val: string) => void;
	direction: string;
	setDirection: (val: string) => void;
	outcome: string;
	setOutcome: (val: string) => void;
	setIsCompleted: (val: boolean) => void;
	compact: boolean;
	accentColor: string;
}

const labelCaptionSx = {
	display: 'block',
	mb: 0.75,
	fontSize: '0.65rem',
	fontWeight: 700,
	textTransform: 'uppercase' as const,
	letterSpacing: '0.06em',
	color: 'text.secondary',
};

export const MeetingTab: React.FC<MeetingTabProps> = ({
	subject,
	setSubject,
	description,
	setDescription,
	direction,
	setDirection,
	outcome,
	setOutcome,
	setIsCompleted,
	compact,
	accentColor,
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const handleOutcomeChange = (val: string) => {
		setOutcome(val);
		setIsCompleted(val !== 'Scheduled');
	};

	return (
		<Box sx={{ mb: 1.5 }}>
			<Box
				sx={{
					borderRadius: '12px',
					border: '1px solid',
					borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
					bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
					p: compact ? 1.5 : 2,
					mb: 2.5,
				}}
			>
				<Stack direction="row" spacing={compact ? 2 : 3} alignItems="center" flexWrap="wrap" useFlexGap>
					<Box sx={{ flexShrink: 0 }}>
						<Typography sx={labelCaptionSx}>Meeting Type</Typography>
						<ToggleButtonGroup
							value={direction}
							exclusive
							onChange={(_e, val) => val && setDirection(val)}
							size="small"
							sx={{
								height: 36,
								bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
								p: 0.5,
								borderRadius: '10px',
								'& .MuiToggleButtonGroup-grouped': {
									border: 'none !important',
									borderRadius: '8px !important',
									textTransform: 'none',
									px: compact ? 1.5 : 2,
									fontSize: '0.75rem',
									fontWeight: 700,
									color: 'text.secondary',
									transition: 'all 0.2s ease',
									gap: 0.5,
									'&.Mui-selected': {
										backgroundColor: isDark ? alpha(accentColor, 0.25) : accentColor,
										color: isDark ? '#d1c4e9' : '#ffffff',
										boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
									},
									'&:hover': {
										backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
									}
								}
							}}
						>
							<ToggleButton value="Online"><Videocam sx={{ fontSize: 13 }} />Online</ToggleButton>
							<ToggleButton value="In-Person"><LocationOn sx={{ fontSize: 13 }} />In-Person</ToggleButton>
							<ToggleButton value="Phone"><Phone sx={{ fontSize: 13 }} />Phone</ToggleButton>
						</ToggleButtonGroup>
					</Box>

					<Box sx={{ flexGrow: 1, minWidth: 160 }}>
						<Typography sx={labelCaptionSx}>Meeting Status</Typography>
						<TextField
							select
							value={outcome}
							onChange={(e) => handleOutcomeChange(e.target.value)}
							size="small"
							fullWidth
							sx={{
								'& .MuiOutlinedInput-root': {
									borderRadius: '10px',
									height: 36,
									fontSize: '0.78rem',
									bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff',
									fontWeight: 600,
									'& fieldset': {
										borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
									},
									'&:hover fieldset': {
										borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
									},
									'&.Mui-focused fieldset': {
										borderColor: accentColor,
										borderWidth: '1.5px',
									},
								}
							}}
						>
							<MenuItem value="Scheduled" sx={{ fontSize: '0.78rem', fontWeight: 600 }}>Scheduled</MenuItem>
							<MenuItem value="Completed" sx={{ fontSize: '0.78rem', fontWeight: 600 }}>Completed</MenuItem>
							<MenuItem value="No Show" sx={{ fontSize: '0.78rem', fontWeight: 600 }}>No Show</MenuItem>
							<MenuItem value="Canceled" sx={{ fontSize: '0.78rem', fontWeight: 600 }}>Canceled</MenuItem>
						</TextField>
					</Box>
				</Stack>
			</Box>

			<Box sx={{ mb: 2 }}>
				<Typography sx={labelCaptionSx}>Subject / Purpose</Typography>
				<TextField
					placeholder="e.g. Sync-up with candidate"
					value={subject}
					onChange={(e) => setSubject(e.target.value)}
					fullWidth
					size="small"
					sx={{
						'& .MuiOutlinedInput-root': {
							borderRadius: '10px',
							height: 38,
							fontSize: '0.8rem',
							bgcolor: isDark ? 'rgba(255,255,255,0.01)' : '#ffffff',
							'& fieldset': {
								borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
							},
							'&:hover fieldset': {
								borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
							},
							'&.Mui-focused fieldset': {
								borderColor: accentColor,
								borderWidth: '1.5px',
							},
						}
					}}
				/>
			</Box>

			<Typography sx={labelCaptionSx}>Agenda / Notes</Typography>
			<Box sx={{ mb: 0.5 }}>
				<RichTextEditor
					value={description}
					onChange={setDescription}
					placeholder="Write meeting agenda or notes..."
					minHeight={compact ? 90 : 120}
					variant="simple"
				/>
			</Box>
		</Box>
	);
};

export default MeetingTab;
