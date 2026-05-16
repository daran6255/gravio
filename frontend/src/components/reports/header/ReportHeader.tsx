import React from 'react';
import {
	Box,
	Typography,
	Button,
	useTheme,
	useMediaQuery,
	FormControl,
	Select,
	MenuItem,
	InputLabel
} from '@mui/material';
import { Refresh as RefreshIcon, FileDownload as ExportIcon } from '@mui/icons-material';

interface ReportHeaderProps {
	onRefresh: () => void;
	onExport: () => void;
	loading: boolean;
	reportType: string;
	onReportTypeChange: (type: string) => void;
}

const ReportHeader: React.FC<ReportHeaderProps> = ({
	onRefresh,
	onExport,
	loading,
	reportType,
	onReportTypeChange
}) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	return (
		<Box sx={{
			display: 'flex',
			flexDirection: isMobile ? 'column' : 'row',
			justifyContent: 'space-between',
			alignItems: isMobile ? 'flex-start' : 'center',
			mb: 3,
			gap: isMobile ? 2 : 0
		}}>
			<Box component="header" role="banner">
				<Typography
					variant={isMobile ? "h5" : "h4"}
					component="h1"
					sx={{
						fontWeight: 300,
						color: 'text.primary',
						mb: 0.5
					}}
				>
					{reportType === 'candidate' ? 'Candidates Report' : 'Training Management Report'}
				</Typography>
				<Typography variant="body2" color="text.secondary">
					{reportType === 'candidate'
						? 'Generate and customize candidate data reports for export.'
						: 'Track candidate progress and allocations across training batches.'}
				</Typography>
			</Box>
			<Box
				sx={{
					display: 'flex',
					flexDirection: isMobile ? 'column' : 'row',
					gap: 2,
					alignItems: isMobile ? 'stretch' : 'center',
					width: isMobile ? '100%' : 'auto'
				}}
				role="toolbar"
				aria-label="Report Actions"
			>
				<FormControl size="small" sx={{ minWidth: isMobile ? '100%' : 220 }}>
					<InputLabel id="report-type-label">Report Type</InputLabel>
					<Select
						labelId="report-type-label"
						value={reportType}
						label="Report Type"
						onChange={(e) => onReportTypeChange(e.target.value)}
						sx={{
							height: 36,
							fontSize: theme.typography.body2.fontSize,
							borderRadius: `${theme.shape.borderRadius}px`,
							'& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider }
						}}
						inputProps={{
							'aria-label': 'Select report type'
						}}
					>
						<MenuItem value="candidate" sx={{ fontSize: theme.typography.body2.fontSize }}>Candidate Report</MenuItem>
						<MenuItem value="training" sx={{ fontSize: theme.typography.body2.fontSize }}>Training Management Report</MenuItem>
					</Select>
				</FormControl>

				<Box sx={{ display: 'flex', gap: 2, width: isMobile ? '100%' : 'auto' }}>
					<Button
						variant="outlined"
						startIcon={<RefreshIcon className={loading ? 'spin-animation' : ''} aria-hidden="true" />}
						onClick={onRefresh}
						disabled={loading}
						size="small"
						aria-label={loading ? "Refreshing data" : "Refresh report data"}
						sx={{
							height: 36,
							flex: isMobile ? 1 : 'none',
							borderColor: theme.palette.divider,
							color: theme.palette.text.primary,
							textTransform: 'none',
							fontWeight: 600,
							fontSize: theme.typography.body2.fontSize,
							whiteSpace: 'nowrap',
							'&:hover': {
								borderColor: theme.palette.primary.light,
								backgroundColor: theme.palette.action.hover
							}
						}}
					>
						Refresh
					</Button>
					<Button
						variant="contained"
						startIcon={<ExportIcon aria-hidden="true" />}
						onClick={onExport}
						size="small"
						aria-label="Export report to Excel"
						sx={{
							height: 36,
							flex: isMobile ? 1 : 'none',
							textTransform: 'none',
							fontWeight: 700,
							fontSize: theme.typography.body2.fontSize,
							whiteSpace: 'nowrap',
							boxShadow: 'none'
						}}
					>
						Export Report
					</Button>
				</Box>
				<style>
					{`
						@keyframes spin {
							from { transform: rotate(0deg); }
							to { transform: rotate(360deg); }
						}
						.spin-animation {
							animation: spin 1s linear infinite;
						}
					`}
				</style>
			</Box>
		</Box>
	);
};

export default ReportHeader;
