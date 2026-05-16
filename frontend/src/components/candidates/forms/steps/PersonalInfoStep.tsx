import React from 'react';
import {
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    Typography,
    Box,
    Divider,
    Alert,
    CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { MuiTelInput } from 'mui-tel-input';
import { Metadata } from 'libphonenumber-js/core';
import metadata from 'libphonenumber-js/metadata.min.json';
import type { CandidateCreate } from '../../../../models/candidate';
import { candidateService } from '../../../../services/candidateService';
import { useEffect, useState } from 'react';

const preferredLengths: Record<string, number> = {
    'IN': 10, 'AF': 9, 'AL': 9, 'DZ': 9, 'AT': 13, 'AZ': 9, 'BS': 10, 'BE': 10, 
    'BR': 12, 'CA': 10, 'CN': 12, 'DK': 8, 'FR': 9, 'DE': 15, 'IT': 12, 'MX': 10, 
    'NL': 9, 'RU': 10, 'ZA': 10, 'GB': 10, 'US': 10, 'LK': 9
};

const getMaxLength = (countryCode: any) => {
    if (!countryCode) return 15;
    if (preferredLengths[countryCode]) return preferredLengths[countryCode];
    try {
        const meta = new Metadata(metadata as any);
        meta.selectNumberingPlan(countryCode);
        if (meta.numberingPlan) {
            const lengths = meta.numberingPlan.possibleLengths();
            return Math.max(...lengths);
        }
        return 15;
    } catch (e) {
        return 15;
    }
}

interface PersonalInfoStepProps {
    formData: CandidateCreate;
    onChange: (data: Partial<CandidateCreate>) => void;
    errors?: Record<string, string>;
    exclude_public_id?: string;
}

const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({
    formData,
    onChange,
    errors = {},
    exclude_public_id,
}) => {
    const theme = useTheme();
    const [isPincodeValid, setIsPincodeValid] = useState<boolean | null>(null);
    const [isValidatingPin, setIsValidatingPin] = useState(false);
    const [countryCode, setCountryCode] = useState<string>('IN');

    // Auto-lookup for Indian Pincodes
    useEffect(() => {
        const lookupPincode = async () => {
            if (countryCode === 'IN' && formData.pincode.length === 6) {
                setIsValidatingPin(true);
                try {
                    // Only send email/phone if they look valid to avoid backend 422 errors
                    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
                    
                    const response = await candidateService.checkAvailability({
                        email: isEmailValid ? formData.email : undefined,
                        phone: formData.phone.length > 5 ? formData.phone : undefined,
                        pincode: formData.pincode,
                        exclude_public_id
                    });

                    if (response.address && Object.keys(response.address).length > 0) {
                        onChange({
                            city: response.address.city,
                            district: response.address.district,
                            state: response.address.state
                        });
                        setIsPincodeValid(true);
                    } else {
                        setIsPincodeValid(false);
                    }
                } catch (error) {
                    setIsPincodeValid(false);
                } finally {
                    setIsValidatingPin(false);
                }
            } else if (countryCode !== 'IN') {
                setIsPincodeValid(false); // Always show manual for international
            } else {
                setIsPincodeValid(null);
            }
        };

        const timer = setTimeout(lookupPincode, 500);
        return () => clearTimeout(timer);
    }, [formData.pincode, countryCode, formData.email, formData.phone]);

    // Show manual fields if PIN is invalid, or if it's international
    const showManualFields = isPincodeValid === false || (countryCode !== 'IN' && formData.pincode.length > 0);

    const handleChange = (field: keyof CandidateCreate) => (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        let value = event.target.value;

        // Name field filtering: No numbers or special characters allowed
        if (field === 'name') {
            // Allow only letters, spaces, and dots (for initials)
            value = value.replace(/[^a-zA-Z\s.]/g, '');
        }

        // Pincode allowed to be alphanumeric for global support
        onChange({
            [field]: value,
        });
    };

    const handleSelectChange = (field: keyof CandidateCreate) => (
        event: { target: { value: unknown } }
    ) => {
        onChange({
            [field]: event.target.value,
        });
    };

    const handleGuardianChange = (field: keyof NonNullable<CandidateCreate['guardian_details']>) => (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: string } } | string
    ) => {
        const value = typeof event === 'string' ? event : event.target.value;
        
        onChange({
            guardian_details: {
                ...formData.guardian_details,
                [field]: value,
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
                }}
            >
                Personal Information
            </Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        required
                        fullWidth
                        label="Full Name"
                        value={formData.name}
                        onChange={handleChange('name')}
                        variant="outlined"
                        placeholder="Enter your full name"
                        error={!!errors.name}
                        helperText={errors.name || "As per in Aadhar card (Letters only)"}
                        autoComplete="name"
                        inputProps={{
                            'aria-invalid': !!errors.name,
                            'aria-required': 'true',
                        }}
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth required error={!!errors.gender}>
                        <InputLabel id="gender-label" htmlFor="gender-select">Gender</InputLabel>
                        <Select
                            labelId="gender-label"
                            id="gender-select"
                            value={formData.gender}
                            label="Gender"
                            onChange={handleSelectChange('gender')}
                            aria-describedby="gender-helper-text"
                            inputProps={{
                                'aria-required': 'true',
                                'aria-invalid': !!errors.gender,
                            }}
                            MenuProps={{
                                disablePortal: true, // Crucial for mobile screen readers to navigate to options
                                disableScrollLock: true,
                            }}
                        >
                            <MenuItem value="male">Male</MenuItem>
                            <MenuItem value="female">Female</MenuItem>
                            <MenuItem value="other">Other</MenuItem>
                            <MenuItem value="prefer_not_to_say">Prefer not to say</MenuItem>
                        </Select>
                        <FormHelperText id="gender-helper-text">
                            {errors.gender || "Select your gender"}
                        </FormHelperText>
                    </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        required
                        fullWidth
                        type="date"
                        label="Date of Birth"
                        value={formData.dob}
                        onChange={handleChange('dob')}
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                        autoComplete="bday"
                        error={!!errors.dob}
                        helperText={errors.dob || ""}
                        inputProps={{
                            'aria-invalid': !!errors.dob,
                            'aria-required': 'true',
                        }}
                    />
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 2 }} />
                    <Typography
                        variant="subtitle1"
                        sx={{ mb: 2, color: theme.palette.text.secondary }}
                    >
                        Contact Information
                    </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        required
                        fullWidth
                        type="email"
                        label="Email Address"
                        value={formData.email}
                        onChange={handleChange('email')}
                        variant="outlined"
                        placeholder="your.email@example.com"
                        error={!!errors.email}
                        helperText={errors.email || "We'll send important updates to this email"}
                        autoComplete="email"
                        inputProps={{
                            'aria-invalid': !!errors.email,
                            'aria-required': 'true',
                        }}
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <MuiTelInput
                        required
                        fullWidth
                        label="Phone Number"
                        value={formData.phone}
                        onChange={(value, info) => {
                            const maxNationalLength = getMaxLength(info.countryCode);
                            const nationalNumber = info.nationalNumber || '';
                            if (nationalNumber.length <= maxNationalLength) {
                                onChange({ 
                                    phone: value
                                });
                                setCountryCode(info.countryCode || 'IN');
                            }
                        }}
                        defaultCountry="IN"
                        preferredCountries={['IN', 'LK', 'US', 'GB', 'AE', 'AF']}
                        variant="outlined"
                        error={!!errors.phone}
                        helperText={errors.phone || ""}
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <MuiTelInput
                        fullWidth
                        label="WhatsApp Number"
                        value={formData.whatsapp_number}
                        onChange={(value, info) => {
                            const maxNationalLength = getMaxLength(info.countryCode);
                            const nationalNumber = info.nationalNumber || '';
                            if (nationalNumber.length <= maxNationalLength) {
                                onChange({ whatsapp_number: value });
                            }
                        }}
                        defaultCountry="IN"
                        preferredCountries={['IN', 'LK', 'US', 'GB', 'AE', 'AF']}
                        variant="outlined"
                        helperText="For quick communication"
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        required
                        fullWidth
                        label="Pincode / ZIP Code"
                        value={formData.pincode}
                        onChange={handleChange('pincode')}
                        variant="outlined"
                        placeholder="Enter pincode or ZIP code"
                        error={isPincodeValid === false || !!errors.pincode}
                        helperText={errors.pincode || (isPincodeValid === false ? "PIN not found. Please enter details manually." : "")}
                        slotProps={{
                            input: {
                                endAdornment: isValidatingPin ? <CircularProgress size={20} /> : null
                            }
                        }}
                        autoComplete="postal-code"
                    />
                </Grid>

                {isPincodeValid === true && countryCode === 'IN' && (
                    <Grid size={{ xs: 12 }}>
                        <Alert severity="success" sx={{ mb: 1 }}>
                            Valid Pincode
                        </Alert>
                    </Grid>
                )}

                {isPincodeValid === false && countryCode === 'IN' && (
                    <Grid size={{ xs: 12 }}>
                        <Alert severity="info" sx={{ mb: 1 }}>
                            Invalid Pincode. Please enter the other details manually.
                        </Alert>
                    </Grid>
                )}

                {showManualFields && (
                    <>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                required
                                fullWidth
                                label="City"
                                value={formData.city || ''}
                                onChange={handleChange('city')}
                                variant="outlined"
                                error={!!errors.city}
                                helperText={errors.city || ""}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                required
                                fullWidth
                                label="District"
                                value={formData.district || ''}
                                onChange={handleChange('district')}
                                variant="outlined"
                                error={!!errors.district}
                                helperText={errors.district || ""}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                required
                                fullWidth
                                label="State"
                                value={formData.state || ''}
                                onChange={handleChange('state')}
                                variant="outlined"
                                error={!!errors.state}
                                helperText={errors.state || ""}
                            />
                        </Grid>
                    </>
                )}

                <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 2 }} />
                    <Typography
                        variant="subtitle1"
                        sx={{ mb: 2, color: theme.palette.text.secondary }}
                    >
                        Parent/Guardian Information
                    </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                        required
                        fullWidth
                        label="Parent/Guardian Name"
                        value={formData.guardian_details?.parent_name || ''}
                        onChange={handleGuardianChange('parent_name')}
                        variant="outlined"
                        placeholder="Enter parent/guardian name"
                        error={!!errors.parent_name}
                        helperText={errors.parent_name || "Name of parent or guardian"}
                        inputProps={{
                            'aria-invalid': !!errors.parent_name,
                            'aria-required': 'true',
                        }}
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth required error={!!errors.relationship}>
                        <InputLabel id="guardian-relationship-label" htmlFor="guardian-relationship-select">Relationship</InputLabel>
                        <Select
                            labelId="guardian-relationship-label"
                            id="guardian-relationship-select"
                            value={formData.guardian_details?.relationship || ''}
                            label="Relationship"
                            onChange={handleGuardianChange('relationship')}
                            inputProps={{
                                'aria-required': 'true',
                                'aria-invalid': !!errors.relationship,
                            }}
                            MenuProps={{
                                disablePortal: true,
                                disableScrollLock: true,
                            }}
                        >
                            <MenuItem value="Father">Father</MenuItem>
                            <MenuItem value="Mother">Mother</MenuItem>
                            <MenuItem value="Spouse">Spouse</MenuItem>
                            <MenuItem value="Guardian">Guardian</MenuItem>
                            <MenuItem value="Brother">Brother</MenuItem>
                            <MenuItem value="Sister">Sister</MenuItem>
                        </Select>
                        <FormHelperText>{errors.relationship || "Select relationship"}</FormHelperText>
                    </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <MuiTelInput
                        required
                        fullWidth
                        label="Parent/Guardian Phone"
                        value={formData.guardian_details?.parent_phone || ''}
                        onChange={(value, info) => {
                            const maxNationalLength = getMaxLength(info.countryCode);
                            const nationalNumber = info.nationalNumber || '';
                            if (nationalNumber.length <= maxNationalLength) {
                                handleGuardianChange('parent_phone')(value as any);
                            }
                        }}
                        defaultCountry="IN"
                        preferredCountries={['IN', 'LK', 'US', 'GB', 'AE', 'AF']}
                        variant="outlined"
                        error={!!errors.parent_phone}
                        helperText={errors.parent_phone || ""}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default PersonalInfoStep;