import React, { memo } from 'react';
import {
	TableRow,
	TableCell,
	Typography,
	Chip,
	Box,
	Tooltip,
	alpha,
	useTheme
} from '@mui/material';
import { format, isValid } from 'date-fns';
import type { TrainingBatch } from '../../../../models/training';
import TrainingTableActions from './TrainingTableActions';

interface TrainingTableRowProps {
	batch: TrainingBatch;
	isAdmin: boolean;
	canEdit: boolean;
	onEdit: (batch: TrainingBatch) => void;
	onExtend: (batch: TrainingBatch) => void;
	onDelete: (batch: TrainingBatch) => void;
}

const TrainingTableRow: React.FC<TrainingTableRowProps> = memo(({
	batch,
	isAdmin,
	canEdit,
	onEdit,
	onExtend,
	onDelete
}) => {
	const theme = useTheme();

	return (
		<TableRow
			onClick={() => canEdit && onEdit(batch)}
			sx={{
				'&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
				cursor: canEdit ? 'pointer' : 'default'
			}}
		>
			<TableCell>
				<Typography
					variant="body2"
					sx={{ fontWeight: 500, color: 'primary.main' }}
				>
					{batch.batch_name}
				</Typography>
			</TableCell>
			<TableCell>
				{batch.disability_types?.map((type, idx) => (
					<Chip
						key={idx}
						label={type}
						size="small"
						variant="outlined"
						sx={{
							mr: 0.5,
							mb: 0.5,
							bgcolor: alpha(theme.palette.success.main, 0.05),
							borderColor: alpha(theme.palette.success.main, 0.2),
							color: theme.palette.success.dark,
							fontWeight: 600
						}}
					/>
				)) || '-'}
			</TableCell>
			<TableCell>
				{batch.other?.tag ? (
					<Chip
						label={batch.other.tag}
						size="small"
						sx={{
							bgcolor: alpha(theme.palette.primary.main, 0.05),
							color: theme.palette.primary.main,
							border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
							fontWeight: 700,
							borderRadius: '4px',
							fontSize: '0.65rem',
							textTransform: 'uppercase'
						}}
					/>
				) : (
					<Typography variant="caption" color="text.secondary">No Tag</Typography>
				)}
			</TableCell>
			<TableCell>
				<Typography variant="body2">{batch.domain || '-'}</Typography>
			</TableCell>
			<TableCell>
				{batch.training_mode ? (
					<Chip
						label={batch.training_mode}
						size="small"
						variant="outlined"
						sx={{
							bgcolor: batch.training_mode === 'Online' ? alpha(theme.palette.info.main, 0.08) :
								batch.training_mode === 'Offline' ? alpha(theme.palette.warning.main, 0.08) : alpha(theme.palette.secondary.main, 0.08),
							borderColor: alpha(theme.palette.divider, 0.1),
							fontWeight: 600
						}}
					/>
				) : '-'}
			</TableCell>
			<TableCell>
				{batch.courses?.map((course, idx) => {
					const isObject = typeof course === 'object' && course !== null;
					const name = isObject ? (course as any).name : course;
					const trainer = isObject ? (course as any).trainer : null;

					return (
						<Tooltip key={idx} title={trainer ? `Trainer: ${trainer}` : "No trainer assigned"}>
							<Chip
								label={trainer ? `${name} (${trainer})` : name}
								size="small"
								sx={{
									mr: 0.5,
									mb: 0.5,
									bgcolor: trainer ? alpha(theme.palette.primary.main, 0.05) : alpha(theme.palette.action.hover, 0.5),
									fontWeight: 500
								}}
							/>
						</Tooltip>
					);
				}) || '-'}
			</TableCell>
			<TableCell>
				{(() => {
					const start = batch.start_date || batch.duration?.start_date;
					const end = batch.approx_close_date || batch.duration?.end_date;
					if (start && end) {
						const dStart = new Date(start);
						const dEnd = new Date(end);
						if (isValid(dStart) && isValid(dEnd)) {
							return (
								<Typography variant="body2" color="text.secondary">
									{format(dStart, 'dd MMM yyyy')} - {format(dEnd, 'dd MMM yyyy')}
								</Typography>
							);
						}
					}
					return '-';
				})()}
			</TableCell>
			<TableCell>
				{batch.total_extension_days ? (
					<Tooltip title={
						<Box sx={{ p: 1 }}>
							<Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>Extension History:</Typography>
							{batch.extensions?.map((ext, i) => {
								const extDate = new Date(ext.new_close_date);
								return (
									<Box key={i} sx={{ mb: i === (batch.extensions?.length || 0) - 1 ? 0 : 1, borderLeft: `2px solid ${theme.palette.accent.main}`, pl: 1 }}>
										<Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: theme.palette.accent.main }}>
											{isValid(extDate) ? format(extDate, 'dd MMM yyyy') : ext.new_close_date} ({ext.extension_days >= 0 ? '+' : ''}{ext.extension_days}d)
										</Typography>
										<Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
											{ext.reason || 'No reason provided'}
										</Typography>
									</Box>
								);
							})}
						</Box>
					} arrow>
						<Chip
							label={batch.total_extension_days && batch.total_extension_days > 0
								? `${batch.total_extension_days} days extended`
								: batch.total_extension_days && batch.total_extension_days < 0
									? `${Math.abs(batch.total_extension_days)} days reduced`
									: 'Original date'}
							size="small"
							color={batch.total_extension_days && batch.total_extension_days > 0 ? "warning" : "info"}
							variant="outlined"
							sx={{ cursor: 'help' }}
						/>
					</Tooltip>
				) : '-'}
			</TableCell>
			<TableCell>
				<Chip
					label={batch.status.toUpperCase()}
					size="small"
					variant="outlined"
					color={
						batch.status === 'running' ? 'success' :
							batch.status === 'planned' ? 'warning' : 'default'
					}
				/>
			</TableCell>
			<TableCell align="right" onClick={(e) => e.stopPropagation()}>
				<TrainingTableActions
					batch={batch}
					isAdmin={isAdmin}
					canEdit={canEdit}
					onExtend={onExtend}
					onDelete={onDelete}
				/>
			</TableCell>
		</TableRow>
	);
});

TrainingTableRow.displayName = 'TrainingTableRow';

export default TrainingTableRow;
