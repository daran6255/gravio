import React, { useState, useEffect } from 'react';
import {
	Grid,
	TextField,
	Autocomplete,
	Box,
	Paper,
	Stack,
	Typography,
	Divider,
	Chip,
	createFilterOptions
} from '@mui/material';
import {
	SchoolOutlined as EducationIcon,
	AccessibleOutlined as DisabilityIcon,
	InfoOutlined as InfoIcon,
	Add as AddIcon
} from '@mui/icons-material';
import { awsStyles } from '../../../../../theme/theme';
import { disabilityTypes } from '../../../../../data/Disabilities';
import { QUALIFICATIONS } from '../../../../../data/jobRoleData';
import type { JobRole } from '../../../../../models/jobRole';
import { skillService, type Skill } from '../../../../../services/skillService';

const filter = createFilterOptions<Skill | { inputValue: string; name: string }>();

interface RequirementsCompensationTabProps {
	formData: Partial<JobRole>;
	handleNestedChange: (parent: string, field: string, value: any) => void;
	highlightMissing?: boolean;
}



const RequirementsCompensationTab: React.FC<RequirementsCompensationTabProps> = ({
	formData,
	handleNestedChange,
	highlightMissing
}) => {
	const { awsPanel, helperBox } = awsStyles;

	const getFieldStyle = (value: any, isRequired: boolean = false) => {
		const isEmpty = Array.isArray(value) ? value.length === 0 : !value;
		const isMissing = highlightMissing && isRequired && isEmpty;
		return {
			...commonTextFieldProps.sx,
			'& .MuiInputBase-root': {
				...commonTextFieldProps.sx['& .MuiInputBase-root'],
				border: isMissing ? '1px dashed #ec7211' : 'none',
				bgcolor: isMissing ? 'rgba(236, 114, 17, 0.03)' : '#fcfcfc',
			}
		};
	};
	const [skillOptions, setSkillOptions] = useState<Skill[]>([]);
	const [loadingSkills, setLoadingSkills] = useState(false);

	useEffect(() => {
		const loadSkills = async () => {
			setLoadingSkills(true);
			try {
				const skills = await skillService.getSkills();
				setSkillOptions(skills);
			} catch (error) {
				console.error("Error loading skills:", error);
			} finally {
				setLoadingSkills(false);
			}
		};
		loadSkills();
	}, []);

	const commonTextFieldProps = {
		size: 'small' as const,
		sx: {
			'& .MuiInputBase-root': {
				borderRadius: '2px',
				bgcolor: '#fcfcfc',
			},
			'& .MuiOutlinedInput-notchedOutline': { borderColor: '#d5dbdb' },
			'&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#879596' },
			'&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#ec7211' }
		}
	};

	return (
		<Stack spacing={4}>
			{/* Core Requirements Section */}
			<Paper elevation={0} sx={awsPanel}>
				<Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
					<Box sx={{ bgcolor: 'secondary.main', p: 0.5, borderRadius: '2px', display: 'flex' }}>
						<EducationIcon sx={{ color: '#ffffff', fontSize: 20 }} />
					</Box>
					<Typography variant="awsSectionTitle">Candidate Mandatory Qualifications</Typography>
				</Stack>

				<Box sx={helperBox}>
					<InfoIcon sx={{ color: '#007eb9', mt: 0.25, fontSize: 20 }} />
					<Typography variant="body2" sx={{ color: '#007eb9', fontWeight: 500 }}>
						Specify the educational background and core technical skills required for this role.
					</Typography>
				</Box>

				<Divider sx={{ mb: 4, borderColor: '#eaeded' }} />

				<Grid container spacing={3}>
					<Grid size={{ xs: 12, md: 6 }}>
						<Box>
							<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
								<Typography variant="awsFieldLabel" sx={{ mb: 0 }}>Required Qualifications</Typography>
								{highlightMissing && !formData.requirements?.qualifications?.length && (
									<Typography variant="caption" sx={{ color: '#ec7211', fontWeight: 700 }}>VERIFICATION REQUIRED</Typography>
								)}
							</Stack>
							<Autocomplete
								multiple
								options={QUALIFICATIONS}
								value={formData.requirements?.qualifications || []}
								onChange={(_, v) => handleNestedChange('requirements', 'qualifications', v)}
								renderTags={(value, getTagProps) =>
									value.map((option, index) => {
										const { key: _key, ...rest } = getTagProps({ index });
										return (
											<Chip
												key={option}
												label={option}
												size="small"
												{...rest}
												sx={{ borderRadius: '2px' }}
											/>
										);
									})
								}
								renderInput={(params) => (
									<TextField 
										{...params} 
										placeholder="Select Education" 
										{...commonTextFieldProps} 
										sx={getFieldStyle(formData.requirements?.qualifications, true)}
									/>
								)}
							/>
						</Box>
					</Grid>
					<Grid size={{ xs: 12, md: 6 }}>
						<Box>
							<Typography variant="awsFieldLabel">Key Technical Skills</Typography>
							<Autocomplete<any, true, false, true>
								multiple
								freeSolo
								loading={loadingSkills}
								options={skillOptions}
								getOptionLabel={(option) => {
									if (typeof option === 'string') return option;
									if (option.inputValue) return option.inputValue;
									return option.name;
								}}
								value={formData.requirements?.skills || []}
								filterOptions={(options, params) => {
									const filtered = filter(options, params);
									const { inputValue } = params;
									const isExisting = options.some((option) => inputValue.toLowerCase() === option.name.toLowerCase());
									if (inputValue !== '' && !isExisting) {
										filtered.push({
											inputValue,
											name: `Add "${inputValue}"`,
										});
									}
									return filtered;
								}}
								onChange={async (_, newValue) => {
									const processedValues = await Promise.all(newValue.map(async (val) => {
										if (typeof val === 'string') return val;
										if (val.inputValue) {
											try {
												const newSkill = await skillService.createSkill({ name: val.inputValue });
												setSkillOptions(prev => {
													if (!prev.find(s => s.id === newSkill.id)) {
														return [...prev, newSkill].sort((a, b) => a.name.localeCompare(b.name));
													}
													return prev;
												});
												return newSkill.name;
											} catch (e) {
												return val.inputValue;
											}
										}
										return val.name;
									}));
									handleNestedChange('requirements', 'skills', processedValues);
								}}
								renderTags={(value, getTagProps) =>
									value.map((option, index) => {
										const { key: _key, ...rest } = getTagProps({ index });
										return (
											<Chip
												key={index}
												label={typeof option === 'string' ? option : (option as any).name}
												size="small"
												{...rest}
												sx={{ borderRadius: '2px' }}
											/>
										);
									})
								}
								renderOption={(props, option) => {
									const { key: _key, ...rest } = props;
									const isAdd = (option as any).inputValue;
									return (
										<Box component="li" key={isAdd ? `add-${(option as any).inputValue}` : (option as Skill).id} {...rest}>
											<Stack direction="row" spacing={1} alignItems="center">
												{isAdd && <AddIcon color="primary" fontSize="small" />}
												<Typography>{isAdd ? `Add "${(option as any).inputValue}"` : (option as Skill).name}</Typography>
											</Stack>
										</Box>
									);
								}}
								renderInput={(params) => <TextField {...params} placeholder="Type or select skills" {...commonTextFieldProps} />}
							/>
						</Box>
					</Grid>
				</Grid>
			</Paper>

			{/* Disability Preference Section */}
			<Paper elevation={0} sx={awsPanel}>
				<Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
					<Box sx={{ bgcolor: 'secondary.main', p: 0.5, borderRadius: '2px', display: 'flex' }}>
						<DisabilityIcon sx={{ color: '#ffffff', fontSize: 20 }} />
					</Box>
					<Typography variant="awsSectionTitle">Disability Inclusion Preferences</Typography>
				</Stack>

				<Grid container spacing={3}>
					<Grid size={{ xs: 12 }}>
						<Box>
							<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
								<Typography variant="awsFieldLabel" sx={{ mb: 0 }}>Disability Types Preferred</Typography>
							</Stack>
							<Autocomplete
								multiple
								options={disabilityTypes}
								value={formData.requirements?.disability_preferred || []}
								onChange={(_, v) => handleNestedChange('requirements', 'disability_preferred', v)}
								renderTags={(value, getTagProps) =>
									value.map((option, index) => {
										const { key: _key, ...rest } = getTagProps({ index });
										return (
											<Chip
												key={option}
												label={option}
												size="small"
												{...rest}
												sx={{ borderRadius: '2px' }}
											/>
										);
									})
								}
								renderInput={(params) => (
									<TextField 
										{...params} 
										placeholder="Select Disability Preferences" 
										{...commonTextFieldProps} 
										sx={getFieldStyle(formData.requirements?.disability_preferred, false)}
									/>
								)}
							/>
						</Box>
					</Grid>
				</Grid>
			</Paper>
		</Stack>
	);
};

export default RequirementsCompensationTab;
