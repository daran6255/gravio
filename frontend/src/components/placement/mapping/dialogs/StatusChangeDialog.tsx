import React, { useState } from 'react';
import {
	Button,
	TextField,
	Typography,
	Box,
	Alert,
	Stack,
	Chip,
	useTheme,
	alpha
} from '@mui/material';
import { TrendingUp as TrendingUpIcon } from '@mui/icons-material';
import BaseDialog from '../../../common/dialogbox/BaseDialog';

interface StatusChangeDialogProps {
	open: boolean;
	onClose: () => void;
	onConfirm: (remarks: string) => void;
	candidateName: string;
	fromStatus: string;
	toStatus: string;
	fromStatusLabel?: string;
	toStatusLabel?: string;
	loading?: boolean;
}

const StatusChangeDialog: React.FC<StatusChangeDialogProps> = ({
	open,
	onClose,
	onConfirm,
	candidateName,
	fromStatus,
	toStatus,
	fromStatusLabel,
	toStatusLabel,
	loading = false
}) => {
	const theme = useTheme();
	const [remarks, setRemarks] = useState('');

	const handleSubmit = () => {
		if (remarks.trim()) {
			onConfirm(remarks);
			setRemarks('');
		}
	};

	const formatStatus = (s: string) => s.replace('_', ' ').toUpperCase();

    const actions = (
        <>
            <Button onClick={onClose} disabled={loading} sx={{ color: theme.palette.text.secondary }}>
                Cancel
            </Button>
            <Button 
                onClick={handleSubmit} 
                variant="contained" 
                disabled={loading || !remarks.trim()}
                sx={{ 
                    bgcolor: theme.palette.primary.main,
                    '&:hover': { bgcolor: theme.palette.primary.dark }
                }}
            >
                Confirm Change
            </Button>
        </>
    );

	return (
		<BaseDialog 
            open={open} 
            onClose={onClose} 
            maxWidth="sm" 
            title="Change Pipeline Stage"
            subtitle={`Updating status for ${candidateName}`}
            loading={loading}
            actions={actions}
        >
            <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                    You are moving <strong>{candidateName}</strong> to a new stage in the recruitment pipeline.
                </Typography>
                
                <Stack direction="row" spacing={2} alignItems="center" sx={{ my: 3, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: '4px', border: `1px solid ${theme.palette.divider}` }}>
                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                        <Typography variant="awsFieldLabel">FROM</Typography>
                        <Box sx={{ mt: 0.5 }}>
                            <Chip label={fromStatusLabel || formatStatus(fromStatus)} size="small" />
                        </Box>
                    </Box>
                    
                    <TrendingUpIcon sx={{ color: 'primary.main' }} />
                    
                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                        <Typography variant="awsFieldLabel">TO</Typography>
                        <Box sx={{ mt: 0.5 }}>
                            <Chip label={toStatusLabel || formatStatus(toStatus)} color="primary" size="small" />
                        </Box>
                    </Box>
                </Stack>

                <Alert severity="info" sx={{ mb: 3, '& .MuiAlert-message': { fontSize: '0.8125rem' } }}>
                    Please provide a brief reason or remark for this status change. This will be recorded in the candidate's history.
                </Alert>

                <TextField
                    autoFocus
                    label="Remarks / Notes"
                    multiline
                    rows={3}
                    fullWidth
                    variant="outlined"
                    value={remarks}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRemarks(e.target.value)}
                    placeholder="Enter reason for status change..."
                    required
                    error={remarks.trim() === ''}
                    helperText={remarks.trim() === '' ? 'Remarks are mandatory for audit trail' : ''}
                />
            </Box>
		</BaseDialog>
	);
};

export default StatusChangeDialog;
