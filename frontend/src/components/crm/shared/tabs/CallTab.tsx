import React from 'react';
import { Box, Stack, Typography, ToggleButtonGroup, ToggleButton, TextField, MenuItem, useTheme, alpha } from '@mui/material';
import { CallMade, CallReceived } from '@mui/icons-material';
import RichTextEditor from '../../../common/form/RichTextEditor';

interface CallTabProps {
	subject: string;
	setSubject: (val: string) => void;
	description: string;
	setDescription: (val: string) => void;
	direction: string;
	setDirection: (val: string) => void;
	outcome: string;
	setOutcome: (val: string) => void;
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

export const CallTab: React.FC<CallTabProps> = ({
	subject,
	setSubject,
	description,
	setDescription,
	direction,
	setDirection,
	outcome,
	setOutcome,
	compact,
	accentColor,
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

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
						<Typography sx={labelCaptionSx}>Direction</Typography>
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
							<ToggleButton value="Outbound"><CallMade sx={{ fontSize: 13 }} />Outbound</ToggleButton>
							<ToggleButton value="Inbound"><CallReceived sx={{ fontSize: 13 }} />Inbound</ToggleButton>
						</ToggleButtonGroup>
					</Box>

					<Box sx={{ flexGrow: 1, minWidth: 160 }}>
						<Typography sx={labelCaptionSx}>Call Outcome</Typography>
						<TextField
							select
							value={outcome}
							onChange={(e) => setOutcome(e.target.value)}
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
							<MenuItem value="Connected" sx={{ fontSize: '0.78rem', fontWeight: 600 }}>Connected</MenuItem>
							<MenuItem value="Busy" sx={{ fontSize: '0.78rem', fontWeight: 600 }}>Busy</MenuItem>
							<MenuItem value="No Answer" sx={{ fontSize: '0.78rem', fontWeight: 600 }}>No Answer</MenuItem>
							<MenuItem value="Left Voicemail" sx={{ fontSize: '0.78rem', fontWeight: 600 }}>Left Voicemail</MenuItem>
							<MenuItem value="Wrong Number" sx={{ fontSize: '0.78rem', fontWeight: 600 }}>Wrong Number</MenuItem>
						</TextField>
					</Box>
				</Stack>
			</Box>

			<Box sx={{ mb: 2 }}>
				<Typography sx={labelCaptionSx}>Subject / Purpose</Typography>
				<TextField
					placeholder="e.g. Discuss partnership proposal"
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

			<Typography sx={labelCaptionSx}>Notes</Typography>
			{compact ? (
				<TextField
					variant="outlined"
					placeholder="Write call notes or record a summary..."
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					fullWidth
					multiline
					minRows={3}
					sx={{
						mb: 0.5,
						'& .MuiOutlinedInput-root': {
							borderRadius: '10px',
							fontSize: '0.82rem',
							p: 1.25,
						}
					}}
				/>
			) : (
				<RichTextEditor
					value={description}
					onChange={setDescription}
					placeholder="Write call notes or record a summary..."
					minHeight={120}
					variant="simple"
				/>
			)}
		</Box>
	);
};

export default CallTab;
