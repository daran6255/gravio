import React from 'react';
import { Box, Typography } from '@mui/material';
import RichTextEditor from '../../../common/form/RichTextEditor';

interface NoteTabProps {
	description: string;
	setDescription: (val: string) => void;
	compact: boolean;
}

const NOTE_MAX_WORDS = 250;

const labelCaptionSx = {
	display: 'block',
	mb: 0.75,
	fontSize: '0.65rem',
	fontWeight: 700,
	textTransform: 'uppercase' as const,
	letterSpacing: '0.06em',
	color: 'text.secondary',
};

export const NoteTab: React.FC<NoteTabProps> = ({ description, setDescription, compact }) => {
	return (
		<Box sx={{ mb: 1.5 }}>
			<Typography sx={labelCaptionSx}>Note</Typography>
			<RichTextEditor
				value={description}
				onChange={setDescription}
				placeholder="Write your note here..."
				minHeight={compact ? 90 : 120}
				variant="simple"
				maxWords={NOTE_MAX_WORDS}
			/>
		</Box>
	);
};

export default NoteTab;
