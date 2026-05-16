import React from 'react';
import {
	Box,
	TextField,
	FormControl,
	Stack,
	Typography,
	Select,
	MenuItem,
	Autocomplete,
	Chip
} from '@mui/material';
import { awsStyles } from '../../theme/theme';
import type { DynamicField } from '../../services/settingsService';

interface DynamicFieldRendererProps {
	fields: DynamicField[];
	formData: any;
	onUpdateField: (name: string, value: any) => void;
	sectionTitle?: string;
}

const DynamicFieldRenderer: React.FC<DynamicFieldRendererProps> = ({
	fields,
	formData,
	onUpdateField,
	sectionTitle = 'Additional Information'
}) => {
	const { sectionTitle: sectionTitleStyle, fieldLabel } = awsStyles;

	if (fields.length === 0) return null;

	const inputSx = {
		'& .MuiOutlinedInput-root': {
			borderRadius: '2px',
			bgcolor: '#fcfcfc',
			'& fieldset': { borderColor: '#d5dbdb' },
			'&:hover fieldset': { borderColor: '#879596' },
			'&.Mui-focused fieldset': { borderColor: '#ec7211' }
		}
	};

	return (
		<Box sx={{ mt: 1 }}>
			<Typography sx={{ ...sectionTitleStyle, mb: 3 }}>{sectionTitle}</Typography>
			<Stack spacing={3.5}>
				{fields.map((field) => (
					<Box key={field.id}>
						{(field.field_type === 'text' || field.field_type === 'number' || field.field_type === 'phone_number') && (
							<Box>
								<Typography sx={fieldLabel}>
									{field.label} {field.is_required && <Box component="span" sx={{ color: '#d91d11' }}>*</Box>}
								</Typography>
								<TextField
									fullWidth
									size="small"
									type={field.field_type === 'number' ? 'number' : 'text'}
									placeholder={`Enter ${field.label.toLowerCase()}`}
									value={formData?.[field.name] || ''}
									onChange={(e) => onUpdateField(field.name, e.target.value)}
									sx={inputSx}
								/>
							</Box>
						)}
						{field.field_type === 'textarea' && (
							<Box>
								<Typography sx={fieldLabel}>
									{field.label} {field.is_required && <Box component="span" sx={{ color: '#d91d11' }}>*</Box>}
								</Typography>
								<TextField
									fullWidth
									multiline
									rows={3}
									placeholder={`Provide details...`}
									value={formData?.[field.name] || ''}
									onChange={(e) => onUpdateField(field.name, e.target.value)}
									sx={inputSx}
								/>
							</Box>
						)}
						{field.field_type === 'single_choice' && (
							<Box>
								<Typography sx={fieldLabel}>
									{field.label} {field.is_required && <Box component="span" sx={{ color: '#d91d11' }}>*</Box>}
								</Typography>
								<FormControl fullWidth size="small">
									<Select
										value={formData?.[field.name] || ''}
										onChange={(e) => onUpdateField(field.name, e.target.value)}
										displayEmpty
										renderValue={(selected) => selected || <Typography variant="body2" color="text.secondary">Select an option</Typography>}
										sx={{
											borderRadius: '2px',
											bgcolor: '#fcfcfc',
											'& .MuiOutlinedInput-notchedOutline': { borderColor: '#d5dbdb' },
											'&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#879596' },
											'&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#ec7211' }
										}}
									>
										{field.options?.map((opt) => (
											<MenuItem key={opt} value={opt}>{opt}</MenuItem>
										))}
									</Select>
								</FormControl>
							</Box>
						)}
						{field.field_type === 'multiple_choice' && (
							<Box>
								<Typography sx={fieldLabel}>
									{field.label} {field.is_required && <Box component="span" sx={{ color: '#d91d11' }}>*</Box>}
								</Typography>
								<Autocomplete
									multiple
									options={field.options || []}
									value={formData?.[field.name] || []}
									onChange={(_e, newValue) => onUpdateField(field.name, newValue)}
									renderTags={(value, getTagProps) =>
										value.map((option, index) => (
											<Chip
												label={option}
												{...getTagProps({ index })}
												size="small"
												sx={{ 
													borderRadius: '2px',
													bgcolor: '#f2f3f3',
													fontWeight: 600,
													color: '#545b64'
												}}
											/>
										))
									}
									renderInput={(params) => (
										<TextField
											{...params}
											placeholder="Select options..."
											size="small"
											sx={inputSx}
										/>
									)}
								/>
							</Box>
						)}
					</Box>
				))}
			</Stack>
		</Box>
	);
};

export default DynamicFieldRenderer;
