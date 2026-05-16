import React from 'react';
import {
    Grid,
    FormControlLabel,
    Switch,
    Typography,
    Box,
    Alert,
    TextField,
    Stack,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { CandidateCreate } from '../../../../models/candidate';
import { Work as WorkIcon } from '@mui/icons-material';

interface ExperienceStepProps {
    formData: CandidateCreate;
    onChange: (data: Partial<CandidateCreate>) => void;
    errors?: Record<string, string>;
}

const ExperienceStep: React.FC<ExperienceStepProps> = ({
    formData,
    onChange,
    errors = {},
}) => {
    const theme = useTheme();

    const handleSwitchChange = (field: keyof NonNullable<CandidateCreate['work_experience']>) => (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        onChange({
            work_experience: {
                ...formData.work_experience!,
                [field]: event.target.checked,
            },
        });
    };

    const handleExperienceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const val = event.target.value;

        // Allow empty string for clearing
        if (val === '') {
            onChange({
                work_experience: {
                    ...formData.work_experience!,
                    year_of_experience: '',
                },
            });
            return;
        }

        // Basic numeric and decimal point validation
        // Allows digits and at most one decimal point
        if (!/^\d*\.?\d*$/.test(val)) return;

        const parts = val.split('.');
        const years = parseInt(parts[0], 10);

        // Constraint: years should not exceed 50
        if (years > 50) return;

        // Limit to 2 decimal places
        if (parts.length > 1 && parts[1].length > 2) return;

        // Validate months (decimal part) if present
        if (parts.length > 1 && parts[1].length > 0) {
            const monthsString = parts[1];
            const months = parseInt(monthsString, 10);

            // Constraint: decimal part should not exceed 12
            if (months > 11) return;
        }

        onChange({
            work_experience: {
                ...formData.work_experience!,
                year_of_experience: val,
            },
        });
    };

    return (
        <Box>
            <Typography
                variant="h6"
                gutterBottom
                sx={{
                    color: theme.palette.secondary.main,
                    fontWeight: 600,
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                }}
            >
                <WorkIcon /> Work Experience
            </Typography>

            <Alert severity="info" sx={{ mb: 4 }}>
                This information helps us understand your background better. You can skip this section if you don't have any work experience.
            </Alert>

            <Grid container spacing={4}>
                <Grid size={{ xs: 12 }}>
                    <Box
                        sx={{
                            p: 3,
                            border: `1px solid ${errors.year_of_experience ? theme.palette.error.main : theme.palette.divider}`,
                            borderRadius: 2,
                            backgroundColor: theme.palette.background.default,
                        }}
                    >
                        <Stack spacing={3}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.work_experience?.is_experienced || false}
                                        onChange={handleSwitchChange('is_experienced')}
                                        color="primary"
                                        inputProps={{ 'aria-label': 'Do you have any work experience?' }}
                                    />
                                }
                                label={
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight={600}>
                                            Do you have any work experience?
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Select 'Yes' if you have formal work experience
                                        </Typography>
                                    </Box>
                                }
                                sx={{ ml: 0 }}
                            />

                            {formData.work_experience?.is_experienced && (
                                <Box sx={{ mt: 2 }}>
                                    <Grid container spacing={3}>
                                        <Grid size={{ xs: 12, md: 6 }}>
                                            <TextField
                                                fullWidth
                                                required={formData.work_experience?.is_experienced}
                                                label="Years of Experience"
                                                value={formData.work_experience?.year_of_experience || ''}
                                                onChange={handleExperienceChange}
                                                variant="outlined"
                                                placeholder="e.g. 2.05 (2 years 5 months)"
                                                error={!!errors.year_of_experience}
                                                helperText={errors.year_of_experience || "Format: Years.Months (Max 50 years, Months should be between 0 and 11)"}
                                                slotProps={{
                                                    htmlInput: {
                                                        inputMode: 'decimal',
                                                        'aria-invalid': !!errors.year_of_experience,
                                                        'aria-required': 'true',
                                                    }
                                                }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12 }}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={formData.work_experience?.currently_employed || false}
                                                        onChange={handleSwitchChange('currently_employed')}
                                                        color="primary"
                                                        inputProps={{ 'aria-label': 'Are you currently employed?' }}
                                                    />
                                                }
                                                label={
                                                    <Box>
                                                        <Typography variant="subtitle2" fontWeight={600}>
                                                            Are you currently employed?
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            This helps us understand your availability
                                                        </Typography>
                                                    </Box>
                                                }
                                                sx={{ ml: 0 }}
                                            />
                                        </Grid>

                                    </Grid>
                                </Box>
                            )}
                        </Stack>
                    </Box>
                </Grid>

                {!formData.work_experience?.is_experienced && (
                    <Grid size={{ xs: 12 }}>
                        <Alert severity="success">
                            <Typography variant="body2">
                                No problem! Many opportunities are available for freshers. Focus on highlighting your education and projects.
                            </Typography>
                        </Alert>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

export default ExperienceStep;