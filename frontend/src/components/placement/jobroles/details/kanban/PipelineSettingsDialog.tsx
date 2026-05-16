import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Stack,
    IconButton,
    TextField,
    Button,
    List,
    ListItem,
    ListItemIcon,
    ListItemSecondaryAction,
    Divider,
    Paper,
    Chip,
    Tooltip,
    Alert
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    DragHandle as DragHandleIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    Close as CloseIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import BaseDialog from '../../../../common/dialogbox/BaseDialog';
import { useAppDispatch } from '../../../../../store/hooks';
import { updateJobRole } from '../../../../../store/slices/jobRoleSlice';
import type { JobRole } from '../../../../../models/jobRole';

interface PipelineSettingsDialogProps {
    open: boolean;
    onClose: () => void;
    jobRole: JobRole;
}

const CATEGORY_LABELS: Record<string, string> = {
    lead: 'Lead/Source',
    shortlisted: 'Shortlisted',
    interview: 'Interview',
    offer: 'Offer',
    hired: 'Hired',
    rejected: 'Rejected',
    not_joined: 'Not Joined'
};

const PipelineSettingsDialog: React.FC<PipelineSettingsDialogProps> = ({ open, onClose, jobRole }) => {
    const dispatch = useAppDispatch();
    const [stages, setStages] = useState(jobRole.pipeline_stages || []);
    const [editingStage, setEditingStage] = useState<string | null>(null);
    const [editLabel, setEditLabel] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (jobRole.pipeline_stages) {
            setStages(jobRole.pipeline_stages);
        }
    }, [jobRole.pipeline_stages]);

    const handleAddInterviewRound = () => {
        const interviewStages = stages.filter(s => s.category === 'interview');
        const nextRoundNum = interviewStages.length + 1;
        const newId = `interview_l${nextRoundNum}`;
        
        const newStage = {
            id: newId,
            label: `L${nextRoundNum} Interview`,
            category: 'interview' as const
        };

        // Insert after the last interview stage or after shortlisted
        const shortlistedIndex = stages.findIndex(s => s.category === 'shortlisted');
        const lastInterviewIndex = stages.map(s => s.category).lastIndexOf('interview');
        
        const insertIndex = lastInterviewIndex !== -1 ? lastInterviewIndex + 1 : shortlistedIndex + 1;
        
        const newStages = [...stages];
        newStages.splice(insertIndex, 0, newStage);
        setStages(newStages);
    };

    const handleRemoveStage = (id: string) => {
        // Prevent removing essential stages
        const stage = stages.find(s => s.id === id);
        if (stage && ['lead', 'shortlisted', 'offer', 'hired'].includes(stage.category)) {
            return;
        }
        setStages(stages.filter(s => s.id !== id));
    };

    const handleStartEdit = (id: string, label: string) => {
        setEditingStage(id);
        setEditLabel(label);
    };

    const handleSaveEdit = (id: string) => {
        setStages(stages.map(s => s.id === id ? { ...s, label: editLabel } : s));
        setEditingStage(null);
    };

    const handleSaveAll = async () => {
        setIsSaving(true);
        try {
            await dispatch(updateJobRole({
                publicId: jobRole.public_id,
                jobRole: { pipeline_stages: stages }
            })).unwrap();
            onClose();
        } catch (error) {
            console.error("Failed to update pipeline", error);
        } finally {
            setIsSaving(false);
        }
    };

    const actions = (
        <>
            <Button onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button 
                variant="contained" 
                onClick={handleSaveAll} 
                loading={isSaving}
                sx={{ bgcolor: '#ec7211', '&:hover': { bgcolor: '#eb5f07' } }}
            >
                Save Configuration
            </Button>
        </>
    );

    return (
        <BaseDialog
            open={open}
            onClose={onClose}
            title="Configure Recruitment Pipeline"
            subtitle={`Customize stages for ${jobRole.title}`}
            maxWidth="sm"
            actions={actions}
        >
            <Box>
                <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
                    You can add multiple interview rounds or rename existing stages. 
                    Changes will reflect immediately on the Kanban board.
                </Alert>

                <Paper variant="outlined" sx={{ borderRadius: '8px', overflow: 'hidden' }}>
                    <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderBottom: '1px solid #eaeded' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#232f3e' }}>
                            Pipeline Stages
                        </Typography>
                    </Box>
                    <List sx={{ p: 0 }}>
                        {stages.map((stage, index) => (
                            <React.Fragment key={stage.id}>
                                <ListItem sx={{ py: 1.5 }}>
                                    <ListItemIcon sx={{ minWidth: 40 }}>
                                        <Tooltip title="Drag to reorder (Coming soon)">
                                            <DragHandleIcon sx={{ color: '#aab7bd', fontSize: 20 }} />
                                        </Tooltip>
                                    </ListItemIcon>
                                    
                                    <Box sx={{ flexGrow: 1 }}>
                                        {editingStage === stage.id ? (
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <TextField 
                                                    size="small" 
                                                    value={editLabel} 
                                                    onChange={(e) => setEditLabel(e.target.value)}
                                                    autoFocus
                                                    sx={{ flexGrow: 1 }}
                                                />
                                                <IconButton size="small" onClick={() => handleSaveEdit(stage.id)} color="primary">
                                                    <SaveIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" onClick={() => setEditingStage(null)}>
                                                    <CloseIcon fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                        ) : (
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#232f3e' }}>
                                                    {stage.label}
                                                </Typography>
                                                <Chip 
                                                    label={CATEGORY_LABELS[stage.category]} 
                                                    size="small" 
                                                    sx={{ height: 16, fontSize: '0.65rem', textTransform: 'uppercase', bgcolor: '#f3f3f3', color: '#545b64' }} 
                                                />
                                            </Stack>
                                        )}
                                    </Box>
 
                                    <ListItemSecondaryAction>
                                        <Stack direction="row" spacing={0.5}>
                                            <IconButton 
                                                size="small" 
                                                onClick={() => handleStartEdit(stage.id, stage.label)}
                                                disabled={editingStage !== null}
                                            >
                                                <EditIcon fontSize="small" sx={{ fontSize: 18 }} />
                                            </IconButton>
                                            <IconButton 
                                                size="small" 
                                                onClick={() => handleRemoveStage(stage.id)}
                                                disabled={['lead', 'shortlisted', 'offer', 'hired'].includes(stage.category)}
                                                sx={{ color: '#d13212' }}
                                            >
                                                <DeleteIcon fontSize="small" sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        </Stack>
                                    </ListItemSecondaryAction>
                                </ListItem>
                                {index < stages.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>

                <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddInterviewRound}
                    fullWidth
                    sx={{ mt: 2, border: '1px dashed #d5dbdb', py: 1.5, color: '#545b64' }}
                >
                    Add Interview Round
                </Button>
            </Box>
        </BaseDialog>
    );
};

export default PipelineSettingsDialog;
