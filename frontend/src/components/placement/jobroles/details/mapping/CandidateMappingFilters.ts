import type { FilterField } from '../../../../common/drawer/FilterDrawer';

export const CANDIDATE_MAPPING_FILTER_FIELDS: FilterField[] = [
    {
        key: 'minScore',
        label: 'Minimum Match Score',
        type: 'single-select',
        options: [
            { value: '90', label: '90% and above' },
            { value: '80', label: '80% and above' },
            { value: '70', label: '70% and above' },
            { value: '50', label: '50% and above' },
        ]
    },
    {
        key: 'skills',
        label: 'Search Candidate Skills',
        type: 'searchable-multi-select',
    },
    {
        key: 'experience',
        label: 'Years of Experience',
        type: 'range',
    }
];

export interface CandidateMappingFiltersState {
    minScore: string;
    skills: string[];
    disability: string[];
    qualification: string[];
    experience: {
        min?: string;
        max?: string;
    };
}

export const INITIAL_FILTERS: CandidateMappingFiltersState = {
    minScore: '',
    skills: [],
    disability: [],
    qualification: [],
    experience: {
        min: '',
        max: ''
    }
};
