import React from 'react';
import {
	Box,
	Typography,
	Stack,
	TextField,
	Button,
	Paper,
	List,
	ListItem,
	ListItemAvatar,
	ListItemText,
	Avatar,
	Divider
} from '@mui/material';
import {
	Edit as EditIcon,
	MoreVert as MoreIcon
} from '@mui/icons-material';
import type { Company } from '../../../../models/company';

interface NotesTabProps {
	company: Company;
	noteText: string;
	setNoteText: (val: string) => void;
	handleAddNote: () => void;
	isSubmittingNote: boolean;
}

const NotesTab: React.FC<NotesTabProps> = ({
	company,
	noteText,
	setNoteText,
	handleAddNote,
	isSubmittingNote
}) => {
	return (
		<Stack spacing={3}>
			<Paper sx={{ p: 3, borderRadius: '2px', boxShadow: '0 1px 1px 0 rgba(0,28,36,0.3), 1px 1px 1px 0 rgba(0,28,36,0.15), -1px 1px 1px 0 rgba(0,28,36,0.15)' }}>
				<Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: '#232f3e' }}>
					Add Activity Note
				</Typography>
				<TextField
					fullWidth
					multiline
					rows={3}
					placeholder="Enter activity log or note..."
					value={noteText}
					onChange={(e) => setNoteText(e.target.value)}
					sx={{
						mb: 2,
						'& .MuiOutlinedInput-root': { borderRadius: '2px' }
					}}
				/>
				<Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
					<Button
						variant="contained"
						disabled={!noteText.trim() || isSubmittingNote}
						onClick={handleAddNote}
						sx={{ bgcolor: '#007eb9', '&:hover': { bgcolor: '#006a9e' }, textTransform: 'none', fontWeight: 700 }}
					>
						{isSubmittingNote ? 'Adding...' : 'Add Note'}
					</Button>
				</Box>
			</Paper>

			<Paper sx={{ p: 3, borderRadius: '2px', boxShadow: '0 1px 1px 0 rgba(0,28,36,0.3), 1px 1px 1px 0 rgba(0,28,36,0.15), -1px 1px 1px 0 rgba(0,28,36,0.15)' }}>
				<Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 3, color: '#232f3e' }}>
					Activity History ({company.crm_activities?.length || 0})
				</Typography>
				{(!company.crm_activities || company.crm_activities.length === 0) ? (
					<Box sx={{ py: 4, textAlign: 'center' }}>
						<Typography color="textSecondary">No activities recorded for this company yet.</Typography>
					</Box>
				) : (
					<List disablePadding>
						{company.crm_activities.slice().reverse().map((activity: any, index: number) => (
							<React.Fragment key={activity.public_id}>
								<ListItem alignItems="flex-start" sx={{ px: 0, py: 2 }}>
									<ListItemAvatar>
										<Avatar sx={{ bgcolor: activity.activity_type === 'note_added' ? '#007eb9' : '#545b64', width: 32, height: 32 }}>
											{activity.activity_type === 'note_added' ? <EditIcon sx={{ fontSize: 16 }} /> : <MoreIcon sx={{ fontSize: 16 }} />}
										</Avatar>
									</ListItemAvatar>
									<ListItemText
										primary={
											<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
												<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
													{activity.activity_type.replace('_', ' ').toUpperCase()}
												</Typography>
												<Typography variant="caption" color="textSecondary">
													{new Date(activity.created_at).toLocaleString()}
												</Typography>
											</Box>
										}
										secondary={
											<Typography
												variant="body2"
												color="textPrimary"
												sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}
											>
												{activity.summary}
											</Typography>
										}
									/>
								</ListItem>
								{index < (company.crm_activities?.length || 0) - 1 && <Divider component="li" sx={{ my: 1 }} />}
							</React.Fragment>
						))}
					</List>
				)}
			</Paper>
		</Stack>
	);
};

export default NotesTab;
