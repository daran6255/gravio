import React from 'react';
import {
    Grid,
    FormControlLabel,
    Switch,
    Typography,
    Box,
    Alert,
    TextField,
    FormControl,
    Stack,
    Autocomplete,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { CandidateCreate } from '../../../../models/candidate';
import { Accessible as AccessibleIcon } from '@mui/icons-material';
import { disabilityTypes } from '../../../../data/Disabilities';

interface DisabilityStepProps {
    formData: CandidateCreate;
    onChange: (data: Partial<CandidateCreate>) => void;
    errors?: Record<string, string>;
}

const DisabilityStep: React.FC<DisabilityStepProps> = ({
    formData,
    onChange,
    errors = {},
}) => {
    const theme = useTheme();

    const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const isDisabled = event.target.checked;
        onChange({
            disability_details: {
                ...formData.disability_details,
                is_disabled: isDisabled,
                disability_type: isDisabled ? formData.disability_details?.disability_type || '' : '',
                disability_percentage: isDisabled ? formData.disability_details?.disability_percentage || 0 : 0,
            },
        });
    };

    const handleDisabilityAutocompleteChange = (_event: React.SyntheticEvent, newValue: string | null) => {
        onChange({
            disability_details: {
                ...formData.disability_details!,
                disability_type: newValue || '',
            },
        });
    };

    const handlePercentageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        let val = parseInt(event.target.value);
        if (!isNaN(val)) {
            if (val > 100) val = 100;
            else if (val < 0) val = 0;
        } else {
            val = 0;
        }
        onChange({
            disability_details: {
                ...formData.disability_details!,
                disability_percentage: val,
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
                <AccessibleIcon /> Disability Information
            </Typography>

            <Alert severity="info" sx={{ mb: 4 }}>
                This information is collected to help us provide appropriate accommodations and ensure equal opportunities. It will be kept confidential.
            </Alert>

            <Grid container spacing={4}>
                <Grid size={{ xs: 12 }}>
                    <Box
                        sx={{
                            p: 3,
                            border: `1px solid ${errors.disability_type || errors.disability_percentage ? theme.palette.error.main : theme.palette.divider}`,
                            borderRadius: 2,
                            backgroundColor: theme.palette.background.default,
                        }}
                    >
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.disability_details?.is_disabled || false}
                                    onChange={handleSwitchChange}
                                    color="primary"
                                    inputProps={{ 'aria-label': 'Do you have any disability?' }}
                                />
                            }
                            label={
                                <Box>
                                    <Typography variant="subtitle1" fontWeight={600}>
                                        Do you have any disability?
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Please select 'Yes' if you have a certified disability
                                    </Typography>
                                </Box>
                            }
                            sx={{ ml: 0 }}
                        />
                    </Box>
                </Grid>

                {formData.disability_details?.is_disabled && (
                    <>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth required error={!!errors.disability_type}>
                                <Autocomplete
                                    freeSolo
                                    options={disabilityTypes}
                                    value={formData.disability_details?.disability_type || ''}
                                    onChange={handleDisabilityAutocompleteChange}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            fullWidth
                                            label="Type of Disability"
                                            variant="outlined"
                                            error={!!errors.disability_type}
                                            helperText={errors.disability_type || "Select or type the type of disability"}
                                            required
                                            inputProps={{
                                                ...params.inputProps,
                                                'aria-invalid': !!errors.disability_type,
                                                'aria-required': 'true',
                                            }}
                                        />
                                    )}
                                />
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Disability Percentage (%)"
                                type="number"
                                value={formData.disability_details?.disability_percentage || ''}
                                onChange={handlePercentageChange}
                                variant="outlined"
                                inputProps={{
                                    min: 0,
                                    max: 100,
                                    'aria-invalid': !!errors.disability_percentage,
                                    'aria-required': 'true',
                                }}
                                error={!!errors.disability_percentage}
                                helperText={errors.disability_percentage || "Enter percentage from 0 to 100"}
                                required
                            />
                            <Stack direction="row" justifyContent="space-between" sx={{ mt: 1, px: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Less than 40%: Mild
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    40-75%: Moderate
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    75-100%: Severe
                                </Typography>
                            </Stack>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Additional Information (Optional)"
                                placeholder="If you need specific accommodations or have any other relevant information..."
                                variant="outlined"
                                helperText="This helps us provide better support"
                            />
                        </Grid>
                    </>
                )}

                {!formData.disability_details?.is_disabled && (
                    <Grid size={{ xs: 12 }}>
                        <Alert severity="success">
                            <Typography variant="body2">
                                Thank you for providing this information. Your registration will continue with the standard process.
                            </Typography>
                        </Alert>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

export default DisabilityStep;