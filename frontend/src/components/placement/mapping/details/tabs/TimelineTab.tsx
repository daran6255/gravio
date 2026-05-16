import React from 'react';
import { Box, Typography, Stack, Button, alpha, useTheme } from '@mui/material';
import {
	Timeline,
	TimelineItem,
	TimelineConnector,
	TimelineDot,
} from '@mui/lab';
import {
	History as HistoryIcon,
	Description as DescriptionIcon
} from '@mui/icons-material';
import { getStatusConfig, formatDateIST, formatTimeIST } from '../drawerUtils';

interface TimelineTabProps {
	history: any[];
	onViewDocument: (docId?: number, fallbackUrl?: string) => void;
	offerId?: number;
}

const TimelineTab: React.FC<TimelineTabProps> = ({ history, onViewDocument, offerId }) => {
	const theme = useTheme();

	if (history.length === 0) {
		return (
			<Box sx={{ textAlign: 'center', py: 10 }}>
				<HistoryIcon sx={{ fontSize: 48, color: theme.palette.divider, mb: 2 }} />
				<Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
					No activity recorded for this candidate.
				</Typography>
			</Box>
		);
	}

	return (
		<Timeline sx={{ p: 0, m: 0 }}>
			{history.map((item, index) => {
				const config = getStatusConfig(item.to_status, theme);
				return (
					<TimelineItem key={index} sx={{ '&:before': { display: 'none' } }}>
						<Box sx={{ display: 'flex', gap: 2.5, width: '100%', mb: 1 }}>
							{/* Date & Time Column */}
							<Box sx={{ minWidth: 95, textAlign: 'right', pt: 0.75 }}>
								<Typography variant="caption" sx={{ fontWeight: 800, color: theme.palette.text.primary, display: 'block', fontSize: '0.75rem', letterSpacing: '0.2px' }}>
									{formatDateIST(item.changed_at)}
								</Typography>
								<Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600, fontSize: '0.7rem' }}>
									{formatTimeIST(item.changed_at)}
								</Typography>
							</Box>

							{/* Icon Axis */}
							<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
								<TimelineDot
									variant="outlined"
									sx={{
										borderColor: alpha(config.color, 0.3),
										color: config.color,
										bgcolor: alpha(config.color, 0.05),
										boxShadow: `0 0 0 4px ${theme.palette.background.paper}`,
										width: 34,
										height: 34,
										m: 0,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										padding: 0
									}}
								>
									{config.icon}
								</TimelineDot>
								{index < history.length - 1 && (
									<TimelineConnector sx={{ bgcolor: theme.palette.divider, width: 2, my: 0.5 }} />
								)}
							</Box>

							{/* Content Area */}
							<Box sx={{ pb: 4, flex: 1 }}>
								<Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
									<Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.text.primary, textTransform: 'capitalize' }}>
										{item.to_status.replace(/_/g, ' ')}
									</Typography>
									{item.changed_by_name && (
										<Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
											• {item.changed_by_name}
										</Typography>
									)}
								</Stack>

								{item.remarks && (
									<Box sx={{
										p: 2,
										bgcolor: theme.palette.background.paper,
										borderRadius: '4px',
										border: `1px solid ${theme.palette.divider}`,
										position: 'relative',
										boxShadow: `0 1px 2px ${alpha(theme.palette.common.black, 0.05)}`,
										'&:before': {
											content: '""',
											position: 'absolute',
											left: 0,
											top: 8,
											bottom: 8,
											width: '3px',
											bgcolor: config.color,
											borderRadius: '0 4px 4px 0'
										}
									}}>
										<Typography 
											variant="body2" 
											sx={{ 
												fontSize: '0.8125rem', 
												color: theme.palette.text.primary, 
												lineHeight: 1.6, 
												pl: 0.5,
												whiteSpace: 'pre-wrap'
											}}
										>
											{item.remarks
												?.replace(/\(CTC:.*Joining:.*\)/, '')
												?.replace(/DocumentID: \d+ \| Document: .*/, '')
												?.trim()}
										</Typography>
									</Box>
								)}

								{(item.to_status === 'offer_made' || item.to_status === 'offered' || (item.remarks && (item.remarks.includes('uploads/') || item.remarks.includes('Document:')))) && (
									<Button
										size="small"
										startIcon={<DescriptionIcon sx={{ fontSize: 14 }} />}
										onClick={() => {
											const idMatch = item.remarks?.match(/DocumentID: (\d+)/);
											const docMatch = item.remarks?.match(/Document: (.*)/);
											const idFromRemarks = idMatch ? parseInt(idMatch[1]) : undefined;
											const urlFromRemarks = docMatch ? docMatch[1] : undefined;
											
											onViewDocument(idFromRemarks || offerId, urlFromRemarks);
										}}
										sx={{
											mt: 1.5,
											textTransform: 'none',
											fontWeight: 700,
											fontSize: '0.75rem',
											color: theme.palette.primary.main,
											'&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) }
										}}
									>
										View Document
									</Button>
								)}
							</Box>
						</Box>
					</TimelineItem>
				);
			})}
		</Timeline>
	);
};

export default TimelineTab;
