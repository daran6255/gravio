import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Stack,
    Divider,
    CircularProgress,
    Chip,
    Button,
    useTheme,
    alpha,
    Avatar,
    Grid,
    Paper,
    Tooltip
} from '@mui/material';
import {
    Business as BusinessIcon,
    Work as WorkIcon,
    CalendarToday as CalendarIcon,
    Info as InfoIcon,
    CheckCircle as CheckCircleIcon,
    ArrowForward as ArrowForwardIcon,
    AutoGraph as MatchIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useDateTime } from '../../../../hooks/useDateTime';
import type { Candidate } from '../../../../models/candidate';
import placementMappingService from '../../../../services/placementMappingService';
import type { PlacementMapping } from '../../../../services/placementMappingService';
import { SectionCard, SectionHeader } from '../DetailedViewCommon';

interface CandidatePlacementTabProps {
    candidate: Candidate;
}

const CandidatePlacementTab: React.FC<CandidatePlacementTabProps> = ({ candidate }) => {
    const navigate = useNavigate();
    const theme = useTheme();
    const { enqueueSnackbar } = useSnackbar();
    const { formatDate } = useDateTime();
    const [mappings, setMappings] = useState<PlacementMapping[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMappings = useCallback(async () => {
        if (!candidate.id) return;
        setLoading(true);
        try {
            const data = await placementMappingService.getCandidateMappings(candidate.id);
            setMappings(data);
        } catch (error: any) {
            enqueueSnackbar('Failed to fetch candidate mappings', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    }, [candidate.id, enqueueSnackbar]);

    useEffect(() => {
        fetchMappings();
    }, [fetchMappings]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
                <CircularProgress size={40} thickness={4} sx={{ color: 'primary.main' }} />
            </Box>
        );
    }

    if (mappings.length === 0) {
        return (
            <SectionCard sx={{ textAlign: 'center', py: 10, bgcolor: alpha(theme.palette.background.default, 0.4), borderRadius: 4 }}>
                <Box sx={{ maxWidth: 450, mx: 'auto' }}>
                    <Avatar sx={{ 
                        width: 100, 
                        height: 100, 
                        bgcolor: alpha(theme.palette.primary.main, 0.05), 
                        color: 'primary.main',
                        mx: 'auto',
                        mb: 3
                    }}>
                        <WorkIcon sx={{ fontSize: 50 }} />
                    </Avatar>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5 }}>No Active Mappings</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
                        This candidate hasn't been mapped to any job roles yet. 
                        Start the placement process by matching their profile with available job roles.
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<MatchIcon />}
                        sx={{ 
                            borderRadius: 2, 
                            px: 4, 
                            py: 1.5,
                            fontWeight: 700,
                            boxShadow: theme.shadows[4]
                        }}
                        onClick={() => navigate('/placement/mapping')}
                    >
                        Map to Job Roles
                    </Button>
                </Box>
            </SectionCard>
        );
    }

    return (
        <Stack spacing={4}>
            <SectionCard>
                <SectionHeader 
                    title="Matched Career Opportunities" 
                    icon={<CheckCircleIcon color="success" />} 
                />
                
                <Grid container spacing={3} sx={{ mt: 1 }}>
                    {mappings.map((mapping) => (
                        <Grid size={{ xs: 12 }} key={mapping.id}>
                            <Paper 
                                elevation={0}
                                variant="outlined" 
                                sx={{ 
                                    borderRadius: 3,
                                    transition: 'all 0.2s',
                                    '&:hover': { 
                                        borderColor: 'primary.main',
                                        bgcolor: alpha(theme.palette.primary.main, 0.01),
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
                                    } 
                                }}
                            >
                                <Box sx={{ p: 3 }}>
                                    <Grid container spacing={3} alignItems="center">
                                        <Grid size={{ xs: 12, md: 7 }}>
                                            <Stack direction="row" spacing={2.5} alignItems="flex-start">
                                                <Avatar 
                                                    variant="rounded"
                                                    sx={{ 
                                                        bgcolor: alpha(theme.palette.primary.main, 0.05), 
                                                        color: 'primary.main',
                                                        width: 56,
                                                        height: 56,
                                                        borderRadius: 2
                                                    }}
                                                >
                                                    <BusinessIcon />
                                                </Avatar>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                                                        {mapping.job_role?.title || 'Job Role'}
                                                    </Typography>
                                                    <Stack direction="row" spacing={2} divider={<Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto' }} />}>
                                                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                                            {mapping.job_role?.company?.name || 'Unknown Company'}
                                                        </Typography>
                                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                                            <CalendarIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                                                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                                                MAPPED {formatDate(mapping.mapped_at).toUpperCase()}
                                                            </Typography>
                                                        </Stack>
                                                    </Stack>
                                                </Box>
                                            </Stack>
                                        </Grid>

                                        <Grid size={{ xs: 12, md: 3 }}>
                                            <Box sx={{ textAlign: { xs: 'left', md: 'center' }, pl: { xs: 9, md: 0 } }}>
                                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled', display: 'block', mb: 1 }}>
                                                    PROFILE MATCH SCORE
                                                </Typography>
                                                <Chip 
                                                    icon={<MatchIcon sx={{ fontSize: '14px !important' }} />}
                                                    label={`${mapping.match_score}% Match`} 
                                                    sx={{ 
                                                        fontWeight: 900,
                                                        fontSize: '0.875rem',
                                                        px: 1,
                                                        height: 32,
                                                        bgcolor: mapping.match_score >= 75 ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.warning.main, 0.1),
                                                        color: mapping.match_score >= 75 ? 'success.dark' : 'warning.dark',
                                                        border: '1px solid',
                                                        borderColor: mapping.match_score >= 75 ? alpha(theme.palette.success.main, 0.2) : alpha(theme.palette.warning.main, 0.2)
                                                    }} 
                                                />
                                            </Box>
                                        </Grid>

                                        <Grid size={{ xs: 12, md: 2 }}>
                                            <Box sx={{ textAlign: 'right' }}>
                                                <Tooltip title="View Job Role Details">
                                                    <Button
                                                        variant="text"
                                                        color="primary"
                                                        endIcon={<ArrowForwardIcon />}
                                                        sx={{ fontWeight: 700, textTransform: 'none' }}
                                                        onClick={() => navigate(`/job-roles/${mapping.job_role_id}`)}
                                                    >
                                                        Details
                                                    </Button>
                                                </Tooltip>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                <Box sx={{ 
                    mt: 4, 
                    p: 3, 
                    borderRadius: 3, 
                    bgcolor: alpha(theme.palette.info.main, 0.04),
                    border: '1px solid',
                    borderColor: alpha(theme.palette.info.main, 0.1),
                    display: 'flex',
                    gap: 2.5
                }}>
                    <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main', width: 32, height: 32 }}>
                        <InfoIcon sx={{ fontSize: 20 }} />
                    </Avatar>
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'info.dark', mb: 0.5 }}>
                            Recruitment Pipeline Tracking
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.5 }}>
                            These mappings represent initial profile matching. You can track individual interview stages, 
                            technical rounds, and final offer status within the dedicated Placement Dashboard.
                        </Typography>
                    </Box>
                </Box>
            </SectionCard>
        </Stack>
    );
};

export default CandidatePlacementTab;
