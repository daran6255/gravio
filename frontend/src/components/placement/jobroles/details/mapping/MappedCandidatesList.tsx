import React from 'react';
import {
    Box,
    Typography,
    Stack,
    Button,
    Paper,
    Tooltip,
    List,
    ListItem,
    Avatar,
    Checkbox,
    alpha,
    IconButton,
    useTheme
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
    TaskAlt as TaskAltIcon,
    AlternateEmail as EmailIcon,
    Info as InfoIcon,
    LinkOff as UnmapIcon
} from '@mui/icons-material';
import { type CandidateMatchResult } from '../../../../../store/slices/placementMappingSlice';

interface MappedCandidatesListProps {
    mapped: CandidateMatchResult[];
    selectedMappings: number[];
    onToggleSelection: (mappingId: number) => void;
    onSelectAll: (checked: boolean) => void;
    onEmailClick: () => void;
    getScoreColor: (score: number) => string;
    onUnmap: (candidate: CandidateMatchResult) => void;
}

const MappedCandidatesList: React.FC<MappedCandidatesListProps> = ({
    mapped,
    selectedMappings,
    onToggleSelection,
    onSelectAll,
    onEmailClick,
    getScoreColor,
    onUnmap,
}) => {
    const theme = useTheme();
    const navigate = useNavigate();
    return (
        <Paper
            variant="outlined"
            sx={{
                borderRadius: 0,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`
            }}
        >
            {/* Professional Section Header */}
            <Box sx={{
                p: 2,
                bgcolor: theme.palette.background.default,
                borderBottom: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                minHeight: '56px'
            }}>
                <Stack direction="row" spacing={1.25} alignItems="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: theme.palette.success.main, borderRadius: '4px', p: 0.5 }}>
                        <TaskAltIcon sx={{ color: 'white', fontSize: 16 }} />
                    </Box>
                    <Typography variant="awsSectionTitle">
                        Mapped Candidates ({mapped.length})
                    </Typography>
                </Stack>

                {mapped.length > 0 && (
                    <Tooltip title={selectedMappings.length > 0 ? `Send ${selectedMappings.length} Profiles` : "Select candidates to bulk email"}>
                        <span>
                            <Button
                                size="small"
                                variant="outlined"
                                disabled={selectedMappings.length === 0}
                                onClick={onEmailClick}
                                startIcon={<EmailIcon sx={{ fontSize: '16px !important' }} />}
                                sx={{
                                    fontSize: '0.75rem',
                                    py: 0.25,
                                    px: 1.5,
                                    borderColor: theme.palette.divider,
                                    color: theme.palette.text.primary,
                                    bgcolor: theme.palette.background.paper,
                                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08), borderColor: theme.palette.primary.main, color: theme.palette.primary.main },
                                    '&.Mui-disabled': { bgcolor: theme.palette.background.default, color: theme.palette.text.disabled }
                                }}
                            >
                                Send
                            </Button>
                        </span>
                    </Tooltip>
                )}
            </Box>

            {/* Compact Selection Bar */}
            {mapped.length > 0 && (
                <Box sx={{
                    px: 2,
                    py: 0.75,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Checkbox
                            size="small"
                            indeterminate={selectedMappings.length > 0 && selectedMappings.length < mapped.length}
                            checked={mapped.length > 0 && selectedMappings.length === mapped.length}
                            onChange={(e) => onSelectAll(e.target.checked)}
                            sx={{ p: 0, color: theme.palette.primary.main }}
                        />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                            {selectedMappings.length > 0 ? `${selectedMappings.length} Selected` : 'Select All'}
                        </Typography>
                    </Stack>

                    {selectedMappings.length > 0 && (
                        <Button
                            size="small"
                            onClick={() => onSelectAll(false)} // Clear selection
                            sx={{ fontSize: '0.65rem', fontWeight: 700, color: theme.palette.text.secondary, minWidth: 'auto', p: 0 }}
                        >
                            Clear
                        </Button>
                    )}
                </Box>
            )}

            {/* Candidate List */}
            <List sx={{ p: 0, flexGrow: 1, maxHeight: 520, overflow: 'auto' }}>
                {mapped.length > 0 ? (
                    mapped.map((candidate) => (
                        <React.Fragment key={candidate.public_id}>
                            <ListItem
                                sx={{
                                    py: 1.5,
                                    px: 2,
                                    borderBottom: `1px solid ${theme.palette.divider}`,
                                    transition: 'background-color 0.2s',
                                    cursor: 'pointer',
                                    '&:hover': { bgcolor: theme.palette.background.default },
                                    '&:last-child': { borderBottom: 'none' }
                                }}
                                onClick={() => onToggleSelection(candidate.mapping_id!)}
                            >
                                <Checkbox
                                    size="small"
                                    checked={selectedMappings.includes(candidate.mapping_id!)}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={() => onToggleSelection(candidate.mapping_id!)}
                                    sx={{ mr: 1, p: 0 }}
                                />

                                <Stack 
                                    direction="row" 
                                    spacing={1.5} 
                                    sx={{ flexGrow: 1 }} 
                                    alignItems="center"
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent toggling selection when clicking name/avatar
                                        navigate(`/candidates/${candidate.public_id}`);
                                    }}
                                >
                                    <Avatar
                                        sx={{
                                            width: 30,
                                            height: 30,
                                            bgcolor: getScoreColor(candidate.match_score),
                                            fontSize: '0.75rem',
                                            fontWeight: 800,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {candidate.name[0]}
                                    </Avatar>

                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography 
                                            variant="body2" 
                                            sx={{ fontWeight: 700, color: theme.palette.primary.main, lineHeight: 1.2, '&:hover': { textDecoration: 'underline' }, cursor: 'pointer' }}
                                        >
                                            {candidate.name}
                                        </Typography>
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>
                                            <Box sx={{
                                                px: 0.75,
                                                py: 0.1,
                                                bgcolor: alpha(getScoreColor(candidate.match_score), 0.1),
                                                borderRadius: '2px',
                                                border: `1px solid ${alpha(getScoreColor(candidate.match_score), 0.2)}`
                                            }}>
                                                <Typography variant="caption" sx={{ fontWeight: 800, color: getScoreColor(candidate.match_score), fontSize: '0.65rem' }}>
                                                    {candidate.match_score}%
                                                </Typography>
                                            </Box>
                                            <Box sx={{ bgcolor: theme.palette.background.default, px: 0.75, py: 0.1, borderRadius: '2px', border: `1px solid ${theme.palette.divider}` }}>
                                                <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.text.secondary, fontSize: '0.65rem' }}>
                                                    {candidate.year_of_experience || 'Fresher'}
                                                </Typography>
                                            </Box>
                                            {candidate.other_mappings_count > 0 && (
                                                <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), px: 0.75, py: 0.1, borderRadius: '2px', border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
                                                    <Typography variant="caption" sx={{ fontWeight: 800, color: theme.palette.primary.main, fontSize: '0.65rem' }}>
                                                        +{candidate.other_mappings_count}
                                                    </Typography>
                                                </Box>
                                            )}
                                            <Typography variant="caption" sx={{ color: theme.palette.text.disabled, fontSize: '0.65rem' }}>
                                                {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                            </Typography>
                                        </Stack>
                                    </Box>
                                </Stack>

                                <Tooltip title="Unmap candidate from this role">
                                    <IconButton 
                                        size="small" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onUnmap(candidate);
                                        }}
                                        sx={{ 
                                            visibility: 'hidden', 
                                            '.MuiListItem-root:hover &': { visibility: 'visible' },
                                            color: theme.palette.error.main,
                                            '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.05) }
                                        }}
                                    >
                                        <UnmapIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Tooltip>
                            </ListItem>
                        </React.Fragment>
                    ))
                ) : (
                    <Box sx={{ p: 4, textAlign: 'center', mt: 4, opacity: 0.6 }}>
                        <InfoIcon sx={{ fontSize: 32, color: theme.palette.text.disabled, mb: 1 }} />
                        <Typography variant="body2" color="textSecondary">
                            No candidates mapped yet.
                        </Typography>
                    </Box>
                )}
            </List>
        </Paper>
    );
};

export default MappedCandidatesList;
