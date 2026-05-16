import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box,
    CircularProgress,
    Grid,
    Button,
    Alert,
    Stack,
    Typography
} from '@mui/material';
import {
    GroupAdd as BulkIcon,
    InfoOutlined as InfoIcon
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
    fetchMatchesForJobRole,
    bulkMapCandidates,
    unmapCandidate,
    clearMatches,
    clearPlacementError,
    type CandidateMatchResult
} from '../../../../store/slices/placementMappingSlice';
import CandidateEmailDialog from '../../mapping/dialogs/CandidateEmailDialog';
import useToast from '../../../../hooks/useToast';
import type { JobRole } from '../../../../models/jobRole';
import { fetchAggregatedSkills } from '../../../../store/slices/skillSlice';
import { sendBulkProfiles } from '../../../../store/slices/placementEmailSlice';
import FilterDrawer from '../../../common/drawer/FilterDrawer';
import ConfirmationDialog from '../../../common/dialogbox/ConfirmationDialog';
import { CANDIDATE_MAPPING_FILTER_FIELDS, INITIAL_FILTERS, type CandidateMappingFiltersState } from './mapping/CandidateMappingFilters';

// Modular Components
import {
    SuggestionsTable,
    MappedCandidatesList,
    BulkMappingDialog
} from './mapping';

interface CandidateMappingTabProps {
    jobRole: JobRole;
}

const CandidateMappingTab: React.FC<CandidateMappingTabProps> = ({ jobRole }) => {
    const toast = useToast();
    const dispatch = useAppDispatch();

    // Redux State
    const { matches: matchingCandidates, loading, error: placementError } = useAppSelector((state) => state.placementMapping);

    // Auto-display errors from slice
    useEffect(() => {
        if (placementError) {
            toast.error(placementError);
            dispatch(clearPlacementError());
        }
    }, [placementError, toast, dispatch]);

    // UI States
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState<CandidateMappingFiltersState>(INITIAL_FILTERS);

    // Mapping State
    const [submitting, setSubmitting] = useState(false);
    const [unmapConfirmOpen, setUnmapConfirmOpen] = useState(false);
    const [candidateToUnmap, setCandidateToUnmap] = useState<CandidateMatchResult | null>(null);

    // Skills from Redux
    const { aggregatedSkills: allPossibleSkills } = useAppSelector(state => state.skills);

    // Email status from Redux
    const { sendLoading: sendingEmail } = useAppSelector(state => state.placementEmail);

    // Suggestions Selection State
    const [selectedCandidateIds, setSelectedCandidateIds] = useState<number[]>([]);
    const [bulkMapDialogOpen, setBulkMapDialogOpen] = useState(false);
    const [bulkMappingNotes, setBulkMappingNotes] = useState('');

    // Bulk Email State
    const [selectedMappings, setSelectedMappings] = useState<number[]>([]);
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);

    useEffect(() => {
        dispatch(fetchAggregatedSkills());
    }, [dispatch]);

    const fetchData = useCallback(async () => {
        dispatch(fetchMatchesForJobRole(jobRole.public_id));
    }, [jobRole.public_id, dispatch]);

    useEffect(() => {
        fetchData();
        return () => {
            dispatch(clearMatches());
        };
    }, [fetchData, dispatch]);

    // Filtering Logic
    const suggestions = useMemo(() => {
        return matchingCandidates.filter(c => {
            // Already mapped check
            if (c.is_already_mapped) return false;

            // Search term check (Name)
            if (searchTerm && !c.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;

            // Min Score filter
            if (activeFilters.minScore && c.match_score < parseInt(activeFilters.minScore, 10)) return false;

            // Skills filter (multi-select)
            if (activeFilters.skills.length > 0) {
                // Check if candidate has ANY of the selected skills
                if (!c.skills?.some(s => activeFilters.skills.includes(s))) return false;
            }

            // Disability multi-select filter
            if (activeFilters.disability.length > 0) {
                if (!c.disability || !activeFilters.disability.includes(c.disability)) return false;
            }

            // Qualification multi-select filter
            if (activeFilters.qualification.length > 0) {
                if (!c.qualification || !activeFilters.qualification.includes(c.qualification)) return false;
            }

            // Experience range filter
            const expValue = parseInt(String(c.year_of_experience || '0'), 10);
            if (activeFilters.experience.min && expValue < parseInt(activeFilters.experience.min, 10)) return false;
            if (activeFilters.experience.max && expValue > parseInt(activeFilters.experience.max, 10)) return false;

            return true;
        });
    }, [matchingCandidates, searchTerm, activeFilters]);

    const mapped = useMemo(() =>
        matchingCandidates.filter(c => c.is_already_mapped),
        [matchingCandidates]);

    const paginatedSuggestions = useMemo(() => {
        const start = page * rowsPerPage;
        return suggestions.slice(start, start + rowsPerPage);
    }, [suggestions, page, rowsPerPage]);

    // Dynamic Filter Options
    const dynamicFilterFields = useMemo(() => {
        const disabilities = Array.from(new Set(matchingCandidates.map(c => c.disability).filter((d): d is string => !!d)));
        const qualifications = Array.from(new Set(matchingCandidates.map(c => c.qualification).filter((q): q is string => !!q)));

        const fields = [...CANDIDATE_MAPPING_FILTER_FIELDS];

        // Populate skills options
        const skillField = fields.find(f => f.key === 'skills');
        if (skillField) {
            skillField.options = allPossibleSkills.map(s => ({ value: s, label: s }));
        }

        if (disabilities.length > 0) {
            fields.push({
                key: 'disability',
                label: 'Disability Type',
                type: 'multi-select',
                options: disabilities.map(d => ({ value: d, label: d }))
            });
        }

        if (qualifications.length > 0) {
            fields.push({
                key: 'qualification',
                label: 'Educational Qualification',
                type: 'multi-select',
                options: qualifications.map(q => ({ value: q, label: q }))
            });
        }

        return fields;
    }, [matchingCandidates]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (activeFilters.minScore) count++;
        if (activeFilters.skills.length > 0) count++;
        if (activeFilters.disability.length > 0) count++;
        if (activeFilters.qualification.length > 0) count++;
        if (activeFilters.experience.min || activeFilters.experience.max) count++;
        return count;
    }, [activeFilters]);

    // Handlers
    const handleSearchChange = (val: string) => {
        setSearchTerm(val);
        setPage(0);
        setSelectedCandidateIds([]); // Clear selection on search
    };

    const handleSelectToggle = (id: number) => {
        setSelectedCandidateIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleSelectAllSuggestions = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelectedCandidateIds(paginatedSuggestions.map(s => s.candidate_id));
        } else {
            setSelectedCandidateIds([]);
        }
    };

    const handleToggleSelection = (mappingId: number) => {
        setSelectedMappings(prev =>
            prev.includes(mappingId) ? prev.filter(id => id !== mappingId) : [...prev, mappingId]
        );
    };

    const handleSelectAllMappings = (checked: boolean) => {
        if (checked) {
            setSelectedMappings(mapped.map(m => m.mapping_id!).filter(Boolean));
        } else {
            setSelectedMappings([]);
        }
    };

    const handleFilterChange = (key: string, value: any) => {
        setActiveFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleClearFilters = () => {
        setActiveFilters(INITIAL_FILTERS);
        setIsFilterDrawerOpen(false);
    };

    const handleBulkMapClick = () => {
        setBulkMapDialogOpen(true);
    };

    const handleBulkMapConfirm = async () => {
        if (selectedCandidateIds.length === 0) return;

        setSubmitting(true);
        try {
            const mappings = selectedCandidateIds.map(id => {
                const candidate = suggestions.find(c => c.candidate_id === id);
                return {
                    candidate_id: id,
                    match_score: candidate?.match_score || 0
                };
            });

            await dispatch(bulkMapCandidates({
                job_role_id: jobRole.id!,
                mappings,
                notes: bulkMappingNotes
            })).unwrap();

            toast.success(`Successfully mapped ${selectedCandidateIds.length} candidates`);
            setBulkMapDialogOpen(false);
            setSelectedCandidateIds([]);
            setBulkMappingNotes('');
        } catch (error: any) {
            toast.error(error || 'Failed to bulk map candidates');
        } finally {
            setSubmitting(false);
        }
    };

    const bulkMapActions = useMemo(() => {
        if (selectedCandidateIds.length === 0) return null;
        return (
            <Button
                variant="contained"
                size="small"
                startIcon={<BulkIcon />}
                onClick={handleBulkMapClick}
                sx={{
                    bgcolor: '#ec7211',
                    '&:hover': { bgcolor: '#eb5f07' },
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    borderRadius: '4px',
                    ml: 1
                }}
            >
                Map {selectedCandidateIds.length} Selected
            </Button>
        );
    }, [selectedCandidateIds]);

    const handleSendBulkEmail = async (data: { email: string; cc?: string; subject: string; message: string; document_ids: number[] }) => {
        try {
            await dispatch(sendBulkProfiles({
                mapping_ids: selectedMappings,
                document_ids: data.document_ids,
                custom_email: data.email,
                custom_cc: data.cc,
                custom_subject: data.subject,
                custom_message: data.message
            })).unwrap();

            toast.success('Candidate profiles sent successfully');
            setEmailDialogOpen(false);
            setSelectedMappings([]);
        } catch (error: any) {
            toast.error(error || 'Failed to send bulk email');
        }
    };

    const handleUnmapClick = (candidate: CandidateMatchResult) => {
        setCandidateToUnmap(candidate);
        setUnmapConfirmOpen(true);
    };

    const handleConfirmUnmap = async () => {
        if (!candidateToUnmap) return;

        setSubmitting(true);
        try {
            await dispatch(unmapCandidate({
                candidateId: candidateToUnmap.candidate_id,
                jobRoleId: jobRole.id!
            })).unwrap();

            toast.success(`Successfully unmapped ${candidateToUnmap.name}`);
            setUnmapConfirmOpen(false);
            setCandidateToUnmap(null);
        } catch (error: any) {
            toast.error(error || 'Failed to unmap candidate');
        } finally {
            setSubmitting(false);
        }
    };

    const selectedCandidateNames = useMemo(() => {
        return matchingCandidates
            .filter(c => selectedMappings.includes(c.mapping_id!))
            .map(c => c.name);
    }, [matchingCandidates, selectedMappings]);

    const getScoreColor = (score: number) => {
        if (score >= 70) return '#1d8102';
        if (score >= 40) return '#ec7211';
        return '#d13212';
    };

    if (loading && matchingCandidates.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress sx={{ color: '#ec7211' }} />
            </Box>
        );
    }

    return (
        <Grid container spacing={4} sx={{ mt: 1 }}>
            {/* Closed/Expired Role Warning */}
            {(() => {
                const isExpired = jobRole.close_date && new Date(jobRole.close_date) < new Date(new Date().setHours(0, 0, 0, 0));
                const isClosed = jobRole.status === 'closed' || isExpired;

                if (!isClosed) return null;

                return (
                    <Grid size={{ xs: 12 }}>
                        <Alert
                            severity="info"
                            variant="outlined"
                            icon={<InfoIcon />}
                            sx={{
                                borderRadius: '4px',
                                bgcolor: 'rgba(0, 126, 185, 0.03)',
                                borderColor: 'rgba(0, 126, 185, 0.2)',
                                '& .MuiAlert-icon': { color: '#007eb9' }
                            }}
                        >
                            <Stack>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#007eb9' }}>
                                    {jobRole.status === 'closed' ? 'Job Role Closed' : 'Job Role Expired'}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#545b64' }}>
                                    This job role is currently {jobRole.status === 'closed' ? 'marked as closed' : 'past its closing date'}.
                                    You can still map candidates to it if needed for administrative or historical purposes.
                                </Typography>
                            </Stack>
                        </Alert>
                    </Grid>
                );
            })()}

            {/* Top/Left: Smart Suggestions Table */}
            <Grid size={{ xs: 12, md: 8.5 }}>
                <SuggestionsTable
                    candidates={paginatedSuggestions}
                    loading={loading}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    totalCount={suggestions.length}
                    onPageChange={(p) => {
                        setPage(p);
                        setSelectedCandidateIds([]); // Clear selection on page change
                    }}
                    onRowsPerPageChange={(v) => {
                        setRowsPerPage(v);
                        setPage(0);
                        setSelectedCandidateIds([]); // Clear selection on rows change
                    }}
                    getScoreColor={getScoreColor}
                    selectedIds={selectedCandidateIds}
                    onToggleSelect={handleSelectToggle}
                    onSelectAll={handleSelectAllSuggestions}
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                    onRefresh={fetchData}
                    onFilterOpen={() => setIsFilterDrawerOpen(true)}
                    activeFilterCount={activeFilterCount}
                    headerActions={bulkMapActions}
                />
            </Grid>

            {/* Bottom/Right: Mapped Candidates List */}
            <Grid size={{ xs: 12, md: 3.5 }}>
                <MappedCandidatesList
                    mapped={mapped}
                    selectedMappings={selectedMappings}
                    onToggleSelection={handleToggleSelection}
                    onSelectAll={handleSelectAllMappings}
                    onEmailClick={() => setEmailDialogOpen(true)}
                    getScoreColor={getScoreColor}
                    onUnmap={handleUnmapClick}
                />
            </Grid>

            {/* Bulk Map Candidates Dialog */}
            <BulkMappingDialog
                open={bulkMapDialogOpen}
                onClose={() => setBulkMapDialogOpen(false)}
                onConfirm={handleBulkMapConfirm}
                jobRole={jobRole}
                selectedCount={selectedCandidateIds.length}
                notes={bulkMappingNotes}
                onNotesChange={setBulkMappingNotes}
                submitting={submitting}
            />

            {/* Filter Drawer */}
            <FilterDrawer
                open={isFilterDrawerOpen}
                onClose={() => setIsFilterDrawerOpen(false)}
                fields={dynamicFilterFields}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                onApplyFilters={() => setIsFilterDrawerOpen(false)}
            />

            {/* Bulk Email Dialog Integration */}
            {jobRole.contact && (
                <CandidateEmailDialog
                    open={emailDialogOpen}
                    onClose={() => setEmailDialogOpen(false)}
                    onSend={handleSendBulkEmail}
                    mappingIds={selectedMappings}
                    candidateNames={selectedCandidateNames}
                    jobTitle={jobRole.title}
                    contactEmail={jobRole.contact.email || ''}
                    contactName={jobRole.contact.full_name || 'Hiring Manager'}
                    loading={sendingEmail}
                />
            )}

            {/* Unmap Confirmation Dialog */}
            <ConfirmationDialog
                open={unmapConfirmOpen}
                title="Unmap Candidate"
                message={`Are you sure you want to unmap ${candidateToUnmap?.name} from this job role? This will reset their placement status.`}
                confirmLabel="Yes, Unmap"
                onConfirm={handleConfirmUnmap}
                onClose={() => setUnmapConfirmOpen(false)}
                loading={submitting}
                severity="warning"
            />
        </Grid>
    );
};

export default CandidateMappingTab;
