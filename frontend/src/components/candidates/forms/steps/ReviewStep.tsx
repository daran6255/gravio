import React from 'react';
import {
    Typography,
    Box,
    Paper,
    Stack,
    Divider,
    Alert,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Chip,
    Grid,
} from '@mui/material';
import {
    Person as PersonIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    School as SchoolIcon,
    Work as WorkIcon,
    Accessible as AccessibleIcon,
    Circle as CircleIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import type { CandidateCreate } from '../../../../models/candidate';

interface ReviewStepProps {
    formData: CandidateCreate;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ formData }) => {
    const theme = useTheme();

    const formatDate = (year: number) => {
        return year.toString();
    };

    const formatPercentage = (percentage: number) => {
        return `${percentage}%`;
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
                Review Your Information
            </Typography>

            <Alert severity="warning" sx={{ mb: 4 }}>
                Please review all information carefully before submitting. You can go back to any step to make changes.
            </Alert>

            <Stack spacing={4}>
                {/* Personal Information */}
                <Paper
                    variant="outlined"
                    sx={{ p: 3 }}
                    role="region"
                    aria-label="Personal Information Summary"
                >
                    <Typography variant="subtitle1" gutterBottom fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon /> Personal Information
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="body2" color="text.secondary">Name</Typography>
                            <Typography variant="body1">{formData.name}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="body2" color="text.secondary">Date of Birth</Typography>
                            <Typography variant="body1">{formData.dob}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="body2" color="text.secondary">Gender</Typography>
                            <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{formData.gender}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="body2" color="text.secondary">Email</Typography>
                            <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EmailIcon fontSize="small" /> {formData.email}
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="body2" color="text.secondary">Phone</Typography>
                            <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PhoneIcon fontSize="small" /> {formData.phone}
                            </Typography>
                        </Grid>
                        {formData.whatsapp_number && (
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="body2" color="text.secondary">WhatsApp</Typography>
                                <Typography variant="body1">{formData.whatsapp_number}</Typography>
                            </Grid>
                        )}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="body2" color="text.secondary">Pincode</Typography>
                            <Typography variant="body1">{formData.pincode}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="body2" color="text.secondary">Registration Type</Typography>
                            <Typography variant="body1">{formData.other?.registration_type || 'Registered'}</Typography>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Guardian Information */}
                <Paper
                    variant="outlined"
                    sx={{ p: 3 }}
                    role="region"
                    aria-label="Parent/Guardian Information Summary"
                >
                    <Typography variant="subtitle1" gutterBottom fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon /> Parent/Guardian Information
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Typography variant="body2" color="text.secondary">Guardian Name</Typography>
                            <Typography variant="body1">{formData.guardian_details?.parent_name || 'Not provided'}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Typography variant="body2" color="text.secondary">Relationship</Typography>
                            <Typography variant="body1">{formData.guardian_details?.relationship || 'Not provided'}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Typography variant="body2" color="text.secondary">Guardian Phone</Typography>
                            <Typography variant="body1">{formData.guardian_details?.parent_phone || 'Not provided'}</Typography>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Education Information */}
                <Paper
                    variant="outlined"
                    sx={{ p: 3 }}
                    role="region"
                    aria-label="Education Details Summary"
                >
                    <Typography variant="subtitle1" gutterBottom fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SchoolIcon /> Education Details
                    </Typography>
                    <Divider sx={{ my: 2 }} />

                    {formData.education_details?.degrees && formData.education_details.degrees.length > 0 ? (
                        <Box>
                            <Typography variant="subtitle2" gutterBottom>Educational Qualifications</Typography>
                            <List aria-label="List of educational qualifications">
                                {formData.education_details.degrees.map((degree, index) => (
                                    <ListItem key={index} divider={index !== formData.education_details!.degrees.length - 1}>
                                        <ListItemIcon>
                                            <CircleIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={`${degree.degree_name} in ${degree.specialization}`}
                                            secondary={`${degree.college_name} | ${formatDate(degree.year_of_passing)} | ${formatPercentage(degree.percentage)}`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    ) : (
                        <Typography color="text.secondary">No education details provided</Typography>
                    )}
                </Paper>

                {/* Experience */}
                <Paper
                    variant="outlined"
                    sx={{ p: 3 }}
                    role="region"
                    aria-label="Work Experience Summary"
                >
                    <Typography variant="subtitle1" gutterBottom fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WorkIcon /> Work Experience
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Stack direction="row" spacing={3} flexWrap="wrap">
                        <Box aria-label="Experience status">
                            <Typography variant="body2" color="text.secondary">Has Experience</Typography>
                            <Chip
                                label={formData.work_experience?.is_experienced ? 'Yes' : 'No'}
                                color={formData.work_experience?.is_experienced ? 'success' : 'default'}
                                size="small"
                            />
                        </Box>
                        {formData.work_experience?.is_experienced && (
                            <>
                                <Box aria-label="Employment status">
                                    <Typography variant="body2" color="text.secondary">Currently Employed</Typography>
                                    <Chip
                                        label={formData.work_experience.currently_employed ? 'Yes' : 'No'}
                                        color={formData.work_experience.currently_employed ? 'success' : 'default'}
                                        size="small"
                                    />
                                </Box>
                                <Box aria-label="Years of experience">
                                    <Typography variant="body2" color="text.secondary">Years of Experience</Typography>
                                    <Typography variant="body1">{formData.work_experience.year_of_experience || 'Not specified'}</Typography>
                                </Box>
                            </>
                        )}
                    </Stack>
                </Paper>

                {/* Disability */}
                <Paper
                    variant="outlined"
                    sx={{ p: 3 }}
                    role="region"
                    aria-label="Disability Information Summary"
                >
                    <Typography variant="subtitle1" gutterBottom fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessibleIcon /> Disability Information
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Stack direction="row" spacing={3} flexWrap="wrap">
                        <Box aria-label="Disability status">
                            <Typography variant="body2" color="text.secondary">Has Disability</Typography>
                            <Chip
                                label={formData.disability_details?.is_disabled ? 'Yes' : 'No'}
                                color={formData.disability_details?.is_disabled ? 'warning' : 'default'}
                                size="small"
                            />
                        </Box>
                        {formData.disability_details?.is_disabled && (
                            <>
                                <Box aria-label="Disability type">
                                    <Typography variant="body2" color="text.secondary">Type</Typography>
                                    <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                                        {formData.disability_details.disability_type}
                                    </Typography>
                                </Box>
                                <Box aria-label="Disability percentage">
                                    <Typography variant="body2" color="text.secondary">Percentage</Typography>
                                    <Typography variant="body1">{formData.disability_details.disability_percentage}%</Typography>
                                </Box>
                            </>
                        )}
                    </Stack>
                </Paper>

                <Alert severity="success">
                    <Typography variant="body2">
                        <strong>Ready to submit?</strong> If all information is correct, click "Submit Registration" below. You will receive a confirmation email once your registration is processed.
                    </Typography>
                </Alert>
            </Stack>
        </Box>
    );
};

export default ReviewStep;