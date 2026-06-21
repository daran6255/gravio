import React from 'react';
import { Drawer, Box, Typography, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

interface DetailDrawerProps {
	open: boolean;
	onClose: () => void;
	title: React.ReactNode;
	subtitle?: React.ReactNode;
	width?: string | number;
	headerExtra?: React.ReactNode;
	children?: React.ReactNode;
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
	open,
	onClose,
	title,
	subtitle,
	width = 460,
	headerExtra,
	children
}) => {
	return (
		<Drawer
			anchor="right"
			open={open}
			onClose={onClose}
			sx={{
				'& .MuiDrawer-paper': {
					width: { xs: '100%', sm: width },
					boxSizing: 'border-box',
					p: 3,
					borderLeft: '1px solid',
					borderColor: 'divider',
					boxShadow: '-8px 0px 32px rgba(0, 0, 0, 0.04)'
				}
			}}
		>
			<Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
				{/* Drawer Header */}
				<Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
					<Box>
						{typeof title === 'string' ? (
							<Typography variant="h6" sx={{ fontWeight: 700 }}>
								{title}
							</Typography>
						) : (
							title
						)}
						{subtitle && (
							typeof subtitle === 'string' ? (
								<Typography variant="caption" color="text.secondary">
									{subtitle}
								</Typography>
							) : (
								subtitle
							)
						)}
					</Box>
					<IconButton onClick={onClose} size="small">
						<Close />
					</IconButton>
				</Box>

				{/* Header Extra Actions (e.g. badges, status tags) */}
				{headerExtra && <Box sx={{ mb: 3 }}>{headerExtra}</Box>}

				{/* Drawer Content */}
				{children}
			</Box>
		</Drawer>
	);
};

export default DetailDrawer;
