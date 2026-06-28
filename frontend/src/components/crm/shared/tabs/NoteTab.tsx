import React from 'react';
import { Box } from '@mui/material';
import RichTextEditor from '../../../common/form/RichTextEditor';

interface NoteTabProps {
	description: string;
	setDescription: (val: string) => void;
	compact: boolean;
}

const NOTE_MAX_WORDS = 250;

export const NoteTab: React.FC<NoteTabProps> = ({ description, setDescription, compact }) => {
	return (
		<Box sx={{ mb: 1.5 }}>
			<RichTextEditor
				value={description}
				onChange={setDescription}
				placeholder="Write your note here..."
				minHeight={compact ? 90 : 100}
				variant="simple"
				maxWords={NOTE_MAX_WORDS}
			/>
		</Box>
	);
};

export default NoteTab;
