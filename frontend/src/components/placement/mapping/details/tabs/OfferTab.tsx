import React from 'react';
import { Box, Typography, Stack, Button, alpha, useTheme, Paper, Grid, Divider, Chip } from '@mui/material';
import {
	LocalOffer as OfferIcon,
	Event as EventIcon,
	LocationOn as LocationIcon,
	Description as DescriptionIcon
} from '@mui/icons-material';
import { formatDateIST } from '../drawerUtils';

interface OfferTabProps {
	offer: any | null;
	onRecordOfferResponse: (response: 'accepted' | 'rejected' | 'pending') => void;
	onRecordJoining: (status: 'joined' | 'not_joined' | 'pending') => void;
	onViewDocument: (docId?: number, fallbackUrl?: string) => void;
}

const OfferTab: React.FC<OfferTabProps> = ({ 
	offer, 
	onRecordOfferResponse, 
	onRecordJoining, 
	onViewDocument 
}) => {
	const theme = useTheme();

	if (!offer) {
		return (
			<Box sx={{ textAlign: 'center', py: 10, bgcolor: theme.palette.background.paper, borderRadius: '8px', border: `1px dashed ${theme.palette.divider}` }}>
				<OfferIcon sx={{ fontSize: 40, color: theme.palette.divider, mb: 2 }} />
				<Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
					Offer details not yet projected.
				</Typography>
				<Button
					size="small"
					variant="outlined"
					sx={{
						mt: 3,
						textTransform: 'none',
						fontWeight: 700,
						borderColor: theme.palette.divider,
						color: theme.palette.text.primary
					}}
				>
					Generate Offer
				</Button>
			</Box>
		);
	}

	return (
		<Box>
			<Paper
				elevation={0}
				sx={{
					border: `1px solid ${theme.palette.divider}`,
					borderRadius: '8px',
					bgcolor: theme.palette.background.paper,
					overflow: 'hidden'
				}}
			>
				<Box sx={{ p: 2.5, bgcolor: alpha(theme.palette.secondary.light, 0.02), borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<Typography variant="subtitle1" sx={{ fontWeight: 800, color: theme.palette.primary.main }}> Employment Offer </Typography>
					<Chip
						label={offer.joining_status || offer.candidate_response?.toUpperCase()}
						sx={{ 
							fontWeight: 800, 
							bgcolor: theme.palette.accent.main, 
							color: 'common.white', 
							height: 24, 
							fontSize: '0.7rem', 
							borderRadius: '4px' 
						}}
					/>
				</Box>
				<Box sx={{ p: 3 }}>
					<Grid container spacing={4}>
						<Grid size={{ xs: 6 }}>
							<Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.text.secondary, mb: 0.5, display: 'block' }}>Annual CTC</Typography>
							<Typography variant="h6" sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
								₹{offer.offered_ctc?.toLocaleString() || 'N/A'}
							</Typography>
						</Grid>
						<Grid size={{ xs: 6 }}>
							<Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.text.secondary, mb: 0.5, display: 'block' }}>Designation</Typography>
							<Typography variant="body1" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
								{offer.offered_designation || 'N/A'}
							</Typography>
						</Grid>
						<Grid size={{ xs: 12 }}><Divider sx={{ borderStyle: 'dashed' }} /></Grid>
						<Grid size={{ xs: 6 }}>
							<Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.text.secondary, mb: 0.5, display: 'block' }}>Expected Joining</Typography>
							<Stack direction="row" spacing={1} alignItems="center">
								<EventIcon sx={{ fontSize: 18, color: theme.palette.accent.main }} />
								<Typography variant="body2" sx={{ fontWeight: 700 }}>
									{offer.joining_date ? formatDateIST(offer.joining_date) : 'N/A'}
								</Typography>
							</Stack>
						</Grid>
						<Grid size={{ xs: 6 }}>
							<Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.text.secondary, mb: 0.5, display: 'block' }}>Work Location</Typography>
							<Stack direction="row" spacing={1} alignItems="center">
								<LocationIcon sx={{ fontSize: 18, color: theme.palette.error.main }} />
								<Typography variant="body2" sx={{ fontWeight: 700 }}>
									{offer.work_location || 'N/A'}
								</Typography>
							</Stack>
						</Grid>
						{(offer.offer_letter_id || offer.offer_letter_url) && (
							<Grid size={{ xs: 12 }}>
								<Button
									variant="outlined"
									fullWidth
									startIcon={<DescriptionIcon />}
									onClick={() => onViewDocument(offer?.offer_letter_id, offer?.offer_letter_url)}
									sx={{
										mt: 1,
										textTransform: 'none',
										fontWeight: 700,
										borderColor: theme.palette.primary.main,
										color: theme.palette.primary.main,
										bgcolor: alpha(theme.palette.primary.main, 0.05),
										'&:hover': {
											bgcolor: alpha(theme.palette.primary.main, 0.1),
											borderColor: theme.palette.primary.main
										}
									}}
								>
									View Offer Letter
								</Button>
							</Grid>
						)}
					</Grid>

					<Box sx={{ mt: 4, pt: 3, borderTop: `1px dashed ${theme.palette.divider}` }}>
						{(!offer.candidate_response || offer.candidate_response === 'pending') ? (
							<Stack direction="row" spacing={2}>
								<Button
									fullWidth
									variant="contained"
									color="success"
									onClick={() => onRecordOfferResponse('accepted')}
									sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '4px' }}
								>
									Accept Offer
								</Button>
								<Button
									fullWidth
									variant="outlined"
									color="error"
									onClick={() => onRecordOfferResponse('rejected')}
									sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '4px' }}
								>
									Reject Offer
								</Button>
							</Stack>
						) : offer.candidate_response === 'accepted' && (!offer.joining_status || offer.joining_status === 'pending') ? (
							<Stack direction="row" spacing={2}>
								<Button
									fullWidth
									variant="contained"
									color="primary"
									onClick={() => onRecordJoining('joined')}
									sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '4px' }}
								>
									Mark as Joined
								</Button>
								<Button
									fullWidth
									variant="outlined"
									color="warning"
									onClick={() => onRecordJoining('not_joined')}
									sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '4px' }}
								>
									Did Not Join
								</Button>
							</Stack>
						) : (
							<Box sx={{ bgcolor: alpha(theme.palette.accent.main, 0.05), p: 2, borderRadius: '4px', textAlign: 'center' }}>
								<Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.accent.main }}>
									Lifecycle completed: {offer.joining_status?.toUpperCase() || offer.candidate_response?.toUpperCase()}
								</Typography>
							</Box>
						)}
					</Box>
				</Box>
			</Paper>
		</Box>
	);
};

export default OfferTab;
