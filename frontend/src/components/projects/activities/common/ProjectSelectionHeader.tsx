import React, { memo } from 'react';
import {
	Box,
	Typography,
	Autocomplete,
	TextField,
	alpha,
	useTheme
} from '@mui/material';
import type { DSRProject } from '../../../../models/dsr';

interface ProjectSelectionHeaderProps {
	projects: DSRProject[];
	selectedProject: DSRProject | null;
	onProjectChange: (project: DSRProject | null) => void;
}

const ProjectSelectionHeader: React.FC<ProjectSelectionHeaderProps> = memo(({
	projects,
	selectedProject,
	onProjectChange,
}) => {
	const theme = useTheme();

	return (
		<Box sx={{ width: '100%', p: 1 }}>
			<Typography
				variant="caption"
				sx={{
					fontWeight: 800,
					color: alpha(theme.palette.common.white, 0.4),
					display: 'block',
					mb: 0.5,
					textTransform: 'uppercase',
					letterSpacing: '0.1em',
					fontSize: '0.65rem'
				}}
			>
				Select Active Project
			</Typography>
			<Autocomplete
				options={projects}
				getOptionLabel={(option) => option.name}
				value={selectedProject}
				onChange={(_e, newValue) => onProjectChange(newValue)}
				size="small"
				renderInput={(params) => (
					<TextField
						{...params}
						placeholder="Search projects..."
						variant="outlined"
						sx={{
							'& .MuiOutlinedInput-root': {
								color: 'white',
								fontSize: '0.875rem',
								fontWeight: 600,
								bgcolor: alpha(theme.palette.common.white, 0.04),
								borderRadius: 1,
								transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
								height: 38,
								'& fieldset': {
									borderColor: alpha(theme.palette.common.white, 0.1),
									borderWidth: '1px'
								},
								'&:hover fieldset': {
									borderColor: alpha(theme.palette.common.white, 0.3)
								},
								'&.Mui-focused fieldset': {
									borderColor: theme.palette.primary.light,
									borderWidth: '2px',
									boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.1)}`
								},
							},
							'& .MuiAutocomplete-input': {
								py: 0
							},
							'& .MuiInputBase-input::placeholder': {
								color: alpha(theme.palette.common.white, 0.3),
								opacity: 1
							}
						}}
					/>
				)}
				sx={{
					width: '100%',
					'& .MuiAutocomplete-popupIndicator': { color: alpha(theme.palette.common.white, 0.6) },
					'& .MuiAutocomplete-clearIndicator': { color: alpha(theme.palette.common.white, 0.6) }
				}}
			/>
		</Box>
	);
});

ProjectSelectionHeader.displayName = 'ProjectSelectionHeader';

export default ProjectSelectionHeader;
