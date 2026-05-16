import React from 'react';
import {
	Typography,
	Radio,
	RadioGroup,
	FormControlLabel,
	FormControl,
	Box,
	Alert,
	Button,
	alpha,
	useTheme
} from '@mui/material';
import {
	Download as DownloadIcon,
	Email as EmailIcon,
	DescriptionOutlined as PageIcon,
	DatasetOutlined as AllIcon
} from '@mui/icons-material';
import { BaseDialog } from '../../common/dialogbox';

interface ExportDialogProps {
	open: boolean;
	onClose: () => void;
	onExport: (type: 'page' | 'all') => void;
	loading?: boolean;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ open, onClose, onExport, loading }) => {
	const theme = useTheme();
	const [exportType, setExportType] = React.useState<'page' | 'all'>('page');

	const handleExport = () => {
		onExport(exportType);
	};

	const actions = (
		<Box sx={{ display: 'flex', gap: 1.5, width: '100%', justifyContent: 'flex-end' }}>
			<Button onClick={onClose} disabled={loading} sx={{ textTransform: 'none', fontWeight: 600 }}>
				Cancel
			</Button>
			<Button
				onClick={handleExport}
				variant="contained"
				startIcon={exportType === 'page' ? <DownloadIcon /> : <EmailIcon />}
				disabled={loading}
				sx={{
					textTransform: 'none',
					fontWeight: 700,
					px: 3,
					borderRadius: '4px'
				}}
			>
				{exportType === 'page' ? 'Download Now' : 'Send to Email'}
			</Button>
		</Box>
	);

	return (
		<BaseDialog
			open={open}
			onClose={onClose}
			title="Export Report"
			subtitle="Choose how you would like to export the report data based on your current filters."
			maxWidth="sm"
			loading={loading}
			actions={actions}
		>
			<FormControl component="fieldset" sx={{ width: '100%' }}>
				<RadioGroup
					value={exportType}
					onChange={(e) => setExportType(e.target.value as 'page' | 'all')}
				>
					<Box
						sx={{
							p: 2.5,
							mb: 2,
							border: '2px solid',
							borderColor: exportType === 'page' ? 'primary.main' : alpha(theme.palette.divider, 0.6),
							borderRadius: 1,
							bgcolor: exportType === 'page' ? alpha(theme.palette.primary.main, 0.02) : 'transparent',
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							transition: 'all 0.2s',
							'&:hover': {
								borderColor: exportType === 'page' ? 'primary.main' : 'primary.light',
								bgcolor: exportType === 'page' ? alpha(theme.palette.primary.main, 0.02) : alpha(theme.palette.primary.main, 0.01)
							}
						}}
						onClick={() => setExportType('page')}
					>
						<FormControlLabel
							value="page"
							control={<Radio />}
							label={
								<Box sx={{ ml: 1 }}>
									<Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>Current Page Only</Typography>
									<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
										Download the current view (up to 100 records) immediately as an Excel file.
									</Typography>
								</Box>
							}
							sx={{ width: '100%', m: 0 }}
						/>
						<PageIcon color={exportType === 'page' ? 'primary' : 'disabled'} sx={{ fontSize: 28, ml: 2 }} />
					</Box>

					<Box
						sx={{
							p: 2.5,
							border: '2px solid',
							borderColor: exportType === 'all' ? 'primary.main' : alpha(theme.palette.divider, 0.6),
							borderRadius: 1,
							bgcolor: exportType === 'all' ? alpha(theme.palette.primary.main, 0.02) : 'transparent',
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							transition: 'all 0.2s',
							'&:hover': {
								borderColor: exportType === 'all' ? 'primary.main' : 'primary.light',
								bgcolor: exportType === 'all' ? alpha(theme.palette.primary.main, 0.02) : alpha(theme.palette.primary.main, 0.01)
							}
						}}
						onClick={() => setExportType('all')}
					>
						<FormControlLabel
							value="all"
							control={<Radio />}
							label={
								<Box sx={{ ml: 1 }}>
									<Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>Entire Record Set</Typography>
									<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
										The full dataset matching your filters will be generated and sent to your email.
									</Typography>
								</Box>
							}
							sx={{ width: '100%', m: 0 }}
						/>
						<AllIcon color={exportType === 'all' ? 'primary' : 'disabled'} sx={{ fontSize: 28, ml: 2 }} />
					</Box>
				</RadioGroup>
			</FormControl>

			{exportType === 'all' && (
				<Alert
					severity="info"
					sx={{
						mt: 3,
						borderRadius: 1,
						'& .MuiAlert-message': { fontWeight: 500 }
					}}
				>
					For large datasets, processing may take a few minutes. You will receive an email once it is ready.
				</Alert>
			)}
		</BaseDialog>
	);
};

export default ExportDialog;
