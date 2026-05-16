import React, { useState, useEffect, useCallback } from 'react';
import {
    Typography,
    Button,
    TextField,
    Box,
    Stack,
    CircularProgress,
    Chip,
    Checkbox,
    FormControlLabel,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Collapse,
    Autocomplete,
    useTheme,
    alpha
} from '@mui/material';
import {
    Email as EmailIcon,
    Subject as SubjectIcon,
    Message as MessageIcon,
    AttachFile as AttachIcon,
    Groups as GroupsIcon,
    ExpandLess,
    ExpandMore,
    Description as DocIcon
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchAvailableDocuments } from '../../../../store/slices/placementEmailSlice';
import BaseDialog from '../../../common/dialogbox/BaseDialog';

interface CandidateEmailDialogProps {
    open: boolean;
    onClose: () => void;
    onSend: (data: { email: string; cc?: string; subject: string; message: string; document_ids: number[] }) => void;
    mappingIds: number[];
    candidateNames: string[];
    jobTitle: string;
    contactEmail: string;
    contactName: string;
    loading?: boolean;
}

const CandidateEmailDialog: React.FC<CandidateEmailDialogProps> = ({
    open,
    onClose,
    onSend,
    mappingIds,
    candidateNames,
    jobTitle,
    contactEmail,
    contactName,
    loading = false
}) => {
    const theme = useTheme();
    const [emails, setEmails] = useState<string[]>(contactEmail ? [contactEmail] : []);
    const [ccEmails, setCcEmails] = useState<string[]>([]);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    
    // Document Selection State from Redux
    const { availableDocuments: availableDocs, fetchLoading: fetchingDocs } = useAppSelector(state => state.placementEmail);
    const dispatch = useAppDispatch();
    
    const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);
    const [expandedCandidates, setExpandedCandidates] = useState<Record<number, boolean>>({});

    const isBulk = mappingIds.length > 1;

    const fetchDocuments = useCallback(async () => {
        if (!mappingIds.length) return;
        try {
            const docs = await dispatch(fetchAvailableDocuments(mappingIds)).unwrap();
            
            // Auto-select latest resumes
            const resumeIds: number[] = [];
            docs.forEach(cGroup => {
                const resumes = cGroup.documents.filter(d => d.type === 'resume');
                if (resumes.length > 0) {
                    resumeIds.push(resumes[0].id);
                }
            });
            setSelectedDocIds(resumeIds);
            
            // Expand all by default
            const expanded: Record<number, boolean> = {};
            docs.forEach(d => expanded[d.mapping_id] = true);
            setExpandedCandidates(expanded);
        } catch (error) {
            console.error('Failed to fetch candidate documents', error);
        }
    }, [mappingIds, dispatch]);

    useEffect(() => {
        if (open) {
            setEmails(contactEmail ? [contactEmail] : []);
            
            let namesStr = candidateNames[0];
            if (isBulk) {
                namesStr = `${candidateNames.slice(0, 2).join(', ')}`;
                if (candidateNames.length > 2) {
                    namesStr += ` and ${candidateNames.length - 2} others`;
                }
            }

            const defaultSubject = isBulk 
                ? `Candidate Profiles for ${jobTitle} - ${namesStr}`
                : `Profile for ${jobTitle} - ${candidateNames[0]}`;
                
            setSubject(defaultSubject);

            const defaultMessage = isBulk
                ? `Dear ${contactName},\n\nI hope this email finds you well.\n\nWe are pleased to share the profiles of the following candidates for the ${jobTitle} position at your organization:\n\n${candidateNames.map(n => `- ${n}`).join('\n')}\n\nPlease find the attached documents for your review. We look forward to your feedback and scheduling the next steps.\n\nBest regards,\nWinVinaya Placement Team`
                : `Dear ${contactName},\n\nI hope this email finds you well.\n\nWe are pleased to share the profile of ${candidateNames[0]} for the ${jobTitle} position at your organization. \n\nPlease find the attached documents for your review. We look forward to your feedback and scheduling the next steps.\n\nBest regards,\nWinVinaya Placement Team`;
            
            setMessage(defaultMessage);
            fetchDocuments();
        }
    }, [open, candidateNames, jobTitle, contactEmail, contactName, isBulk, fetchDocuments]);

    const handleToggleDoc = (docId: number) => {
        setSelectedDocIds(prev => 
            prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
        );
    };

    const handleToggleExpand = (mappingId: number) => {
        setExpandedCandidates(prev => ({ ...prev, [mappingId]: !prev[mappingId] }));
    };

    const handleSend = () => {
        if (emails.length > 0 && subject.trim() && message.trim()) {
            onSend({ 
                email: emails.join(', '), 
                cc: ccEmails.join(', '), 
                subject, 
                message, 
                document_ids: selectedDocIds 
            });
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const actions = (
        <>
            <Typography variant="caption" sx={{ flexGrow: 1, ml: 2, fontWeight: 700, color: theme.palette.primary.main }}>
                {selectedDocIds.length} Total Attachments
            </Typography>
            <Button onClick={onClose} disabled={loading} sx={{ color: theme.palette.text.secondary }}>
                Cancel
            </Button>
            <Button
                onClick={handleSend}
                variant="contained"
                disabled={loading || emails.length === 0 || !subject.trim() || !message.trim()}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <EmailIcon />}
                sx={{
                    bgcolor: theme.palette.primary.main,
                    px: 4,
                    '&:hover': { bgcolor: theme.palette.primary.dark }
                }}
            >
                {loading ? 'Sending...' : isBulk ? 'Send All Profiles' : 'Send Profile'}
            </Button>
        </>
    );

    const emailInputStyles = {
        '& .MuiOutlinedInput-root': { 
            borderRadius: '6px',
            bgcolor: '#ffffff',
            '& fieldset': { borderColor: theme.palette.divider },
            '&:hover fieldset': { borderColor: theme.palette.primary.main },
            '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main }
        }
    };

    return (
        <BaseDialog 
            open={open} 
            onClose={onClose} 
            maxWidth="md" 
            title={isBulk ? `Send ${candidateNames.length} Candidate Profiles` : 'Send Candidate Profile'}
            subtitle={`Share profiles for the ${jobTitle} position`}
            loading={loading}
            actions={actions}
        >
            <Stack spacing={4}>
                <Box sx={{ borderBottom: `1px solid ${theme.palette.divider}`, pb: 4 }}>
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="awsFieldLabel" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EmailIcon sx={{ fontSize: 16 }} /> RECIPIENT EMAIL
                            </Typography>
                            <Autocomplete
                                multiple
                                freeSolo
                                options={[]}
                                value={emails}
                                onChange={(_e, newValue) => setEmails(newValue as string[])}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Chip
                                            label={option}
                                            {...getTagProps({ index })}
                                            size="small"
                                            sx={{ borderRadius: '4px', fontWeight: 600 }}
                                        />
                                    ))
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Type email and press enter"
                                        size="small"
                                        variant="outlined"
                                        sx={emailInputStyles}
                                    />
                                )}
                            />
                        </Box>
                        
                        <Box>
                            <Typography variant="awsFieldLabel" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EmailIcon sx={{ fontSize: 16 }} /> CC RECIPIENTS (OPTIONAL)
                            </Typography>
                            <Autocomplete
                                multiple
                                freeSolo
                                options={[]}
                                value={ccEmails}
                                onChange={(_e, newValue) => setCcEmails(newValue as string[])}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Chip
                                            label={option}
                                            {...getTagProps({ index })}
                                            size="small"
                                            sx={{ borderRadius: '4px', fontWeight: 600 }}
                                        />
                                    ))
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Type email and press enter"
                                        size="small"
                                        variant="outlined"
                                        sx={emailInputStyles}
                                    />
                                )}
                            />
                        </Box>

                        <Box>
                            <Typography variant="awsFieldLabel" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <SubjectIcon sx={{ fontSize: 16 }} /> SUBJECT
                            </Typography>
                            <TextField
                                fullWidth
                                variant="outlined"
                                size="small"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                            />
                        </Box>

                        <Box>
                            <Typography variant="awsFieldLabel" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <MessageIcon sx={{ fontSize: 16 }} /> MESSAGE
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={6}
                                variant="outlined"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '6px' } }}
                            />
                        </Box>
                    </Stack>
                </Box>

                <Box>
                    <Typography variant="awsSectionTitle" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AttachIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} /> SELECT DOCUMENTS TO ATTACH
                    </Typography>

                    {fetchingDocs ? (
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <CircularProgress size={30} sx={{ color: theme.palette.primary.main }} />
                            <Typography variant="body2" sx={{ mt: 1, color: theme.palette.text.secondary }}>Fetching candidate documents...</Typography>
                        </Box>
                    ) : availableDocs.length > 0 ? (
                        <List sx={{ bgcolor: theme.palette.background.default, borderRadius: '8px', border: `1px solid ${theme.palette.divider}`, p: 0 }}>
                            {availableDocs.map((cGroup) => (
                                <React.Fragment key={cGroup.mapping_id}>
                                    <ListItem 
                                        disablePadding
                                        sx={{ 
                                            borderBottom: `1px solid ${theme.palette.divider}`,
                                            bgcolor: theme.palette.background.paper,
                                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) }
                                        }}
                                    >
                                        <ListItemButton onClick={() => handleToggleExpand(cGroup.mapping_id)}>
                                            <ListItemIcon sx={{ minWidth: 40 }}>
                                                <GroupsIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />
                                            </ListItemIcon>
                                            <ListItemText 
                                                primary={cGroup.candidate_name} 
                                                primaryTypographyProps={{ variant: 'body2', fontWeight: 700, color: theme.palette.text.primary }}
                                                secondary={`${cGroup.documents.length} Available Documents`}
                                            />
                                            {expandedCandidates[cGroup.mapping_id] ? <ExpandLess /> : <ExpandMore />}
                                        </ListItemButton>
                                    </ListItem>
                                    <Collapse in={expandedCandidates[cGroup.mapping_id]} timeout="auto" unmountOnExit>
                                        <List component="div" disablePadding>
                                            {cGroup.documents.map((doc) => (
                                                <ListItem 
                                                    key={doc.id}
                                                    sx={{ 
                                                        pl: 6, 
                                                        py: 1, 
                                                        bgcolor: selectedDocIds.includes(doc.id) ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                                                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                                        '&:last-child': { borderBottom: 'none' }
                                                    }}
                                                >
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox 
                                                                size="small" 
                                                                checked={selectedDocIds.includes(doc.id)} 
                                                                onChange={() => handleToggleDoc(doc.id)}
                                                            />
                                                        }
                                                        label={
                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                <DocIcon sx={{ fontSize: 16, color: doc.type === 'resume' ? theme.palette.success.main : theme.palette.text.secondary }} />
                                                                <Typography variant="body2" sx={{ fontWeight: doc.type === 'resume' ? 700 : 500 }}>
                                                                    {doc.name}
                                                                </Typography>
                                                                {doc.type === 'resume' && (
                                                                    <Chip label="Resume" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main }} />
                                                                )}
                                                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                                                    ({formatSize(doc.size)})
                                                                </Typography>
                                                            </Stack>
                                                        }
                                                        sx={{ width: '100%', m: 0 }}
                                                    />
                                                </ListItem>
                                            ))}
                                            {cGroup.documents.length === 0 && (
                                                <ListItem sx={{ pl: 6, py: 2 }}>
                                                    <Typography variant="caption" sx={{ fontStyle: 'italic', color: theme.palette.text.secondary }}>
                                                        No documents found for this candidate.
                                                    </Typography>
                                                </ListItem>
                                            )}
                                        </List>
                                    </Collapse>
                                </React.Fragment>
                            ))}
                        </List>
                    ) : (
                        <Box sx={{ p: 4, bgcolor: alpha(theme.palette.warning.main, 0.05), border: `1px dashed ${theme.palette.warning.light}`, borderRadius: '8px', textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ color: theme.palette.warning.dark, fontWeight: 600 }}>
                                No documents found for the selected candidates. Resumes are required for attachments.
                            </Typography>
                        </Box>
                    )}
                    <Typography variant="caption" sx={{ mt: 1, display: 'block', color: theme.palette.text.secondary, fontStyle: 'italic' }}>
                        * Selected documents will be sent as email attachments.
                    </Typography>
                </Box>
            </Stack>
        </BaseDialog>
    );
};

export default CandidateEmailDialog;
