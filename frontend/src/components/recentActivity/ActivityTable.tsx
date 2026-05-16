import React from 'react';
import {
	Typography,
	Box,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	CircularProgress,
	Tooltip,
	Chip,
	Pagination,
	FormControl,
	Select,
	MenuItem,
	Button,
} from '@mui/material';
import { getActionColor, getRelativeTime, getQuickSummary } from './ActivityHelpers';
import type { ActivityLog } from '../../models/activitylogs';

interface ActivityTableProps {
	logs: ActivityLog[];
	loading: boolean;
	loadingUsers: boolean;
	getUserDisplay: (userId: number | null | undefined) => string;
	onViewDetails: (log: ActivityLog) => void;
	pagination: any;
	pageSize: number;
	handlePageChange: (event: React.ChangeEvent<unknown>, page: number) => void;
	handlePageSizeChange: (event: any) => void;
}

const ActivityTable: React.FC<ActivityTableProps> = ({
	logs,
	loading,
	loadingUsers,
	getUserDisplay,
	onViewDetails,
	pagination,
	pageSize,
	handlePageChange,
	handlePageSizeChange,
}) => {
	return (
		<Box sx={{ minHeight: 300 }}>
			{loading && logs.length === 0 ? (
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						py: 8,
					}}
				>
					<CircularProgress />
				</Box>
			) : logs.length === 0 ? (
				<Box sx={{ p: 3 }}>
					<Typography variant="body2" color="text.secondary">
						No recent activity found.
					</Typography>
				</Box>
			) : (
				<>
					<TableContainer>
						<Table size="small" sx={{ minWidth: 650 }}>
							<TableHead>
								<TableRow
									sx={{
										bgcolor: '#fafafa',
										'& th': {
											fontWeight: 'bold',
											fontSize: '0.75rem',
											textTransform: 'uppercase',
											letterSpacing: '0.5px',
											color: 'text.secondary',
											borderBottom: '2px solid #d5dbdb',
											py: 1.5,
										},
									}}
								>
									<TableCell align="center" sx={{ px: 3 }}>User</TableCell>
									<TableCell align="center" sx={{ px: 3 }}>Action</TableCell>
									<TableCell align="center" sx={{ px: 3 }}>Time</TableCell>
									<TableCell align="center" sx={{ px: 3 }}>Activity</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{logs.map((log) => (
									<TableRow
										key={log.id}
										sx={{
											'&:hover': {
												bgcolor: '#f5f8fa',
											},
											'&:last-child td': {
												borderBottom: 0,
											},
											'& td': {
												py: 1.5,
												borderBottom: '1px solid #d5dbdb',
											},
										}}
									>
										{/* User Column */}
										<TableCell align="center" sx={{ px: 3 }}>
											<Typography variant="body2" color="text.secondary">
												{loadingUsers ? <CircularProgress size={12} /> : getUserDisplay(log.userId)}
											</Typography>
										</TableCell>

										{/* Action Column */}
										<TableCell align="center" sx={{ px: 3 }}>
											<Chip
												label={log.actionType}
												color={getActionColor(log.actionType)}
												size="small"
												sx={{
													fontWeight: 500,
													fontSize: '0.75rem',
													height: 24,
												}}
											/>
										</TableCell>

										{/* Time Column */}
										<TableCell align="center" sx={{ px: 3 }}>
											<Typography
												variant="body2"
												color="text.secondary"
												sx={{ fontSize: '0.875rem' }}
											>
												{getRelativeTime(log.createdAt)}
											</Typography>
										</TableCell>

										{/* Activity Column */}
										<TableCell align="center" sx={{ px: 3 }}>
											<Tooltip title={getQuickSummary(log)} arrow placement="left">
												<Button
													variant="outlined"
													size="small"
													onClick={() => onViewDetails(log)}
													sx={{
														textTransform: 'none',
														fontSize: '0.75rem',
														minWidth: 'auto',
														px: 2,
														py: 0.5,
													}}
												>
													View Details
												</Button>
											</Tooltip>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>

					{/* Pagination */}
					{pagination.totalPages > 1 && (
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								px: 3,
								py: 2,
								borderTop: '1px solid #d5dbdb',
								bgcolor: '#fafafa',
							}}
						>
							{/* Rows per page selector */}
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								<Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
									Rows per page:
								</Typography>
								<FormControl size="small" sx={{ minWidth: 80 }}>
									<Select
										value={pageSize.toString()}
										onChange={handlePageSizeChange as any}
										sx={{
											fontSize: '0.875rem',
											height: 32,
											'& .MuiSelect-select': {
												py: 0.5,
											},
										}}
									>
										<MenuItem value="5">5</MenuItem>
										<MenuItem value="6">6</MenuItem>
										<MenuItem value="10">10</MenuItem>
										<MenuItem value="15">15</MenuItem>
										<MenuItem value="20">20</MenuItem>
										<MenuItem value="25">25</MenuItem>
									</Select>
								</FormControl>
								<Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
									{`${(pagination.page - 1) * pagination.pageSize + 1}-${Math.min(
										pagination.page * pagination.pageSize,
										pagination.total
									)} of ${pagination.total}`}
								</Typography>
							</Box>

							{/* Page navigation */}
							<Pagination
								count={pagination.totalPages}
								page={pagination.page}
								onChange={handlePageChange}
								color="primary"
								size="small"
								showFirstButton
								showLastButton
							/>
						</Box>
					)}
				</>
			)}
		</Box>
	);
};

export default ActivityTable;
