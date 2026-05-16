import React from 'react';
import {
    Button,
    Typography,
    Box,
    TextField,
    Stack,
    Chip,
    useTheme
} from '@mui/material';
import type { JobRole } from '../../../../../models/jobRole';
import BaseDialog from '../../../../common/dialogbox/BaseDialog';

interface BulkMappingDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    jobRole: JobRole;
    selectedCount: number;
    notes: string;
    onNotesChange: (notes: string) => void;
    submitting: boolean;
}

const BulkMappingDialog: React.FC<BulkMappingDialogProps> = ({
    open,
    onClose,
    onConfirm,
    jobRole,
    selectedCount,
    notes,
    onNotesChange,
    submitting
}) => {
    const theme = useTheme();
    const actions = (
        <>
            <Button 
                onClick={onClose} 
                disabled={submitting}
                sx={{ color: theme.palette.text.secondary }}
            >
                Cancel
            </Button>
            <Button
                variant="contained"
                onClick={onConfirm}
                disabled={submitting}
                disableElevation
                sx={{
                    bgcolor: theme.palette.primary.main,
                    '&:hover': { bgcolor: theme.palette.primary.dark },
                    px: 3
                }}
            >
                {submitting ? 'Mapping Candidates...' : `Map ${selectedCount} Candidates`}
            </Button>
        </>
    );

    return (
        <BaseDialog 
            open={open} 
            onClose={onClose} 
            maxWidth="sm" 
            title="Bulk Map Candidates"
            subtitle={`Assigning multiple candidates to ${jobRole.title}`}
            loading={submitting}
            actions={actions}
        >
            <Stack spacing={3}>
                <Box sx={{ p: 2, bgcolor: theme.palette.background.default, border: `1px solid ${theme.palette.divider}`, borderRadius: '4px' }}>
                    <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                        You are about to map <strong>{selectedCount}</strong> candidates to:
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Chip 
                            label={jobRole.title} 
                            size="small" 
                            color="secondary"
                            sx={{ fontWeight: 700, borderRadius: '4px' }} 
                        />
                        {jobRole.company && (
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                                at {jobRole.company.name}
                            </Typography>
                        )}
                    </Stack>
                </Box>

                <Box>
                    <Typography variant="awsSectionTitle" sx={{ mb: 1 }}>
                        Common Mapping Notes (Optional)
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Add notes that will be applied to all selected candidates..."
                        value={notes}
                        onChange={(e) => onNotesChange(e.target.value)}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '2px',
                                bgcolor: theme.palette.background.paper,
                                '& fieldset': { borderColor: theme.palette.divider },
                                '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main }
                            }
                        }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        These notes will be visible in the candidate's placement pipeline history.
                    </Typography>
                </Box>
            </Stack>
        </BaseDialog>
    );
};

export default BulkMappingDialog;
