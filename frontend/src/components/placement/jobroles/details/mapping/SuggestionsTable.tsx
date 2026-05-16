import React from 'react';
import {
    Box,
    Typography,
    Stack,
    Tooltip,
    Chip,
    Avatar,
    TableRow,
    TableCell,
    Checkbox,
    useTheme,
    alpha
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
    School as SchoolIcon,
    AccessibilityNew as DisabilityIcon,
    Psychology as SkillIcon,
} from '@mui/icons-material';
import DataTable, { type ColumnDefinition } from '../../../../common/table/DataTable';
import { type CandidateMatchResult } from '../../../../../store/slices/placementMappingSlice';

interface SuggestionsTableProps {
    candidates: CandidateMatchResult[];
    loading: boolean;
    page: number;
    rowsPerPage: number;
    totalCount: number;
    onPageChange: (newPage: number) => void;
    onRowsPerPageChange: (newRowsPerPage: number) => void;
    getScoreColor: (score: number) => string;
    // Selection Props
    selectedIds: number[];
    onToggleSelect: (candidateId: number) => void;
    onSelectAll: (event: React.ChangeEvent<HTMLInputElement>) => void;
    // Header Props
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onRefresh: () => void;
    onFilterOpen: () => void;
    activeFilterCount: number;
    headerActions?: React.ReactNode;
}

const SuggestionsTable: React.FC<SuggestionsTableProps> = ({
    candidates,
    loading,
    page,
    rowsPerPage,
    totalCount,
    onPageChange,
    onRowsPerPageChange,
    getScoreColor,
    selectedIds,
    onToggleSelect,
    onSelectAll,
    searchTerm,
    onSearchChange,
    onRefresh,
    onFilterOpen,
    activeFilterCount,
    headerActions,
}) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const columns: ColumnDefinition<CandidateMatchResult>[] = [
        { id: 'name', label: 'CANDIDATE', width: '30%' },
        { id: 'match_score', label: 'SCORE', align: 'center', width: '12%' },
        { id: 'skill_match', label: 'MATCH DETAILS', width: '33%' },
        { id: 'year_of_experience', label: 'EXP', align: 'center', width: '10%' },
        { id: 'other_mappings_count', label: 'MAPPINGS', width: '15%' },
    ];

    const renderRow = (candidate: CandidateMatchResult) => {
        const isSelected = selectedIds.includes(candidate.candidate_id);
        
        return (
            <TableRow 
                key={candidate.public_id} 
                hover 
                selected={isSelected}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
                <TableCell padding="checkbox">
                    <Checkbox
                        size="small"
                        checked={isSelected}
                        onChange={() => onToggleSelect(candidate.candidate_id)}
                        sx={{ color: theme.palette.divider, '&.Mui-checked': { color: theme.palette.primary.main } }}
                    />
                </TableCell>
                <TableCell sx={{ py: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar 
                            sx={{ bgcolor: getScoreColor(candidate.match_score), width: 32, height: 32, fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer' }}
                            onClick={() => navigate(`/candidates/${candidate.public_id}`)}
                        >
                            {candidate.name[0]}
                        </Avatar>
                        <Typography 
                            variant="body2" 
                            sx={{ fontWeight: 700, color: theme.palette.primary.main, '&:hover': { textDecoration: 'underline' }, cursor: 'pointer' }}
                            onClick={() => navigate(`/candidates/${candidate.public_id}`)}
                        >
                            {candidate.name}
                        </Typography>
                    </Stack>
                </TableCell>
                <TableCell align="center">
                    <Typography variant="body2" sx={{ fontWeight: 800, color: getScoreColor(candidate.match_score) }}>
                        {candidate.match_score}%
                    </Typography>
                </TableCell>
                <TableCell>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                        <Tooltip title={candidate.skill_match.details}>
                            <Chip
                                icon={<SkillIcon style={{ fontSize: 14 }} />}
                                label="Skills"
                                size="small"
                                variant="outlined"
                                color={candidate.skill_match.is_match ? "success" : "default"}
                                sx={{ height: 22, fontSize: '0.7rem', px: 0.5 }}
                            />
                        </Tooltip>
                        <Tooltip title={candidate.qualification_match.details}>
                            <Chip
                                icon={<SchoolIcon style={{ fontSize: 14 }} />}
                                label="Edu"
                                size="small"
                                variant="outlined"
                                color={candidate.qualification_match.is_match ? "success" : "default"}
                                sx={{ height: 22, fontSize: '0.7rem', px: 0.5 }}
                            />
                        </Tooltip>
                        <Tooltip title={candidate.disability_match.details}>
                            <Chip
                                icon={<DisabilityIcon style={{ fontSize: 14 }} />}
                                label="DMap"
                                size="small"
                                variant="outlined"
                                color={candidate.disability_match.is_match ? "success" : "default"}
                                sx={{ height: 22, fontSize: '0.7rem', px: 0.5 }}
                            />
                        </Tooltip>
                    </Stack>
                </TableCell>
                <TableCell align="center">
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        {candidate.year_of_experience || 'Fresher'}
                    </Typography>
                </TableCell>
                <TableCell>
                    {candidate.other_mappings_count > 0 ? (
                        <Tooltip title={`Mapped to: ${candidate.other_mappings.join(', ')}`}>
                            <Box
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    px: 1,
                                    py: 0.25,
                                    borderRadius: '4px',
                                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                                    color: theme.palette.primary.main,
                                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                }}
                            >
                                {candidate.other_mappings_count} {candidate.other_mappings_count === 1 ? 'Job' : 'Jobs'}
                            </Box>
                        </Tooltip>
                    ) : (
                        <Typography variant="body2" color="text.disabled">
                            None
                        </Typography>
                    )}
                </TableCell>
            </TableRow>
        );
    };

    return (
        <DataTable
            columns={columns}
            data={candidates}
            loading={loading}
            totalCount={totalCount}
            page={page}
            rowsPerPage={rowsPerPage}
            numSelected={selectedIds.length}
            onSelectAllClick={onSelectAll}
            onPageChange={(_e, p) => onPageChange(p)}
            onRowsPerPageChange={onRowsPerPageChange}
            renderRow={renderRow}
            emptyMessage="No suggestions available at the moment."
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            onRefresh={onRefresh}
            onFilterOpen={onFilterOpen}
            activeFilterCount={activeFilterCount}
            headerActions={headerActions}
            searchPlaceholder="Search suggestions by name..."
        />
    );
};

export default SuggestionsTable;
