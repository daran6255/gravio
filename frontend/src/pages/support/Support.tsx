import React, { useState, useEffect } from 'react';
import {
	Container,
	Typography,
	Box,
	Paper,
	Button,
	Stack,
	Grid,
	Chip,
	IconButton,
	CircularProgress,
	Divider,
	Tooltip
} from '@mui/material';
import {
	HelpOutline as HelpIcon,
	Add as AddIcon,
	Refresh as RefreshIcon,
	CheckCircle as ResolvedIcon,
	ErrorOutline as OpenIcon,
	PendingActions as ProgressIcon
} from '@mui/icons-material';
import { ticketService } from '../../services/ticketService';
import type { Ticket, TicketCreate } from '../../services/ticketService';
import TicketCreateDialog from '../../components/support/TicketCreateDialog';
import TicketConversation from '../../components/support/TicketConversation';
import { useSnackbar } from 'notistack';
import { useAppSelector } from '../../store/hooks';

const Support: React.FC = () => {
	const [tickets, setTickets] = useState<Ticket[]>([]);
	const [loading, setLoading] = useState(true);
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
	const { enqueueSnackbar } = useSnackbar();
	const user = useAppSelector((state) => state.auth.user);
	const isAdmin = user?.role === 'admin' || user?.is_superuser;

	const loadTickets = async () => {
		setLoading(true);
		try {
			const data = await ticketService.getTickets();
			setTickets(data);
		} catch (error) {
			console.error('Failed to load tickets:', error);
			enqueueSnackbar('Failed to load support tickets', { variant: 'error' });
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadTickets();
	}, []);

	const handleCreateTicket = async (ticketData: TicketCreate) => {
		try {
			await ticketService.createTicket(ticketData);
			enqueueSnackbar('Ticket submitted successfully', { variant: 'success' });
			loadTickets();
		} catch (error) {
			console.error('Failed to create ticket:', error);
			enqueueSnackbar('Failed to submit ticket', { variant: 'error' });
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'open': return <OpenIcon sx={{ color: '#0073bb', fontSize: 20 }} />;
			case 'in_progress': return <ProgressIcon sx={{ color: '#ec7211', fontSize: 20 }} />;
			case 'resolved': return <ResolvedIcon sx={{ color: '#2e7d32', fontSize: 20 }} />;
			default: return <OpenIcon sx={{ color: '#545b64', fontSize: 20 }} />;
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'open': return '#0073bb';
			case 'in_progress': return '#ec7211';
			case 'resolved': return '#2e7d32';
			case 'closed': return '#545b64';
			default: return '#545b64';
		}
	};

	const sectionTitleStyle = {
		fontWeight: 700,
		fontSize: '0.875rem',
		color: '#545b64',
		textTransform: 'uppercase' as const,
		letterSpacing: '0.025em',
		mb: 2
	};

	const awsPanelStyle = {
		border: '1px solid #d5dbdb',
		borderRadius: '2px',
		bgcolor: '#ffffff',
		overflow: 'hidden'
	};

	if (selectedTicketId) {
		return (
			<Container maxWidth="lg" sx={{ py: 4 }}>
				<TicketConversation
					ticketId={selectedTicketId}
					onBack={() => {
						setSelectedTicketId(null);
						loadTickets();
					}}
					isAdmin={!!isAdmin}
				/>
			</Container>
		);
	}

	return (
		<Container maxWidth="lg" sx={{ py: 4 }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
				<Box sx={{ display: 'flex', alignItems: 'center' }}>
					<HelpIcon sx={{ mr: 2, color: '#ec7211', fontSize: 32 }} />
					<Box>
						<Typography variant="h5" sx={{ fontWeight: 700, color: '#232f3e' }}>
							Help & Support
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Manage your support requests and get help from our technical team.
						</Typography>
					</Box>
				</Box>
				<Stack direction="row" spacing={2}>
					<Tooltip title="Refresh">
						<IconButton onClick={loadTickets} size="small" sx={{ border: '1px solid #d5dbdb', borderRadius: '2px' }}>
							<RefreshIcon />
						</IconButton>
					</Tooltip>
					<Button
						variant="contained"
						startIcon={<AddIcon />}
						onClick={() => setCreateDialogOpen(true)}
						sx={{
							bgcolor: '#ec7211',
							'&:hover': { bgcolor: '#eb5f07' },
							borderRadius: '2px',
							textTransform: 'none',
							fontWeight: 700,
							boxShadow: 'none'
						}}
					>
						New Support Request
					</Button>
				</Stack>
			</Box>

			{/* Stats Cards */}
			<Grid container spacing={3} sx={{ mb: 4 }}>
				<Grid size={{ xs: 12, md: 4 }}>
					<Paper elevation={0} sx={{ ...awsPanelStyle, p: 3 }}>
						<Stack direction="row" justifyContent="space-between" alignItems="center">
							<Box>
								<Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>Open Tickets</Typography>
								<Typography variant="h4" sx={{ fontWeight: 700, color: '#0073bb', mt: 1 }}>
									{tickets.filter(t => t.status === 'open').length}
								</Typography>
							</Box>
							<OpenIcon sx={{ fontSize: 40, color: '#0073bb', opacity: 0.2 }} />
						</Stack>
					</Paper>
				</Grid>
				<Grid size={{ xs: 12, md: 4 }}>
					<Paper elevation={0} sx={{ ...awsPanelStyle, p: 3 }}>
						<Stack direction="row" justifyContent="space-between" alignItems="center">
							<Box>
								<Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>In Progress</Typography>
								<Typography variant="h4" sx={{ fontWeight: 700, color: '#ec7211', mt: 1 }}>
									{tickets.filter(t => t.status === 'in_progress').length}
								</Typography>
							</Box>
							<ProgressIcon sx={{ fontSize: 40, color: '#ec7211', opacity: 0.2 }} />
						</Stack>
					</Paper>
				</Grid>
				<Grid size={{ xs: 12, md: 4 }}>
					<Paper elevation={0} sx={{ ...awsPanelStyle, p: 3 }}>
						<Stack direction="row" justifyContent="space-between" alignItems="center">
							<Box>
								<Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>Resolved</Typography>
								<Typography variant="h4" sx={{ fontWeight: 700, color: '#2e7d32', mt: 1 }}>
									{tickets.filter(t => t.status === 'resolved').length}
								</Typography>
							</Box>
							<ResolvedIcon sx={{ fontSize: 40, color: '#2e7d32', opacity: 0.2 }} />
						</Stack>
					</Paper>
				</Grid>
			</Grid>

			<Paper elevation={0} sx={awsPanelStyle}>
				<Box sx={{ px: 3, py: 2, bgcolor: '#f2f3f3', borderBottom: '1px solid #d5dbdb' }}>
					<Typography sx={{ ...sectionTitleStyle, mb: 0 }}>
						{isAdmin ? 'All Support Tickets' : 'My Support Tickets'}
					</Typography>
				</Box>

				{loading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
						<CircularProgress size={32} sx={{ color: '#ec7211' }} />
					</Box>
				) : (
					<Box>
						{tickets.length === 0 ? (
							<Box sx={{ p: 8, textAlign: 'center' }}>
								<HelpIcon sx={{ fontSize: 48, color: '#d5dbdb', mb: 2 }} />
								<Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
									No support tickets found
								</Typography>
								<Typography variant="body2" color="text.secondary">
									If you need assistance, please create a new support request.
								</Typography>
							</Box>
						) : (
							<Stack divider={<Divider />}>
								{tickets.map((ticket) => (
									<Box
										key={ticket.id}
										onClick={() => setSelectedTicketId(ticket.id)}
										sx={{
											p: 3,
											cursor: 'pointer',
											'&:hover': { bgcolor: '#f9f9f9' },
											transition: 'background-color 0.2s'
										}}
									>
										<Grid container spacing={2} alignItems="center">
											<Grid size={{ xs: 12, md: 8 }}>
												<Stack direction="row" spacing={2} alignItems="flex-start">
													<Box sx={{ mt: 0.5 }}>{getStatusIcon(ticket.status)}</Box>
													<Box>
														<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
															<Typography variant="caption" sx={{ fontWeight: 700, color: '#545b64', letterSpacing: '0.05em' }}>
																{ticket.ticket_number}
															</Typography>
															<Chip
																label={ticket.priority.toUpperCase()}
																size="small"
																variant="outlined"
																sx={{
																	height: 18,
																	fontSize: '0.6rem',
																	borderRadius: '2px',
																	borderColor: ticket.priority === 'high' || ticket.priority === 'urgent' ? '#d13212' : '#d5dbdb',
																	color: ticket.priority === 'high' || ticket.priority === 'urgent' ? '#d13212' : 'inherit'
																}}
															/>
														</Stack>
														<Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#232f3e' }}>
															{ticket.title}
														</Typography>
														<Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: '500px' }}>
															{ticket.description}
														</Typography>
													</Box>
												</Stack>
											</Grid>
											<Grid size={{ xs: 12, md: 4 }}>
												<Stack direction="row" spacing={4} justifyContent="flex-end" alignItems="center">
													<Box sx={{ textAlign: 'right' }}>
														<Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
															Last Update
														</Typography>
														<Typography variant="body2" sx={{ fontWeight: 600 }}>
															{new Date(ticket.updated_at).toLocaleDateString()}
														</Typography>
													</Box>
													<Chip
														label={ticket.status.replace('_', ' ').toUpperCase()}
														size="small"
														sx={{
															borderRadius: '2px',
															bgcolor: getStatusColor(ticket.status),
															color: '#ffffff',
															fontWeight: 700,
															fontSize: '0.7rem'
														}}
													/>
												</Stack>
											</Grid>
										</Grid>
									</Box>
								))}
							</Stack>
						)}
					</Box>
				)}
			</Paper>

			<TicketCreateDialog
				open={createDialogOpen}
				onClose={() => setCreateDialogOpen(false)}
				onSubmit={handleCreateTicket}
			/>
		</Container>
	);
};

export default Support;
