import React from 'react';
import {
	TableContainer,
	Table,
	TableHead,
	TableRow,
	TableCell,
	TableBody,
	CircularProgress,
	Alert,
	Chip,
	Button,
	Tooltip
} from '@mui/material';
import { VpnKey as PermissionIcon } from '@mui/icons-material';
import type { MissingDSR } from '../../../../models/dsr';

interface MissingReportsTableProps {
	missingReports: MissingDSR[];
	loading: boolean;
	onGrantPermission: (publicId: string) => void;
	reminding: boolean;
}

const MissingReportsTable: React.FC<MissingReportsTableProps> = ({
	missingReports,
	loading,
	onGrantPermission,
	reminding
}) => {
	return (
		<TableContainer>
			<Table>
				<TableHead sx={{ bgcolor: '#f2f3f3' }}>
					<TableRow>
						<TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
						<TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
						<TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
						<TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{loading ? (
						<TableRow>
							<TableCell colSpan={4} align="center" sx={{ py: 3 }}>
								<CircularProgress size={24} color="inherit" />
							</TableCell>
						</TableRow>
					) : missingReports.length === 0 ? (
						<TableRow>
							<TableCell colSpan={4} align="center" sx={{ py: 3 }}>
								<Alert severity="success" sx={{ borderRadius: '2px' }}>Everyone has submitted their DSR for this date!</Alert>
							</TableCell>
						</TableRow>
					) : (
						missingReports.map((user) => (
							<TableRow key={user.public_id} hover>
								<TableCell sx={{ fontWeight: 600 }}>{user.full_name || user.username}</TableCell>
								<TableCell>{user.email}</TableCell>
								<TableCell>
									<Chip
										label={user.role}
										size="small"
										variant="outlined"
										sx={{
											borderRadius: '4px',
											textTransform: 'capitalize',
											fontWeight: 600,
											fontSize: '0.75rem',
											bgcolor: '#f8f9fa'
										}}
									/>
								</TableCell>
								<TableCell align="right">
									<Tooltip title="This will create a DSR draft for the user to fill in for this date." arrow>
										<Button
											size="small"
											startIcon={reminding ? <CircularProgress size={16} color="inherit" /> : <PermissionIcon />}
											onClick={() => onGrantPermission(user.public_id)}
											disabled={reminding}
											sx={{ textTransform: 'none', fontWeight: 700 }}
										>
											Grant Permission
										</Button>
									</Tooltip>
								</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</TableContainer>
	);
};

export default MissingReportsTable;
