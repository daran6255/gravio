import React from 'react';
import { TableCell, Box, Typography, Button, useTheme, alpha } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import PlanEntryCard from './PlanEntryCard';
import type { TrainingBatchPlan } from '../../../../../models/training';

interface PlanTableCellProps {
	day: Date;
	dateStr: string;
	periodIdx: number;
	holiday: any;
	entry: TrainingBatchPlan | undefined;
	isNextSlot: boolean;
	canEdit: boolean;
	isExporting: boolean;
	onOpenDialog: (date: Date) => void;
	onMenuOpen: (event: React.MouseEvent<HTMLButtonElement>, entry: TrainingBatchPlan) => void;
}

const PlanTableCell: React.FC<PlanTableCellProps> = ({
	dateStr,
	day,
	periodIdx,
	holiday,
	entry,
	isNextSlot,
	canEdit,
	isExporting,
	onOpenDialog,
	onMenuOpen
}) => {
	const theme = useTheme();

	return (
		<TableCell
			key={`${dateStr}-${periodIdx}`}
			sx={{
				verticalAlign: 'top',
				p: 1.5,
				position: 'relative',
				minHeight: 100,
				borderRight: '1px solid',
				borderRightColor: 'divider',
				bgcolor: holiday ? (holiday.event_type === 'holiday' ? alpha(theme.palette.error.main, 0.04) : alpha(theme.palette.primary.main, 0.04)) : 'inherit',
				transition: 'background-color 0.2s',
				'&:hover': {
					bgcolor: holiday ? (holiday.event_type === 'holiday' ? alpha(theme.palette.error.main, 0.08) : alpha(theme.palette.primary.main, 0.08)) : 'action.hover',
					'& .add-btn': { opacity: 1 }
				}
			}}
		>
			{holiday ? (
				<Box sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					height: '100%',
					opacity: 0.8,
					minHeight: 60
				}}>
					<Typography variant="caption" sx={{ fontWeight: 800, color: holiday.event_type === 'holiday' ? 'error.main' : 'primary.main', align: 'center', textTransform: 'uppercase', letterSpacing: 0.5 }}>
						{holiday.title}
					</Typography>
				</Box>
			) : entry ? (
				<PlanEntryCard 
					entry={entry} 
					canEdit={canEdit} 
					isExporting={isExporting} 
					onMenuOpen={onMenuOpen} 
				/>
			) : isNextSlot && canEdit && !isExporting ? (
				<Button
					className="add-btn"
					fullWidth
					variant="outlined"
					startIcon={<AddIcon />}
					onClick={() => onOpenDialog(day)}
					sx={{
						height: '100%',
						minHeight: 70,
						opacity: 0,
						borderStyle: 'dashed',
						borderColor: 'primary.light',
						borderRadius: 2,
						bgcolor: 'transparent',
						color: 'primary.main',
						transition: 'all 0.2s',
						'&:hover': { 
							opacity: 1, 
							borderStyle: 'solid',
							bgcolor: alpha(theme.palette.primary.main, 0.05),
							borderColor: 'primary.main',
							color: 'primary.main'
						},
					}}
				>
					Add Activity
				</Button>
			) : (
				<Box sx={{ minHeight: 70 }} />
			)}
		</TableCell>
	);
};

export default PlanTableCell;
