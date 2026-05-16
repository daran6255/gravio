import React from 'react';
import { Box, Typography, Grid, Card, CardActionArea } from '@mui/material';
import {
	AutoAwesome as MagicIcon,
	Person as ContactIcon,
} from '@mui/icons-material';

interface SelectionModeStepProps {
	onSelect: (mode: 'ai' | 'manual') => void;
}

const SelectionModeStep: React.FC<SelectionModeStepProps> = ({ onSelect }) => {
	return (
		<Box sx={{ p: 4, textAlign: 'center' }}>
			<Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
				Build your job opening
			</Typography>
			<Typography variant="body1" color="text.secondary" sx={{ mb: 6 }}>
				Choose how you want to start. Let our AI handle the data entry or build it yourself.
			</Typography>
			<Grid container spacing={4} sx={{ maxWidth: 800, mx: 'auto' }}>
				<Grid size={{ xs: 12, md: 6 }}>
					<Card
						sx={{
							height: '100%',
							border: '2px solid transparent',
							borderRadius: '12px',
							'&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(0, 77, 230, 0.04)' },
							transition: 'all 0.3s'
						}}
					>
						<CardActionArea
							onClick={() => onSelect('ai')}
							sx={{ height: '100%', p: 4 }}
						>
							<Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
								<Box sx={{ 
									p: 2.5, 
									bgcolor: 'rgba(0, 77, 230, 0.1)', 
									borderRadius: '50%',
									color: 'primary.main'
								}}>
									<MagicIcon sx={{ fontSize: 48 }} />
								</Box>
							</Box>
							<Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>AI Smart Draft</Typography>
							<Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
								Upload a JD or paste text. We'll extract skills, location, and key requirements automatically.
							</Typography>
						</CardActionArea>
					</Card>
				</Grid>
				<Grid size={{ xs: 12, md: 6 }}>
					<Card
						sx={{
							height: '100%',
							border: '2px solid transparent',
							borderRadius: '12px',
							'&:hover': { borderColor: 'secondary.main', bgcolor: 'rgba(35, 47, 62, 0.04)' },
							transition: 'all 0.3s'
						}}
					>
						<CardActionArea
							onClick={() => onSelect('manual')}
							sx={{ height: '100%', p: 4 }}
						>
							<Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
								<Box sx={{ 
									p: 2.5, 
									bgcolor: 'rgba(35, 47, 62, 0.1)', 
									borderRadius: '50%',
									color: 'secondary.main'
								}}>
									<ContactIcon sx={{ fontSize: 48 }} />
								</Box>
							</Box>
							<Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>Manual Setup</Typography>
							<Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
								Start with a clean slate. Fill in the details manually using our optimized enterprise form.
							</Typography>
						</CardActionArea>
					</Card>
				</Grid>
			</Grid>
		</Box>
	);
};

export default SelectionModeStep;
