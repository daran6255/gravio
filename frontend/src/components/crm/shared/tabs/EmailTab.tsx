import React from 'react';
import { Box, Stack, Typography, ToggleButtonGroup, ToggleButton, TextField, MenuItem, useTheme, alpha } from '@mui/material';
import { Send, Inbox } from '@mui/icons-material';
import RichTextEditor from '../../../common/form/RichTextEditor';

interface EmailTabProps {
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

export const EmailTab: React.FC<EmailTabProps> = ({
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

	const handleDirectionChange = (_e: any, val: string) => {
		if (val) {
			setDirection(val);
			setOutcome(val === 'Sent' ? 'Sent' : 'Received');
		}
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
						<Typography sx={labelCaptionSx}>Direction</Typography>
						<ToggleButtonGroup
							value={direction}
							exclusive
							onChange={handleDirectionChange}
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
							<ToggleButton value="Sent"><Send sx={{ fontSize: 13 }} />Sent</ToggleButton>
							<ToggleButton value="Received"><Inbox sx={{ fontSize: 13 }} />Received</ToggleButton>
						</ToggleButtonGroup>
					</Box>

					<Box sx={{ flexGrow: 1, minWidth: 160 }}>
						<Typography sx={labelCaptionSx}>Email Status</Typography>
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
							{direction === 'Sent' ? [
								<MenuItem key="Sent" value="Sent" sx={{ fontSize: '0.78rem', fontWeight: 600 }}>Sent</MenuItem>,
								<MenuItem key="Opened" value="Opened" sx={{ fontSize: '0.78rem', fontWeight: 600 }}>Opened</MenuItem>,
								<MenuItem key="Replied" value="Replied" sx={{ fontSize: '0.78rem', fontWeight: 600 }}>Replied</MenuItem>
							] : [
								<MenuItem key="Received" value="Received" sx={{ fontSize: '0.78rem', fontWeight: 600 }}>Received</MenuItem>,
								<MenuItem key="Read" value="Read" sx={{ fontSize: '0.78rem', fontWeight: 600 }}>Read</MenuItem>,
								<MenuItem key="Replied" value="Replied" sx={{ fontSize: '0.78rem', fontWeight: 600 }}>Replied</MenuItem>
							]}
						</TextField>
					</Box>
				</Stack>
			</Box>

			<Box sx={{ mb: 2 }}>
				<Typography sx={labelCaptionSx}>Subject / Purpose</Typography>
				<TextField
					placeholder="e.g. Follow-up regarding agreement"
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

			<Typography sx={labelCaptionSx}>Email Body</Typography>
			<Box sx={{ mb: 0.5 }}>
				<RichTextEditor
					value={description}
					onChange={setDescription}
					placeholder="Write email body here..."
					minHeight={compact ? 90 : 120}
					variant="simple"
				/>
			</Box>
		</Box>
	);
};

export default EmailTab;
