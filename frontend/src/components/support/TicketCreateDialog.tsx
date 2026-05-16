import React, { useState } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	TextField,
	MenuItem,
	Stack,
	Typography,
	IconButton,
	Box
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import type { TicketCreate, TicketPriority, TicketCategory } from '../../services/ticketService';

interface TicketCreateDialogProps {
	open: boolean;
	onClose: () => void;
	onSubmit: (ticket: TicketCreate) => Promise<void>;
}

const priorities: { value: TicketPriority; label: string }[] = [
	{ value: 'low', label: 'Low' },
	{ value: 'medium', label: 'Medium' },
	{ value: 'high', label: 'High' },
	{ value: 'urgent', label: 'Urgent' }
];

const categories: { value: TicketCategory; label: string }[] = [
	{ value: 'technical', label: 'Technical Issue' },
	{ value: 'account', label: 'Account/Access' },
	{ value: 'feature_request', label: 'Feature Request' },
	{ value: 'other', label: 'Other' }
];

const TicketCreateDialog: React.FC<TicketCreateDialogProps> = ({ open, onClose, onSubmit }) => {
	const [formData, setFormData] = useState<TicketCreate>({
		title: '',
		description: '',
		priority: 'medium',
		category: 'other'
	});
	const [loading, setLoading] = useState(false);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormData((prev: TicketCreate) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async () => {
		if (!formData.title || !formData.description) return;

		setLoading(true);
		try {
			await onSubmit(formData);
			setFormData({ title: '', description: '', priority: 'medium', category: 'other' });
			onClose();
		} catch (error) {
			console.error('Failed to create ticket:', error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '2px' } }}>
			<DialogTitle sx={{ bgcolor: '#232f3e', color: '#ffffff', py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<Typography variant="h6" sx={{ fontWeight: 700 }}>Submit Support Ticket</Typography>
				<IconButton onClick={onClose} size="small" sx={{ color: '#ffffff' }}>
					<CloseIcon />
				</IconButton>
			</DialogTitle>
			<DialogContent sx={{ p: 4 }}>
				<Stack spacing={3} sx={{ mt: 1 }}>
					<TextField
						name="title"
						label="Subject / Title"
						fullWidth
						required
						value={formData.title}
						onChange={handleChange}
						placeholder="Briefly describe the issue"
						size="small"
					/>

					<Stack direction="row" spacing={2}>
						<TextField
							select
							name="category"
							label="Category"
							fullWidth
							required
							value={formData.category}
							onChange={handleChange}
							size="small"
						>
							{categories.map(cat => (
								<MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
							))}
						</TextField>

						<TextField
							select
							name="priority"
							label="Priority"
							fullWidth
							required
							value={formData.priority}
							onChange={handleChange}
							size="small"
						>
							{priorities.map(prio => (
								<MenuItem key={prio.value} value={prio.value}>{prio.label}</MenuItem>
							))}
						</TextField>
					</Stack>

					<TextField
						name="description"
						label="Description"
						fullWidth
						required
						multiline
						rows={4}
						value={formData.description}
						onChange={handleChange}
						placeholder="Provide more details about your request..."
					/>

					<Box sx={{ bgcolor: '#f2f3f3', p: 2, borderLeft: '4px solid #ec7211' }}>
						<Typography variant="caption" color="text.secondary">
							Our support team typically responds within 24 hours. Please provide as much detail as possible to help us assist you better.
						</Typography>
					</Box>
				</Stack>
			</DialogContent>
			<DialogActions sx={{ p: 3, borderTop: '1px solid #eaeded' }}>
				<Button onClick={onClose} sx={{ color: '#545b64', fontWeight: 700, textTransform: 'none' }}>
					Cancel
				</Button>
				<Button
					variant="contained"
					onClick={handleSubmit}
					disabled={loading || !formData.title || !formData.description}
					sx={{
						bgcolor: '#ec7211',
						'&:hover': { bgcolor: '#eb5f07' },
						borderRadius: '2px',
						textTransform: 'none',
						fontWeight: 700,
						px: 4
					}}
				>
					{loading ? 'Submitting...' : 'Submit Ticket'}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default TicketCreateDialog;
