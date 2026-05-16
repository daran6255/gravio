import React, { useState, useEffect } from 'react';
import {
    Box,
    Stepper,
    Step,
    StepLabel,
    Button,
    Typography,
    Paper,
    Alert,
    CircularProgress,
    Divider,
    IconButton,
    useMediaQuery,
} from '@mui/material';
import {
    Person as PersonIcon,
    School as SchoolIcon,
    Work as WorkIcon,
    Accessible as AccessibleIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

// Import form steps
import PersonalInfoStep from './steps/PersonalInfoStep';
import EducationStep from './steps/EducationStep';
import ExperienceStep from './steps/ExperienceStep';
import candidateService from '../../../services/candidateService';
import DisabilityStep from './steps/DisabilityStep';
import ReviewStep from './steps/ReviewStep';
import { matchIsValidTel } from 'mui-tel-input';

// Import types
import type { CandidateCreate } from '../../../models/candidate';

// Initial form state
const initialFormData: CandidateCreate = {
    name: '',
    gender: '',
    dob: '',
    email: '',
    phone: '',
    whatsapp_number: '',
    guardian_details: {
        parent_name: '',
        relationship: '',
        parent_phone: '',
    },
    pincode: '',
    city: '',
    district: '',
    state: '',
    work_experience: {
        is_experienced: false,
        currently_employed: false,
        year_of_experience: '',
    },
    education_details: {
        degrees: [],
    },
    disability_details: {
        is_disabled: false,
        disability_type: '',
        disability_percentage: 0,
    },
};

const steps = [
    {
        label: 'Personal Information',
        icon: <PersonIcon />,
        description: 'Basic details and contact information',
    },
    {
        label: 'Education',
        icon: <SchoolIcon />,
        description: 'Educational qualifications',
    },
    {
        label: 'Experience',
        icon: <WorkIcon />,
        description: 'Work experience details',
    },
    {
        label: 'Disability',
        icon: <AccessibleIcon />,
        description: 'Disability information (if applicable)',
    },
    {
        label: 'Review & Submit',
        icon: <CheckCircleIcon />,
        description: 'Review all information and submit',
    },
];

interface CandidateRegistrationFormProps {
    onSubmit?: (data: CandidateCreate) => void;
    onCancel?: () => void;
    initialData?: Partial<CandidateCreate>;
}

const CandidateRegistrationForm: React.FC<CandidateRegistrationFormProps> = ({
    onSubmit,
    onCancel,
    initialData,
}) => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
    const [activeStep, setActiveStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
    const [errorSteps, setErrorSteps] = useState<Set<number>>(new Set());
    const [formData, setFormData] = useState<CandidateCreate>({
        ...initialFormData,
        ...initialData,
    });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const isEditMode = !!initialData && !!(initialData as any).public_id;

    // Sync formData when initialData changes (for async loading in CandidateEdit)
    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                ...initialData
            }));
        }
    }, [initialData]);

    // Validation functions for each step
    const validateStep = (step: number): Record<string, string> => {
        const errors: Record<string, string> = {};
        switch (step) {
            case 0: // Personal Info
                if (!formData.name) errors.name = 'Full name is required';
                if (!formData.gender) errors.gender = 'Gender is required';
                if (!formData.dob) errors.dob = 'Date of birth is required';
                if (!formData.email) {
                    errors.email = 'Email address is required';
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                    errors.email = 'Please enter a valid email address';
                }
                if (!formData.phone) {
                    errors.phone = 'Phone number is required';
                } else if (!matchIsValidTel(formData.phone)) {
                    errors.phone = 'Please enter a valid international phone number';
                }
                if (!formData.pincode) {
                    errors.pincode = 'Pincode/ZIP code is required';
                }

                // Mandatory Guardian Details Validation
                if (!formData.guardian_details?.parent_name) {
                    errors.parent_name = 'Parent/Guardian name is required';
                }
                if (!formData.guardian_details?.relationship) {
                    errors.relationship = 'Relationship is required';
                }
                if (!formData.guardian_details?.parent_phone) {
                    errors.parent_phone = 'Parent/Guardian phone is required';
                } else if (!matchIsValidTel(formData.guardian_details.parent_phone)) {
                    errors.parent_phone = 'Please enter a valid international phone number';
                }
                break;
            case 1: // Education
                if (!formData.education_details?.degrees || formData.education_details.degrees.length === 0) {
                    errors.degrees = 'Please add at least one educational qualification';
                } else {
                    formData.education_details.degrees.forEach((degree, index) => {
                        if (!degree.degree_name) errors[`degree_${index}_name`] = 'Qualification is required';
                        if (!degree.specialization) errors[`degree_${index}_specialization`] = 'Specialization is required';
                        if (!degree.college_name) errors[`degree_${index}_college`] = 'Institution name is required';
                        if (!degree.year_of_passing) errors[`degree_${index}_year`] = 'Year of completion is required';
                        if (degree.percentage === undefined || degree.percentage === null || degree.percentage < 0 || degree.percentage > 100) {
                            errors[`degree_${index}_percentage`] = 'Percentage must be between 0 and 100';
                        }
                    });
                }
                break;
            case 2: // Experience
                if (formData.work_experience?.is_experienced) {
                    if (!formData.work_experience.year_of_experience) {
                        errors.year_of_experience = 'Years of experience is required';
                    }
                }
                break;
            case 3: // Disability
                if (formData.disability_details?.is_disabled) {
                    if (!formData.disability_details.disability_type) {
                        errors.disability_type = 'Disability type is required';
                    }
                    if (formData.disability_details.disability_percentage === undefined ||
                        formData.disability_details.disability_percentage === null ||
                        formData.disability_details.disability_percentage <= 0) {
                        errors.disability_percentage = 'Disability percentage must be greater than 0';
                    }
                }
                break;
        }
        return errors;
    };

    const handleNext = async () => {
        const stepErrors = validateStep(activeStep);
        const isValid = Object.keys(stepErrors).length === 0;

        if (isValid) {
            // Early backend validation for Step 0 (Personal Info)
            if (activeStep === 0) {
                setIsSubmitting(true);
                setSubmitError(null);
                try {
                    const response = await candidateService.checkAvailability({
                        email: formData.email,
                        phone: formData.phone,
                        pincode: formData.pincode,
                        city: formData.city,
                        district: formData.district,
                        state: formData.state,
                        exclude_public_id: (initialData as any)?.public_id
                    });

                    // Auto-fill address if returned, or handle fallback
                    if (response.address && Object.keys(response.address).length > 0) {
                        setFormData(prev => ({
                            ...prev,
                            city: prev.city || response.address.city || '',
                            district: prev.district || response.address.district || '',
                            state: prev.state || response.address.state || '',
                        }));
                    } else if (!formData.city || !formData.district || !formData.state) {
                        setFieldErrors({
                            pincode: "PIN details not found. Please enter address manually.",
                            city: !formData.city ? "City is required" : undefined,
                            district: !formData.district ? "District is required" : undefined,
                            state: !formData.state ? "State is required" : undefined,
                        } as any);
                        return;
                    }
                } catch (error: unknown) {
                    const detail = (error as { response?: { data?: { detail?: string } }, message?: string })?.response?.data?.detail
                        || (error instanceof Error ? error.message : 'Validation failed');
                    const backendErrors: Record<string, string> = {};

                    if (detail.includes('Email already registered')) {
                        backendErrors.email = 'This email is already registered';
                    } else if (detail.includes('Phone number already registered')) {
                        backendErrors.phone = 'This phone number is already registered';
                    } else if (detail.includes('Invalid pincode') || detail.includes('No details found for this pincode')) {
                        backendErrors.pincode = 'Please enter a valid pincode';
                    } else {
                        setSubmitError(detail);
                    }

                    if (Object.keys(backendErrors).length > 0) {
                        setFieldErrors(backendErrors);
                    }
                    return; // Stop navigation
                } finally {
                    setIsSubmitting(false);
                }
            }

            setCompletedSteps(prev => new Set(prev).add(activeStep));
            setErrorSteps(prev => {
                const next = new Set(prev);
                next.delete(activeStep);
                return next;
            });
            setFieldErrors({});
            setActiveStep((prevStep) => prevStep + 1);
            setSubmitError(null);
        } else {
            setErrorSteps(prev => new Set(prev).add(activeStep));
            setFieldErrors(stepErrors);
            setSubmitError('Please fix the errors in the form before proceeding.');
        }
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
        setFieldErrors({});
        setSubmitError(null);
    };

    const handleStepClick = (step: number) => {
        // Allow navigation to completed steps or previous steps
        if (step < activeStep || completedSteps.has(step)) {
            setActiveStep(step);
            setFieldErrors({});
            setSubmitError(null);
        }
    };

    const handleFormDataChange = (data: Partial<CandidateCreate>) => {
        setFormData(prev => {
            const updated = { ...prev };

            // Handle nested education_details properly
            if (data.education_details) {
                updated.education_details = {
                    ...prev.education_details,
                    ...data.education_details,
                    degrees: data.education_details.degrees !== undefined ? data.education_details.degrees : (prev.education_details?.degrees || []),
                };
            }

            // Handle nested disability_details properly
            if (data.disability_details) {
                updated.disability_details = {
                    ...prev.disability_details,
                    ...data.disability_details,
                };
            }

            // Handle nested guardian_details
            if (data.guardian_details) {
                updated.guardian_details = {
                    ...prev.guardian_details,
                    ...data.guardian_details,
                };
            }

            // Handle nested工作经验
            if (data.work_experience) {
                updated.work_experience = {
                    ...prev.work_experience,
                    ...data.work_experience,
                };
            }

            // Handle other fields
            Object.keys(data).forEach(k => {
                const key = k as keyof CandidateCreate;
                if (!['education_details', 'disability_details', 'guardian_details', 'work_experience'].includes(key)) {
                    (updated as Record<string, unknown>)[key] = (data as Record<string, unknown>)[key];
                }
            });

            return updated;
        });

        // Clear field errors when data changes
        if (Object.keys(fieldErrors).length > 0) {
            setFieldErrors({});
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // Validate all steps
            let firstInvalidStep = -1;
            const allStepErrors: Record<number, Record<string, string>> = {};

            for (let i = 0; i < steps.length - 1; i++) {
                const errors = validateStep(i);
                if (Object.keys(errors).length > 0) {
                    allStepErrors[i] = errors;
                    if (firstInvalidStep === -1) firstInvalidStep = i;
                }
            }

            if (firstInvalidStep !== -1) {
                setErrorSteps(new Set(Object.keys(allStepErrors).map(Number)));
                setActiveStep(firstInvalidStep);
                setFieldErrors(allStepErrors[firstInvalidStep]);
                throw new Error('Please fix the errors in the form before submitting.');
            }

            // Submit the form
            if (onSubmit) {
                await onSubmit(formData);
            }

            // Mark all steps as completed
            setCompletedSteps(new Set(steps.map((_, index) => index)));
        } catch (error: unknown) {
            let message = 'Submission failed';
            let detail = '';

            const err = error as { response?: { data?: { detail?: string | string[] } }, message?: string };

            if (err?.response?.data?.detail) {
                const d = err.response.data.detail;
                detail = Array.isArray(d) ? d.join(', ') : d;
            } else if (typeof error === 'string') {
                detail = error;
            } else if (error instanceof Error) {
                detail = error.message;
            }

            if (detail) {
                message = detail;
                // Map specific backend errors to fields
                const newFieldErrors: Record<string, string> = {};
                let shouldGoToStep0 = false;

                if (detail.includes('Email already registered')) {
                    newFieldErrors.email = 'This email is already registered';
                    shouldGoToStep0 = true;
                } else if (detail.includes('Phone number already registered')) {
                    newFieldErrors.phone = 'This phone number is already registered';
                    shouldGoToStep0 = true;
                } else if (detail.includes('Invalid pincode') || detail.includes('No details found for this pincode')) {
                    newFieldErrors.pincode = 'Please enter a valid pincode';
                    shouldGoToStep0 = true;
                }

                if (Object.keys(newFieldErrors).length > 0) {
                    setFieldErrors(newFieldErrors);
                    if (shouldGoToStep0) {
                        setActiveStep(0);
                        setErrorSteps(new Set([0]));
                    }
                }
            }

            setSubmitError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStepContent = (step: number) => {
        const baseProps = {
            formData,
            onChange: handleFormDataChange,
            errors: fieldErrors,
            exclude_public_id: (initialData as any)?.public_id
        };

        switch (step) {
            case 0:
                return <PersonalInfoStep {...baseProps} />;
            case 1:
                return <EducationStep {...baseProps} />;
            case 2:
                return <ExperienceStep {...baseProps} />;
            case 3:
                return <DisabilityStep {...baseProps} />;
            case 4:
                return <ReviewStep formData={formData} />;
            default:
                return <Typography>Unknown step</Typography>;
        }
    };

    const StepIcon = ({ active, completed, error, icon }: { active?: boolean, completed?: boolean, error?: boolean, icon: number }) => {
        const theme = useTheme();

        return (
            <Box
                sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: error
                        ? theme.palette.error.main
                        : completed
                            ? theme.palette.primary.main
                            : active
                                ? theme.palette.secondary.main
                                : theme.palette.grey[300],
                    color: error || completed || active ? '#fff' : theme.palette.text.secondary,
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    '&:hover': {
                        transform: 'scale(1.05)',
                    },
                }}
            >
                {error ? (
                    <ErrorIcon />
                ) : completed ? (
                    <CheckCircleIcon />
                ) : (
                    React.cloneElement(steps[icon].icon, {
                        sx: { fontSize: 24 },
                    })
                )}
            </Box>
        );
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 2, md: 4 },
                borderRadius: 2,
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
            }}
        >
            <Typography
                variant="h4"
                component="h1"
                gutterBottom
                sx={{
                    color: theme.palette.secondary.main,
                    fontWeight: 500,
                    mb: 4,
                }}
            >
                {isEditMode ? 'Update Candidate Profile' : 'Candidate Registration'}
            </Typography>

            <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 4 }}
            >
                {isEditMode
                    ? 'Use the sections below to update candidate information.'
                    : 'Please complete all steps to register as a candidate. All fields marked with * are required.'
                }
            </Typography>

            <Stepper
                activeStep={activeStep}
                orientation={isSmallScreen ? 'vertical' : 'horizontal'}
                alternativeLabel={!isSmallScreen}
                aria-label="Registration Progress"
                sx={{
                    mb: 4,
                    '& .MuiStepLabel-alternativeLabel': {
                        mt: 1,
                    },
                    '& .MuiStepConnector-line': {
                        borderColor: theme.palette.divider,
                    },
                }}
            >
                {steps.map((step, index) => (
                    <Step
                        key={step.label}
                        completed={completedSteps.has(index)}
                        sx={{
                            cursor: index < activeStep || completedSteps.has(index) ? 'pointer' : 'default',
                        }}
                        onClick={() => handleStepClick(index)}
                    >
                        <StepLabel
                            StepIconComponent={(props) => (
                                <StepIcon
                                    {...props}
                                    error={errorSteps.has(index)}
                                    icon={index}
                                />
                            )}
                            aria-current={activeStep === index ? 'step' : undefined}
                            optional={
                                !isSmallScreen && (
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: errorSteps.has(index)
                                                ? theme.palette.error.main
                                                : theme.palette.text.secondary,
                                            fontWeight: errorSteps.has(index) ? 600 : 400,
                                        }}
                                    >
                                        {step.description}
                                    </Typography>
                                )
                            }
                            error={errorSteps.has(index)}
                            sx={{
                                '& .MuiStepLabel-label': {
                                    color: errorSteps.has(index)
                                        ? theme.palette.error.main
                                        : activeStep === index
                                            ? theme.palette.primary.main
                                            : theme.palette.text.primary,
                                    fontWeight: activeStep === index ? 600 : 400,
                                    '&.Mui-completed': {
                                        color: theme.palette.primary.main,
                                    },
                                },
                            }}
                        >
                            {step.label}
                        </StepLabel>
                    </Step>
                ))}
            </Stepper>

            <Divider sx={{ mb: 4 }} />

            {submitError && (
                <Alert
                    severity="error"
                    sx={{ mb: 3 }}
                    role="alert"
                    aria-live="assertive"
                    action={
                        <IconButton
                            aria-label="close error alert"
                            color="inherit"
                            size="small"
                            onClick={() => setSubmitError(null)}
                        >
                            <ErrorIcon fontSize="inherit" />
                        </IconButton>
                    }
                >
                    {submitError}
                </Alert>
            )}

            <Box sx={{ mb: 4 }}>
                {getStepContent(activeStep)}
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pt: 2,
                    borderTop: `1px solid ${theme.palette.divider}`,
                }}
            >
                <Button
                    onClick={activeStep === 0 && onCancel ? onCancel : handleBack}
                    disabled={activeStep === 0 && !onCancel}
                    variant="outlined"
                    sx={{
                        color: theme.palette.text.secondary,
                        borderColor: theme.palette.divider,
                        '&:hover': {
                            borderColor: theme.palette.primary.main,
                            color: theme.palette.primary.main,
                        },
                    }}
                >
                    {onCancel && activeStep === 0 ? 'Cancel' : 'Back'}
                </Button>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        aria-live="polite"
                    >
                        Step {activeStep + 1} of {steps.length}
                    </Typography>

                    {activeStep === steps.length - 1 ? (
                        <Button
                            onClick={handleSubmit}
                            variant="contained"
                            disabled={isSubmitting}
                            startIcon={
                                isSubmitting ? (
                                    <CircularProgress size={20} color="inherit" />
                                ) : (
                                    <CheckCircleIcon />
                                )
                            }
                            sx={{
                                backgroundColor: theme.palette.primary.main,
                                '&:hover': {
                                    backgroundColor: theme.palette.primary.dark,
                                },
                            }}
                        >
                            {isSubmitting ? (isEditMode ? 'Updating...' : 'Submitting...') : (isEditMode ? 'Update Candidate' : 'Submit Registration')}
                        </Button>
                    ) : (
                        <Button
                            onClick={handleNext}
                            variant="contained"
                            disabled={isSubmitting}
                            endIcon={
                                isSubmitting && activeStep === 0 ? (
                                    <CircularProgress size={20} color="inherit" />
                                ) : (
                                    <CheckCircleIcon />
                                )
                            }
                            sx={{
                                backgroundColor: theme.palette.primary.main,
                                '&:hover': {
                                    backgroundColor: theme.palette.primary.dark,
                                },
                            }}
                        >
                            {isSubmitting && activeStep === 0 ? 'Validating...' : 'Next'}
                        </Button>
                    )}
                </Box>
            </Box>

            {activeStep < steps.length - 1 && (
                <Alert
                    severity="info"
                    icon={<InfoIcon />}
                    sx={{ mt: 3 }}
                >
                    <Typography variant="body2">
                        <strong>Tip:</strong> You can click on completed steps to navigate back and edit information.
                    </Typography>
                </Alert>
            )}
        </Paper>
    );
};

export default CandidateRegistrationForm;