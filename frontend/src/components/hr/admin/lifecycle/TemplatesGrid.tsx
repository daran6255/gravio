import React from 'react';
import { Box, Button, CircularProgress, Grid, Stack, Typography, alpha, useTheme } from '@mui/material';
import { AssignmentOutlined as EmptyIcon, AutoAwesome as SeedIcon } from '@mui/icons-material';
import type { HRChecklistTemplate } from '../../../../models/hr';
import TemplateCard from './TemplateCard';

interface TemplatesGridProps {
	templates: HRChecklistTemplate[];
	canManage: boolean;
	onCreateClick: () => void;
	onEdit: (template: HRChecklistTemplate) => void;
	onDelete: (template: HRChecklistTemplate) => void;
	onSeedDefaults: () => void;
	seeding: boolean;
}

const TemplatesGrid: React.FC<TemplatesGridProps> = ({ templates, canManage, onCreateClick, onEdit, onDelete, onSeedDefaults, seeding }) => {
	const theme = useTheme();

	if (templates.length === 0) {
		return (
			<Box sx={{ p: 6, textAlign: 'center', borderRadius: 4, border: `1px dashed ${theme.palette.divider}` }}>
				<EmptyIcon sx={{ fontSize: '3.5rem', color: 'text.disabled', mb: 2 }} />
				<Typography variant="h6" fontWeight={700}>No Checklist Templates</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
					Create templates outlining standard checklists for onboarding engineers, admins, exits, etc.
				</Typography>
				{canManage && (
					<Stack direction="row" spacing={1.5} justifyContent="center">
						<Button variant="contained" onClick={onCreateClick}>Create Template</Button>
						<Button
							variant="outlined"
							startIcon={seeding ? <CircularProgress size={16} color="inherit" /> : <SeedIcon />}
							onClick={onSeedDefaults}
							disabled={seeding}
							sx={{
								textTransform: 'none', fontWeight: 700, borderRadius: '12px',
								borderColor: alpha(theme.palette.primary.main, 0.35), color: 'primary.main',
								'&:hover': { borderColor: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.06) },
							}}
						>
							{seeding ? 'Adding Templates…' : 'Add Sample Templates'}
						</Button>
					</Stack>
				)}
			</Box>
		);
	}

	return (
		<Grid container spacing={3}>
			{templates.map((tmpl) => (
				<Grid size={{ xs: 12, sm: 6, md: 4 }} key={tmpl.id}>
					<TemplateCard
						template={tmpl}
						canManage={canManage}
						onEdit={() => onEdit(tmpl)}
						onDelete={() => onDelete(tmpl)}
					/>
				</Grid>
			))}
		</Grid>
	);
};

export default TemplatesGrid;
