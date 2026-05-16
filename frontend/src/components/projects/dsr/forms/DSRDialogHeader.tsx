import React from 'react';
import { DialogTitle, Box, Typography, IconButton } from '@mui/material';
import { Close as CloseIcon, EventNote as DSRIcon } from '@mui/icons-material';

interface DSRDialogHeaderProps {
	title: string;
	subtitle: string;
	onClose: () => void;
}

const DSRDialogHeader: React.FC<DSRDialogHeaderProps> = ({ title, subtitle, onClose }) => {
	return (
		<DialogTitle sx={{
			bgcolor: '#1a222e',
			color: 'white',
			py: 1.5,
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'space-between',
			borderBottom: '1px solid rgba(255,255,255,0.1)'
		}}>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
				<Box sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					width: 32,
					height: 32,
					borderRadius: '6px',
					bgcolor: 'rgba(236,114,17,0.15)',
					color: '#ec7211'
				}}>
					<DSRIcon fontSize="small" />
				</Box>
				<Box>
					<Typography variant="subtitle1" sx={{ lineHeight: 1.2, fontWeight: 700, letterSpacing: '-0.01em' }}>
						{title}
					</Typography>
					<Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400, fontSize: '0.7rem' }}>
						{subtitle}
					</Typography>
				</Box>
			</Box>
			<IconButton onClick={onClose} size="small" sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
				<CloseIcon fontSize="small" />
			</IconButton>
		</DialogTitle>
	);
};

export default DSRDialogHeader;
