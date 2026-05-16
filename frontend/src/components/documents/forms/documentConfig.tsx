import React from 'react';
import {
  School as EducationIcon,
  Article as ResumeIcon,
  Badge as IDIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';

export interface RequiredDocument {
  type: string;
  label: string;
  description: string;
  icon: React.ReactElement;
  roles?: string[];
}

export const REQUIRED_DOCUMENTS: RequiredDocument[] = [
  { 
    type: 'resume', 
    label: 'Candidate Resume', 
    description: 'Initial/Original CV', 
    icon: <ResumeIcon sx={{ color: '#007eb9' }} /> 
  },
  { 
    type: 'trainer_resume', 
    label: 'Trainer Resume', 
    description: 'Optimized/Prepared CV', 
    icon: <ResumeIcon sx={{ color: '#ec7211' }} />,
    roles: ['trainer', 'admin', 'manager']
  },
  { 
    type: '10th_certificate', 
    label: '10th Certificate', 
    description: 'Class 10 Marksheet', 
    icon: <EducationIcon sx={{ color: '#1a73e8' }} /> 
  },
  { 
    type: '12th_certificate', 
    label: '12th Certificate', 
    description: 'Class 12 Marksheet', 
    icon: <EducationIcon sx={{ color: '#1a73e8' }} /> 
  },
  { 
    type: 'degree_certificate', 
    label: 'Degree Certificate', 
    description: 'UG/PG Degree Certificate', 
    icon: <EducationIcon sx={{ color: '#1a73e8' }} /> 
  },
  { 
    type: 'pan_card', 
    label: 'PAN Card', 
    description: 'PAN Card for ID proof', 
    icon: <IDIcon sx={{ color: '#6b7280' }} /> 
  },
  { 
    type: 'aadhar_card', 
    label: 'Aadhar Card', 
    description: 'Aadhar Card for ID/Address', 
    icon: <IDIcon sx={{ color: '#6b7280' }} /> 
  },
  { 
    type: 'passport_photo', 
    label: 'Passport Size Photo', 
    description: 'Recent Passport size photograph', 
    icon: <IDIcon sx={{ color: '#6b7280' }} /> 
  },
  { 
    type: 'disability_certificate', 
    label: 'Disability Certificate', 
    description: 'Authorized Medical Certificate', 
    icon: <VerifiedIcon sx={{ color: '#059669' }} />,
    roles: ['disabled'] // Custom flag for conditional rendering
  }
];
