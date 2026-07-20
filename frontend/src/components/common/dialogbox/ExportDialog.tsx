import React, { useState } from 'react';
import {
	Typography,
	Box,
	alpha,
	useTheme,
	Stack,
	Paper,
	CircularProgress,
	LinearProgress
} from '@mui/material';
import {
	TableChartRounded as ExcelIcon,
	ArticleRounded as CsvIcon,
	FileDownloadDoneRounded as SuccessIcon,
	InfoOutlined
} from '@mui/icons-material';
import BaseDialog from './BaseDialog';
import type { ExportDialogProps } from './types';
import { SubmitButton, CancelButton } from '../button';

/**
 * ExportDialog - High-fidelity Enterprise Data Extraction
 * Standardized interface for format selection and generation progress.
 */
const ExportDialog: React.FC<ExportDialogProps> = ({
	open,
	onClose,
	onExport,
	title = 'Export Data',
	subtitle = 'Configure your data extraction parameters and generate reporting files',
	recordCount,
	loading = false,
	maxWidth = 'sm'
}) => {
	const theme = useTheme();
	const [selectedFormat, setSelectedFormat] = useState<'excel' | 'csv'>('excel');

	const handleExport = async () => {
		await onExport(selectedFormat);
	};

	const formats = [
		{ id: 'excel', label: 'Microsoft Excel', ext: '.xlsx', icon: <ExcelIcon />, color: '#107c10' },
		{ id: 'csv', label: 'Comma Separated', ext: '.csv', icon: <CsvIcon />, color: '#1d6f42' }
	];

	const actions = (
		<Box sx={{ display: 'flex', gap: 1.5 }}>
			<CancelButton
				onClick={onClose}
				disabled={loading}
				sx={{ color: 'text.secondary', fontWeight: 600 }}
			/>
			<SubmitButton
				onClick={handleExport}
				loading={loading}
				sx={{
					color: 'white',
					px: 4,
					borderRadius: '10px',
					boxShadow: 'none',
					background: 'linear-gradient(90deg, #8B7CF6 0%, #4EA8FF 100%)',
					minWidth: 140,
					'&:hover': { boxShadow: '0 4px 12px rgba(139,124,246,0.3)' },
					'&.Mui-disabled': { background: theme.palette.action.disabledBackground }
				}}
			>
				Start Export
			</SubmitButton>
		</Box>
	);

	return (
		<BaseDialog
			open={open}
			onClose={onClose}
			title={title}
			subtitle={subtitle}
			maxWidth={maxWidth}
			loading={loading}
			actions={actions}
		>
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, py: 1 }}>
				{/* Format Selection Row */}
				<Box>
					<Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', mb: 2, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
						Select Output Format
					</Typography>
					<Stack direction="row" spacing={2}>
						{formats.map((format) => {
							const isActive = selectedFormat === format.id;
							return (
								<Paper
									key={format.id}
									onClick={() => !loading && setSelectedFormat(format.id as any)}
									elevation={0}
									sx={{
										flex: 1,
										p: 2.5,
										cursor: loading ? 'default' : 'pointer',
										borderRadius: '16px',
										border: '2px solid',
										borderColor: isActive ? 'primary.main' : alpha(theme.palette.divider, 0.6),
										bgcolor: isActive ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
										transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
										display: 'flex',
										flexDirection: 'column',
										gap: 1.5,
										position: 'relative',
										'&:hover': {
											borderColor: isActive ? 'primary.main' : 'primary.light',
											bgcolor: alpha(theme.palette.primary.main, 0.02),
											transform: 'translateY(-1px)'
										}
									}}
								>
									<Box sx={{
										p: 1,
										borderRadius: '12px',
										bgcolor: alpha(format.color, 0.1),
										color: format.color,
										width: 'fit-content',
										display: 'flex'
									}}>
										{React.cloneElement(format.icon as React.ReactElement<any>, { sx: { fontSize: 24 } })}
									</Box>
									<Box>
										<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
											{format.label}
										</Typography>
										<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
											Standard {format.ext} file
										</Typography>
									</Box>
									{isActive && (
										<Box sx={{ 
											position: 'absolute', 
											top: 12, 
											right: 12,
											color: 'primary.main'
										}}>
											<SuccessIcon sx={{ fontSize: 20 }} />
										</Box>
									)}
								</Paper>
							);
						})}
					</Stack>
				</Box>

				{/* Scope & Progress */}
				<Box>
					{loading ? (
						<Box sx={{ mt: 1 }}>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
									<CircularProgress size={14} thickness={6} />
									<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
										Generating document buffer...
									</Typography>
								</Box>
								<Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 800 }}>
									Wait...
								</Typography>
							</Box>
							<LinearProgress 
								sx={{ 
									height: 6, 
									borderRadius: 3, 
									bgcolor: alpha(theme.palette.primary.main, 0.08),
									'& .MuiLinearProgress-bar': { borderRadius: 3 }
								}} 
							/>
						</Box>
					) : (
						<Box sx={{
							p: 2,
							borderRadius: '14px',
							bgcolor: alpha(theme.palette.info.main, 0.06),
							border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
							display: 'flex',
							alignItems: 'center',
							gap: 2
						}}>
							<InfoOutlined sx={{ color: 'info.main', fontSize: 20 }} />
							<Typography variant="caption" sx={{ color: 'info.dark', fontWeight: 600, lineHeight: 1.5 }}>
								{recordCount 
									? `Preparing to extract ${recordCount} localized records from the current project context.`
									: "The system will generate a comprehensive report containing all active project activities."
								}
							</Typography>
						</Box>
					)}
				</Box>
			</Box>
		</BaseDialog>
	);
};

export default ExportDialog;
