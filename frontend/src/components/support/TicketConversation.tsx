import React, { useState, useEffect, useRef } from 'react';
import {
	Box,
	Typography,
	Paper,
	Stack,
	TextField,
	Button,
	Chip,
	CircularProgress,
	IconButton
} from '@mui/material';
import {
	Send as SendIcon,
	ArrowBack as BackIcon
} from '@mui/icons-material';
import { ticketService } from '../../services/ticketService';
import type { Ticket, TicketMessage } from '../../services/ticketService';
import { useSnackbar } from 'notistack';

interface TicketConversationProps {
	ticketId: number;
	onBack: () => void;
	isAdmin: boolean;
}

const TicketConversation: React.FC<TicketConversationProps> = ({ ticketId, onBack, isAdmin }) => {
	const [ticket, setTicket] = useState<Ticket | null>(null);
	const [loading, setLoading] = useState(true);
	const [newMessage, setNewMessage] = useState('');
	const [sending, setSending] = useState(false);
	const { enqueueSnackbar } = useSnackbar();
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const loadTicket = async () => {
		try {
			const data = await ticketService.getTicket(ticketId);
			setTicket(data);
		} catch (error) {
			console.error('Failed to load ticket:', error);
			enqueueSnackbar('Failed to load ticket conversation', { variant: 'error' });
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadTicket();
		// Poll for new messages every 30 seconds
		const interval = setInterval(loadTicket, 30000);
		return () => clearInterval(interval);
	}, [ticketId]);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [ticket?.messages]);

	const handleSendMessage = async () => {
		if (!newMessage.trim()) return;

		setSending(true);
		try {
			await ticketService.addMessage(ticketId, { message: newMessage });
			setNewMessage('');
			await loadTicket();
		} catch (error) {
			console.error('Failed to send message:', error);
			enqueueSnackbar('Failed to send message', { variant: 'error' });
		} finally {
			setSending(false);
		}
	};

	const handleStatusChange = async (newStatus: Ticket['status']) => {
		try {
			await ticketService.updateTicket(ticketId, { status: newStatus });
			enqueueSnackbar(`Ticket status updated to ${newStatus}`, { variant: 'success' });
			await loadTicket();
		} catch (error) {
			console.error('Failed to update status:', error);
			enqueueSnackbar('Failed to update status', { variant: 'error' });
		}
	};

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
				<CircularProgress color="inherit" sx={{ color: '#ec7211' }} />
			</Box>
		);
	}

	if (!ticket) return null;

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'open': return '#0073bb';
			case 'in_progress': return '#ec7211';
			case 'resolved': return '#2e7d32';
			case 'closed': return '#545b64';
			default: return '#545b64';
		}
	};

	return (
		<Box sx={{ height: 'calc(100vh - 250px)', display: 'flex', flexDirection: 'column' }}>
			{/* Header */}
			<Paper elevation={0} sx={{ p: 3, border: '1px solid #d5dbdb', borderRadius: '2px 2px 0 0', bgcolor: '#f2f3f3' }}>
				<Stack direction="row" spacing={2} alignItems="flex-start">
					<IconButton onClick={onBack} size="small" sx={{ mt: -0.5 }}>
						<BackIcon />
					</IconButton>
					<Box sx={{ flexGrow: 1 }}>
						<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
							<Typography variant="caption" sx={{ fontWeight: 700, color: '#545b64', letterSpacing: '0.05em' }}>
								{ticket.ticket_number}
							</Typography>
							<Chip
								label={ticket.status.replace('_', ' ').toUpperCase()}
								size="small"
								sx={{
									height: 20,
									fontSize: '0.65rem',
									fontWeight: 700,
									bgcolor: getStatusColor(ticket.status),
									color: '#ffffff',
									borderRadius: '2px'
								}}
							/>
						</Stack>
						<Typography variant="h6" sx={{ fontWeight: 700, color: '#232f3e' }}>
							{ticket.title}
						</Typography>
						<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
							{ticket.description}
						</Typography>
					</Box>

					{isAdmin && (
						<Stack spacing={1}>
							<Typography variant="caption" sx={{ fontWeight: 700, color: '#545b64' }}>ACTIONS</Typography>
							<Stack direction="row" spacing={1}>
								{ticket.status !== 'resolved' && (
									<Button
										size="small"
										variant="outlined"
										color="success"
										onClick={() => handleStatusChange('resolved')}
										sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '2px' }}
									>
										Mark Resolved
									</Button>
								)}
								{ticket.status === 'open' && (
									<Button
										size="small"
										variant="outlined"
										onClick={() => handleStatusChange('in_progress')}
										sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '2px', color: '#ec7211', borderColor: '#ec7211' }}
									>
										Start Working
									</Button>
								)}
							</Stack>
						</Stack>
					)}
				</Stack>
			</Paper>

			{/* Conversation Area */}
			<Paper
				elevation={0}
				sx={{
					flexGrow: 1,
					borderLeft: '1px solid #d5dbdb',
					borderRight: '1px solid #d5dbdb',
					bgcolor: '#ffffff',
					overflowY: 'auto',
					p: 3
				}}
			>
				<Stack spacing={3}>
					{/* System Message - Ticket Created */}
					<Box sx={{ display: 'flex', justifyContent: 'center' }}>
						<Typography variant="caption" sx={{ bgcolor: '#f2f3f3', px: 2, py: 0.5, borderRadius: '10px', color: '#545b64' }}>
							Ticket created on {new Date(ticket.created_at).toLocaleString()}
						</Typography>
					</Box>

					{ticket.messages.map((msg: TicketMessage) => {
						const isOwnMessage = msg.user_id === ticket.user_id; // Simple check, should use current user ID
						// In a real app, compare msg.user_id with current_user.id from Redux

						return (
							<Box
								key={msg.id}
								sx={{
									display: 'flex',
									flexDirection: 'column',
									alignItems: isOwnMessage ? 'flex-start' : 'flex-end',
									maxWidth: '80%',
									alignSelf: isOwnMessage ? 'flex-start' : 'flex-end'
								}}
							>
								<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
									{!isOwnMessage && <Typography variant="caption" sx={{ fontWeight: 700 }}>Support Team</Typography>}
									{isOwnMessage && <Typography variant="caption" sx={{ fontWeight: 700 }}>You</Typography>}
									<Typography variant="caption" color="text.secondary">
										{new Date(msg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
									</Typography>
								</Stack>
								<Paper
									elevation={0}
									sx={{
										p: 2,
										bgcolor: isOwnMessage ? '#f2f3f3' : '#e7f3fb',
										border: '1px solid',
										borderColor: isOwnMessage ? '#d5dbdb' : '#b2d8f0',
										borderRadius: '2px'
									}}
								>
									<Typography variant="body2">{msg.message}</Typography>
								</Paper>
							</Box>
						);
					})}
					<div ref={messagesEndRef} />
				</Stack>
			</Paper>

			{/* Footer Input */}
			<Paper elevation={0} sx={{ p: 2, border: '1px solid #d5dbdb', borderRadius: '0 0 2px 2px', bgcolor: '#f2f3f3' }}>
				{ticket.status === 'closed' || ticket.status === 'resolved' ? (
					<Box sx={{ textAlign: 'center', py: 1 }}>
						<Typography variant="body2" color="text.secondary">
							This ticket is {ticket.status}. {isAdmin ? 'Re-open to continue conversation.' : 'Please create a new ticket if you have further questions.'}
						</Typography>
					</Box>
				) : (
					<Stack direction="row" spacing={2}>
						<TextField
							fullWidth
							multiline
							maxRows={4}
							placeholder="Type your message here..."
							value={newMessage}
							onChange={(e) => setNewMessage(e.target.value)}
							size="small"
							sx={{ bgcolor: '#ffffff', '& .MuiOutlinedInput-root': { borderRadius: '2px' } }}
							onKeyPress={(e) => {
								if (e.key === 'Enter' && !e.shiftKey) {
									e.preventDefault();
									handleSendMessage();
								}
							}}
						/>
						<Button
							variant="contained"
							disabled={!newMessage.trim() || sending}
							onClick={handleSendMessage}
							sx={{
								bgcolor: '#ec7211',
								'&:hover': { bgcolor: '#eb5f07' },
								borderRadius: '2px',
								textTransform: 'none',
								fontWeight: 700,
								px: 4,
								minWidth: '120px'
							}}
						>
							{sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
						</Button>
					</Stack>
				)}
			</Paper>
		</Box>
	);
};

export default TicketConversation;
